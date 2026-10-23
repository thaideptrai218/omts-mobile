import { createMockSessionGateway } from "@/features/session/adapters/mock-session-gateway";
import { createMemorySessionCredentials } from "@/features/session/adapters/memory-session-credentials";
import { createMobileSessionStore } from "@/features/session/state/mobile-session-store";
import {
  MOCK_PASSWORD,
  MOCK_VERIFICATION_CODE,
} from "@/features/session/adapters/mock-session-fixtures";
import { createMockRecoveryGateway } from "../adapters/mock-recovery-gateway";

function setup(eligible = true) {
  let now = 0;
  const replacePassword = jest.fn();
  const gateway = createMockRecoveryGateway(
    () =>
      eligible ? { accountId: "synthetic-account", replacePassword } : null,
    () => now,
  );
  return {
    gateway,
    replacePassword,
    advance: (milliseconds: number) => {
      now += milliseconds;
    },
  };
}

test("eligible and ineligible contacts receive identical public request envelopes", async () => {
  expect(await setup(true).gateway.start("ha@example.invalid")).toEqual(
    await setup(false).gateway.start("ha@example.invalid"),
  );
});

test.each([60_000, 299_999])(
  "REC-REV-01: resend at %i ms gives the new code its own five-minute lifetime",
  async (sentAt) => {
    const { gateway, advance } = setup();
    const first = await gateway.start("ha@example.invalid");
    advance(sentAt);
    const second = await gateway.resend(first.id);

    expect(second.expiresAtEpochMs - sentAt).toBe(300_000);
    expect(second.id).not.toBe(first.id);
    expect(
      await gateway.verify(first.id, MOCK_VERIFICATION_CODE),
    ).toMatchObject({ status: "invalid" });
  },
);

test.each([
  { elapsed: 299_999, status: "verified" },
  { elapsed: 300_000, status: "invalid" },
])(
  "resent code is $status at its own lifetime boundary $elapsed",
  async ({ elapsed, status }) => {
    const { gateway, advance } = setup();
    const first = await gateway.start("ha@example.invalid");
    advance(60_000);
    const second = await gateway.resend(first.id);
    advance(elapsed);

    expect(await gateway.verify(second.id, "246811")).toMatchObject({ status });
  },
);

test("resend and crossing the first window do not refill the active code's wrong-entry budget", async () => {
  const { gateway, advance } = setup();
  const first = await gateway.start("ha@example.invalid");
  await gateway.verify(first.id, "000000");
  await gateway.verify(first.id, "000000");
  advance(60_000);
  const second = await gateway.resend(first.id);
  expect(second.attemptsRemaining).toBe(3);
  advance(240_001);
  for (let index = 0; index < 3; index++)
    await gateway.verify(second.id, "000000");

  expect(await gateway.verify(second.id, "246811")).toMatchObject({
    status: "invalid",
    challenge: { attemptsRemaining: 0 },
  });
  expect(await gateway.resend(second.id)).toMatchObject({
    id: second.id,
    attemptsRemaining: 0,
  });
});

test("crossing the first window does not refill sends or replace an active third code", async () => {
  const { gateway, advance } = setup();
  const first = await gateway.start("ha@example.invalid");
  advance(60_000);
  const second = await gateway.resend(first.id);
  advance(60_000);
  const third = await gateway.resend(second.id);
  advance(180_001);

  expect(third.sendsRemaining).toBe(0);
  expect(await gateway.resend(third.id)).toEqual(third);
  expect(await gateway.verify(third.id, "246812")).toMatchObject({
    status: "verified",
  });
});

test("valid OTP permits one password reset, not a session; invalid password does not consume proof", async () => {
  const { gateway, replacePassword } = setup();
  const challenge = await gateway.start("ha@example.invalid");
  const result = await gateway.verify(challenge.id, MOCK_VERIFICATION_CODE);
  if (result.status !== "verified") throw new Error("Expected proof");
  await expect(gateway.complete(result.proof, "short")).rejects.toThrow(
    "Invalid recovery password",
  );
  expect(await gateway.complete(result.proof, "NewPass2026")).toEqual({
    status: "completed",
  });
  expect(replacePassword).toHaveBeenCalledTimes(1);
  expect(await gateway.complete(result.proof, "AnotherPass2026")).toEqual({
    status: "attempt-invalid",
  });
  expect(
    await gateway.complete({ handle: "mock-session-1" }, "AnotherPass2026"),
  ).toEqual({ status: "attempt-invalid" });
});

test("unknown or unverified contact never receives a proof even with the demo OTP", async () => {
  const { gateway, replacePassword } = setup(false);
  const challenge = await gateway.start("missing@example.invalid");
  expect(
    await gateway.verify(challenge.id, MOCK_VERIFICATION_CODE),
  ).toMatchObject({ status: "invalid" });
  expect(replacePassword).not.toHaveBeenCalled();
});

test("wrong codes exhaust five attempts and restarting cannot refill the same window", async () => {
  const { gateway, advance } = setup();
  const challenge = await gateway.start("ha@example.invalid");
  for (let index = 0; index < 5; index++)
    await gateway.verify(challenge.id, "000000");
  expect(
    await gateway.verify(challenge.id, MOCK_VERIFICATION_CODE),
  ).toMatchObject({ status: "invalid", challenge: { attemptsRemaining: 0 } });
  advance(60_000);
  const next = await gateway.start("ha@example.invalid");
  expect(next.attemptsRemaining).toBe(0);
  expect(await gateway.verify(next.id, MOCK_VERIFICATION_CODE)).toMatchObject({
    status: "invalid",
  });
});

test("resend enforces cooldown, rotates code/id, invalidates the old code and limits sends", async () => {
  const { gateway, advance } = setup();
  const first = await gateway.start("ha@example.invalid");
  expect(await gateway.resend(first.id)).toEqual(first);
  advance(60_000);
  const second = await gateway.resend(first.id);
  expect(second.id).not.toBe(first.id);
  expect(await gateway.verify(first.id, MOCK_VERIFICATION_CODE)).toMatchObject({
    status: "invalid",
  });
  expect(await gateway.verify(second.id, MOCK_VERIFICATION_CODE)).toMatchObject(
    { status: "invalid" },
  );
  advance(60_000);
  const third = await gateway.resend(second.id);
  expect(third.sendsRemaining).toBe(0);
  expect(await gateway.resend(third.id)).toEqual(third);
  expect(await gateway.verify(third.id, "246812")).toMatchObject({
    status: "verified",
  });
});

test("expired code and expired proof cannot change password", async () => {
  const { gateway, advance, replacePassword } = setup();
  const challenge = await gateway.start("ha@example.invalid");
  advance(300_000);
  expect(
    await gateway.verify(challenge.id, MOCK_VERIFICATION_CODE),
  ).toMatchObject({ status: "invalid" });
  const next = await gateway.start("ha@example.invalid");
  const result = await gateway.verify(next.id, MOCK_VERIFICATION_CODE);
  if (result.status !== "verified") throw new Error("Expected proof");
  advance(300_000);
  expect(await gateway.complete(result.proof, "NewPass2026")).toEqual({
    status: "attempt-invalid",
  });
  expect(replacePassword).not.toHaveBeenCalled();
});

test("changing method/cancelling invalidates unused challenge and verified proof", async () => {
  const { gateway } = setup();
  const first = await gateway.start("ha@example.invalid");
  const proof = await gateway.verify(first.id, MOCK_VERIFICATION_CODE);
  if (proof.status !== "verified") throw new Error("Expected proof");
  gateway.cancel(first.id);
  await gateway.start("0000000123");
  expect(await gateway.complete(proof.proof, "NewPass2026")).toEqual({
    status: "attempt-invalid",
  });
  expect(
    await gateway.verify("mock-code-1", MOCK_VERIFICATION_CODE),
  ).toMatchObject({ status: "invalid" });
});

test("mock recovery changes the auth password, revokes all old leases and preserves profile/grants", async () => {
  const { gateway, recoveryGateway } = createMockSessionGateway();
  const first = await gateway.login("tran.thu.ha", MOCK_PASSWORD);
  const second = await gateway.login("tran.thu.ha", MOCK_PASSWORD);
  const challenge = await recoveryGateway.start("ha@example.invalid");
  const verified = await recoveryGateway.verify(
    challenge.id,
    MOCK_VERIFICATION_CODE,
  );
  if (verified.status !== "verified") throw new Error("Expected proof");
  expect(await recoveryGateway.complete(verified.proof, "NewPass2026")).toEqual(
    { status: "completed" },
  );
  await expect(gateway.inspect(first.credential)).rejects.toMatchObject({
    code: "expired",
  });
  await expect(gateway.refresh(second.credential)).rejects.toMatchObject({
    code: "expired",
  });
  await expect(
    gateway.login("tran.thu.ha", MOCK_PASSWORD),
  ).rejects.toMatchObject({ code: "credentials" });
  const next = await gateway.login("tran.thu.ha", "NewPass2026");
  expect(next.session).toEqual(first.session);
});

test("first-login Staff cannot reset through a declared but unverified contact", async () => {
  const { recoveryGateway } = createMockSessionGateway();
  for (const identifier of [
    "an@example.invalid",
    "0000000123",
    "tran.thu.ha",
  ]) {
    const challenge = await recoveryGateway.start(identifier);
    expect(
      await recoveryGateway.verify(challenge.id, MOCK_VERIFICATION_CODE),
    ).toMatchObject({ status: "invalid" });
  }
});

test("delivery failure keeps the same public envelope and cannot reset the password", async () => {
  const replacePassword = jest.fn();
  const failed = createMockRecoveryGateway(
    () => ({ accountId: "synthetic-account", replacePassword }),
    () => 0,
    () => false,
  );
  const normal = createMockRecoveryGateway(
    () => ({ accountId: "synthetic-account", replacePassword }),
    () => 0,
  );
  const challenge = await failed.start("ha@example.invalid");
  expect(challenge).toEqual(await normal.start("ha@example.invalid"));
  expect(
    await failed.verify(challenge.id, MOCK_VERIFICATION_CODE),
  ).toMatchObject({ status: "invalid" });
  expect(replacePassword).not.toHaveBeenCalled();
});

test("verified SMS can recover the same declared contact without verifying its email", async () => {
  const { gateway, recoveryGateway } = createMockSessionGateway();
  const lease = await gateway.login("nguyen.minh.an", MOCK_PASSWORD);
  await gateway.changePassword(
    lease.credential,
    MOCK_PASSWORD,
    "BeforeReset2026",
  );
  const onboarding = await gateway.sendCode(lease.credential, "sms");
  await gateway.verifyCode(
    lease.credential,
    onboarding.id,
    MOCK_VERIFICATION_CODE,
  );
  const challenge = await recoveryGateway.start("0000000123");
  expect(challenge.channel).toBe("sms");
  const result = await recoveryGateway.verify(
    challenge.id,
    MOCK_VERIFICATION_CODE,
  );
  if (result.status !== "verified") throw new Error("Expected SMS proof");
  await recoveryGateway.complete(result.proof, "AfterReset2026");
  const next = await gateway.login("nguyen.minh.an", "AfterReset2026");
  expect(next.session.nextAction).toBe("ready");
  expect(
    next.session.contacts.find((contact) => contact.channel === "email")
      ?.verified,
  ).toBe(false);
});

test("an old app session tears down with MSG19 reason on its next protected request after reset", async () => {
  const { gateway, recoveryGateway } = createMockSessionGateway();
  const repository = createMemorySessionCredentials();
  const store = createMobileSessionStore({
    gateway,
    repository,
    isOffline: () => false,
  });
  await store.bootstrap();
  await store.login("tran.thu.ha", MOCK_PASSWORD);
  const otherAccount = await gateway.login("nguyen.minh.an", MOCK_PASSWORD);
  const challenge = await recoveryGateway.start("ha@example.invalid");
  const verified = await recoveryGateway.verify(
    challenge.id,
    MOCK_VERIFICATION_CODE,
  );
  if (verified.status !== "verified") throw new Error("Expected proof");
  await recoveryGateway.complete(verified.proof, "NewPass2026");

  await expect(store.reloadSession()).rejects.toMatchObject({
    code: "expired",
  });
  expect(store.getSnapshot()).toEqual({
    status: "signedOut",
    reason: "sessionExpired",
  });
  expect(await repository.read()).toBeNull();
  expect(await gateway.inspect(otherAccount.credential)).toEqual(
    otherAccount.session,
  );
});
