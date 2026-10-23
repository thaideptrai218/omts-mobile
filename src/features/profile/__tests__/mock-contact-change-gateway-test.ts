import { MOCK_PASSWORD } from "@/features/session/adapters/mock-session-fixtures";
import { createMockContactChangeGateway } from "../adapters/mock-contact-change-gateway";
import { contactChangeFixture } from "../testing/contact-change-fixture";
import type { ContactChangeStartResult } from "../services/contact-change-gateway";

function challenge(result: ContactChangeStartResult) {
  if (result.status !== "started")
    throw new Error("Expected contact challenge");
  return result.challenge;
}

test("a delivery failure cannot change the old contact or emit a successful start", async () => {
  const { server, credential, input, profile } = await contactChangeFixture();
  const account = {
    session: await server.gateway.inspect(credential),
    profileRevision: 1,
  };
  const replace = jest.fn();
  const gateway = createMockContactChangeGateway({
    resolveOwner: () => account,
    currentIdentifier: () => "ha@example.invalid",
    isTaken: () => false,
    replace,
    deliveryAvailable: () => false,
  });
  await expect(gateway.start(credential, input)).rejects.toMatchObject({
    code: "unavailable",
  });
  expect(replace).not.toHaveBeenCalled();
  expect(await server.profileGateway.load(credential)).toEqual(profile);
});
test("a replacement rejected before writing keeps the contact, revision and attempt for manual retry", async () => {
  const { server, credential, input } = await contactChangeFixture();
  const account = {
    session: await server.gateway.inspect(credential),
    profileRevision: 1,
  };
  const before = JSON.stringify(account);
  const replace = jest.fn().mockImplementationOnce(() => {
    throw new Error("Synthetic pre-write failure");
  });
  const gateway = createMockContactChangeGateway({
    resolveOwner: () => account,
    currentIdentifier: () => "ha@example.invalid",
    isTaken: () => false,
    replace,
  });
  const pending = challenge(await gateway.start(credential, input));
  await expect(
    gateway.verify(credential, pending.id, "246810"),
  ).rejects.toThrow("Synthetic pre-write failure");
  expect(JSON.stringify(account)).toBe(before);
  expect(replace).toHaveBeenCalledTimes(1);
  replace.mockImplementationOnce(() => {
    account.session = {
      ...account.session,
      contacts: [
        {
          channel: "email",
          maskedRecipient: "n***@example.invalid",
          verified: true,
        },
      ],
    };
    account.profileRevision++;
  });
  await expect(
    gateway.verify(credential, pending.id, "246810"),
  ).resolves.toMatchObject({
    status: "saved",
    profile: {
      revision: "mock-profile-mock-staff-ready-2",
      account: { email: { value: "n***@example.invalid", verified: true } },
    },
  });
  expect(replace).toHaveBeenCalledTimes(2);
  await expect(
    gateway.verify(credential, pending.id, "246810"),
  ).rejects.toMatchObject({ code: "verification" });
  expect(replace).toHaveBeenCalledTimes(2);
});

test.each([
  {
    channel: "email" as const,
    identifier: "new.ha@example.invalid",
    old: "ha@example.invalid",
  },
  { channel: "sms" as const, identifier: "0000000999", old: null },
])(
  "$channel add/replacement preserves identity and only updates after correct verification",
  async ({ channel, identifier, old }) => {
    const { server, profile, credential } = await contactChangeFixture();
    const before = await server.gateway.inspect(credential);
    const attempt = challenge(
      await server.contactChangeGateway.start(credential, {
        channel,
        identifier,
        expectedRevision: profile.revision,
      }),
    );
    expect(attempt.purpose).toBe("profileContactChange");
    expect(await server.profileGateway.load(credential)).toEqual(profile);
    await expect(
      server.gateway.login(identifier, MOCK_PASSWORD),
    ).rejects.toMatchObject({ code: "credentials" });
    if (old)
      await expect(
        server.gateway.login(old, MOCK_PASSWORD),
      ).resolves.toBeDefined();
    expect(
      await server.contactChangeGateway.verify(
        credential,
        attempt.id,
        "000000",
      ),
    ).toMatchObject({ status: "invalid" });
    expect(await server.profileGateway.load(credential)).toEqual(profile);
    const saved = await server.contactChangeGateway.verify(
      credential,
      attempt.id,
      "246810",
    );
    expect(saved.status).toBe("saved");
    if (old)
      await expect(
        server.gateway.login(old, MOCK_PASSWORD),
      ).rejects.toMatchObject({ code: "credentials" });
    const lease = await server.gateway.login(identifier, MOCK_PASSWORD);
    expect(lease.session).toMatchObject({
      accountId: before.accountId,
      username: before.username,
      subjectType: before.subjectType,
      grants: before.grants,
      displayName: before.displayName,
    });
    await expect(
      server.contactChangeGateway.verify(credential, attempt.id, "246810"),
    ).rejects.toMatchObject({ code: "verification" });
  },
);

test("empty, unchanged and occupied contacts do not issue OTP", async () => {
  const { server, credential, input } = await contactChangeFixture();
  for (const identifier of ["", "ha@example.invalid", "an@example.invalid"])
    expect(
      await server.contactChangeGateway.start(credential, {
        ...input,
        identifier,
      }),
    ).toEqual({ status: "contact-invalid" });
  expect(
    challenge(await server.contactChangeGateway.start(credential, input))
      .sendsRemaining,
  ).toBe(2);
});

test("cancel and a foreign account or purpose cannot replace a contact", async () => {
  const { server, credential, input, profile } = await contactChangeFixture();
  const attempt = challenge(
    await server.contactChangeGateway.start(credential, input),
  );
  const foreign = await server.gateway.login("nguyen.minh.an", MOCK_PASSWORD);
  await server.gateway.changePassword(
    foreign.credential,
    MOCK_PASSWORD,
    "UpdatedPass2026",
  );
  const onboarding = await server.gateway.sendCode(foreign.credential, "email");
  await server.gateway.verifyCode(foreign.credential, onboarding.id, "246810");
  await expect(
    server.contactChangeGateway.verify(
      foreign.credential,
      attempt.id,
      "246810",
    ),
  ).rejects.toMatchObject({ code: "verification" });
  await expect(
    server.contactChangeGateway.verify(
      credential,
      "mock-recovery-code-1",
      "246810",
    ),
  ).rejects.toMatchObject({ code: "verification" });
  server.contactChangeGateway.cancel(attempt.id);
  await expect(
    server.contactChangeGateway.verify(credential, attempt.id, "246810"),
  ).rejects.toMatchObject({ code: "verification" });
  expect(await server.profileGateway.load(credential)).toEqual(profile);
});

test("resend cancels the old code, keeps independent TTL and does not refill attempts", async () => {
  const { server, credential, input, advance } = await contactChangeFixture();
  const first = challenge(
    await server.contactChangeGateway.start(credential, input),
  );
  expect(
    await server.contactChangeGateway.resend(credential, first.id),
  ).toEqual(first);
  await server.contactChangeGateway.verify(credential, first.id, "000000");
  advance(60_000);
  const second = await server.contactChangeGateway.resend(credential, first.id);
  expect(second).toMatchObject({
    expiresAtEpochMs: 360_000,
    attemptsRemaining: 4,
    sendsRemaining: 1,
  });
  await expect(
    server.contactChangeGateway.verify(credential, first.id, "246810"),
  ).rejects.toMatchObject({ code: "verification" });
  expect(
    await server.contactChangeGateway.verify(credential, second.id, "246810"),
  ).toMatchObject({ status: "invalid" });
  advance(60_000);
  const third = await server.contactChangeGateway.resend(credential, second.id);
  expect(third).toMatchObject({ attemptsRemaining: 3, sendsRemaining: 0 });
  expect(
    await server.contactChangeGateway.resend(credential, third.id),
  ).toEqual(third);
  expect(
    (await server.contactChangeGateway.verify(credential, third.id, "246812"))
      .status,
  ).toBe("saved");
});

test("expired OTP leaves the old contact active and can be resent within remaining limits", async () => {
  const { server, credential, input, advance, profile } =
    await contactChangeFixture();
  const first = challenge(
    await server.contactChangeGateway.start(credential, input),
  );
  advance(300_000);
  expect(
    (await server.contactChangeGateway.verify(credential, first.id, "246810"))
      .status,
  ).toBe("invalid");
  expect(await server.profileGateway.load(credential)).toEqual(profile);
  const next = await server.contactChangeGateway.resend(credential, first.id);
  expect(next.expiresAtEpochMs).toBe(600_000);
  expect(
    (await server.contactChangeGateway.verify(credential, next.id, "246810"))
      .status,
  ).toBe("saved");
});

test("five failures survive restarting the same target during its mock rate window", async () => {
  const { server, credential, input, advance, profile } =
    await contactChangeFixture();
  const first = challenge(
    await server.contactChangeGateway.start(credential, input),
  );
  for (let index = 0; index < 5; index++)
    await server.contactChangeGateway.verify(credential, first.id, "000000");
  advance(60_000);
  expect(
    (await server.contactChangeGateway.verify(credential, first.id, "246810"))
      .status,
  ).toBe("invalid");
  server.contactChangeGateway.cancel(first.id);
  await expect(
    server.contactChangeGateway.start(credential, input),
  ).rejects.toMatchObject({ code: "verification" });
  expect(await server.profileGateway.load(credential)).toEqual(profile);
});

test("profile revision is checked before issuance and again before replacement", async () => {
  const { server, credential, input, profile } = await contactChangeFixture();
  const first = challenge(
    await server.contactChangeGateway.start(credential, input),
  );
  await server.profileGateway.save(credential, {
    displayName: "Tên từ thiết bị khác",
    expectedRevision: profile.revision,
  });
  expect(
    await server.contactChangeGateway.verify(credential, first.id, "246810"),
  ).toEqual({ status: "conflict" });
  expect(await server.contactChangeGateway.start(credential, input)).toEqual({
    status: "conflict",
  });
  expect((await server.profileGateway.load(credential)).account.email).toEqual(
    profile.account.email,
  );
});

test("another account claiming the target after issuance cannot be overwritten", async () => {
  const { server, credential, input, profile } = await contactChangeFixture();
  const pending = challenge(
    await server.contactChangeGateway.start(credential, input),
  );
  const signup = await server.registrationGateway.start({
    method: "email",
    identifier: input.identifier,
    password: "TraderPass2026",
  });
  if (signup.status !== "started") throw new Error("Expected signup challenge");
  const proof = await server.registrationGateway.verify(
    signup.challenge.id,
    "246810",
  );
  if (proof.status !== "verified") throw new Error("Expected signup proof");
  await server.registrationGateway.complete(proof.proof);
  expect(
    await server.contactChangeGateway.verify(credential, pending.id, "246810"),
  ).toEqual({ status: "contact-invalid" });
  expect(await server.profileGateway.load(credential)).toEqual(profile);
  await expect(
    server.gateway.login(input.identifier, "TraderPass2026"),
  ).resolves.toMatchObject({ session: { subjectType: "Trader" } });
});

test.each(["code", "proof"] as const)(
  "old recovery %s cannot change a password after contact replacement",
  async (stage) => {
    const { server, credential, input } = await contactChangeFixture();
    const recovery = await server.recoveryGateway.start("ha@example.invalid");
    const oldProof =
      stage === "proof"
        ? await server.recoveryGateway.verify(recovery.id, "246810")
        : null;
    const pending = challenge(
      await server.contactChangeGateway.start(credential, input),
    );
    await server.contactChangeGateway.verify(credential, pending.id, "246810");
    if (stage === "code")
      expect(
        (await server.recoveryGateway.verify(recovery.id, "246810")).status,
      ).toBe("invalid");
    else {
      if (oldProof?.status !== "verified")
        throw new Error("Expected old proof");
      expect(
        await server.recoveryGateway.complete(
          oldProof.proof,
          "ChangedPass2026",
        ),
      ).toEqual({ status: "attempt-invalid" });
    }
    await expect(
      server.gateway.login(input.identifier, MOCK_PASSWORD),
    ).resolves.toBeDefined();
    const fresh = await server.recoveryGateway.start(input.identifier);
    expect(
      (await server.recoveryGateway.verify(fresh.id, "246810")).status,
    ).toBe("verified");
  },
);

test("a newly added phone can later be replaced without affecting email or grants", async () => {
  const { server, credential, input } = await contactChangeFixture();
  const first = challenge(
    await server.contactChangeGateway.start(credential, {
      ...input,
      channel: "sms",
      identifier: "0000000999",
    }),
  );
  const added = await server.contactChangeGateway.verify(
    credential,
    first.id,
    "246810",
  );
  if (added.status !== "saved") throw new Error("Expected added phone");
  const second = challenge(
    await server.contactChangeGateway.start(credential, {
      channel: "sms",
      identifier: "0000000888",
      expectedRevision: added.profile.revision,
    }),
  );
  await server.contactChangeGateway.verify(credential, second.id, "246810");
  await expect(
    server.gateway.login("0000000999", MOCK_PASSWORD),
  ).rejects.toMatchObject({ code: "credentials" });
  await expect(
    server.gateway.login("0000000888", MOCK_PASSWORD),
  ).resolves.toMatchObject({
    session: {
      subjectType: "Staff",
      grants: [{ zoneName: "Vùng Tây", roleName: "Quản lý vùng" }],
    },
  });
  await expect(
    server.gateway.login("ha@example.invalid", MOCK_PASSWORD),
  ).resolves.toBeDefined();
});
