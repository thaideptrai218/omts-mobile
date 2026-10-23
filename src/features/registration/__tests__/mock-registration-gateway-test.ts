import { createMockRegistrationGateway } from "../adapters/mock-registration-gateway";
import { createMockSessionGateway } from "@/features/session/adapters/mock-session-gateway";
import type { RegistrationFormData } from "../domain/registration-form";

const email: RegistrationFormData = {
  method: "email",
  identifier: "trader@example.invalid",
  password: "TraderPass2026",
};
function setup(delivery = true) {
  let time = 0;
  const registered = new Set<string>();
  const create = jest.fn((input: RegistrationFormData) => {
    registered.add(input.identifier);
  });
  const gateway = createMockRegistrationGateway({
    exists: (_, identifier) => registered.has(identifier),
    create,
    now: () => time,
    deliveryAvailable: () => delivery,
  });
  return {
    gateway,
    create,
    registered,
    advance: (ms: number) => {
      time += ms;
    },
  };
}
async function verified(
  gateway: ReturnType<typeof setup>["gateway"],
  input = email,
) {
  const start = await gateway.start(input);
  if (start.status !== "started") throw new Error("Expected challenge");
  const result = await gateway.verify(start.challenge.id, "246810");
  if (result.status !== "verified") throw new Error("Expected proof");
  return { challenge: start.challenge, proof: result.proof };
}

test.each([
  email,
  { ...email, method: "phone" as const, identifier: "0000000999" },
])(
  "$method creates only after verified proof and explicit completion",
  async (input) => {
    const { gateway, create } = setup();
    const { proof, challenge } = await verified(gateway, input);
    expect(challenge.purpose).toBe("traderRegistration");
    expect(challenge.channel).toBe(input.method === "email" ? "email" : "sms");
    expect(create).not.toHaveBeenCalled();
    expect(await gateway.complete(proof)).toEqual({ status: "created" });
    expect(create).toHaveBeenCalledWith(input);
    expect(await gateway.complete(proof)).toEqual({
      status: "attempt-invalid",
    });
    expect(create).toHaveBeenCalledTimes(1);
  },
);

test("duplicate identifiers, including declared unverified Staff contacts, cannot register", async () => {
  const { registrationGateway } = createMockSessionGateway();
  for (const identifier of ["ha@example.invalid", "an@example.invalid"])
    expect(await registrationGateway.start({ ...email, identifier })).toEqual({
      status: "unavailable",
    });
});

test("resend rotates OTP, preserves own TTL and limits sends", async () => {
  const { gateway, advance } = setup();
  const first = await gateway.start(email);
  if (first.status !== "started") throw new Error("Expected challenge");
  expect(await gateway.resend(first.challenge.id)).toEqual(first.challenge);
  advance(60_000);
  const second = await gateway.resend(first.challenge.id);
  expect(second.expiresAtEpochMs).toBe(360_000);
  expect(await gateway.verify(first.challenge.id, "246810")).toMatchObject({
    status: "invalid",
  });
  expect(await gateway.verify(second.id, "246810")).toMatchObject({
    status: "invalid",
  });
  advance(60_000);
  const third = await gateway.resend(second.id);
  expect(third.attemptsRemaining).toBe(4);
  expect(third.sendsRemaining).toBe(0);
  expect(await gateway.resend(third.id)).toEqual(third);
  expect(await gateway.verify(third.id, "246812")).toMatchObject({
    status: "verified",
  });
});

test("five wrong entries cannot be bypassed by resend or restarting in the same window", async () => {
  const { gateway, advance, create } = setup();
  const first = await gateway.start(email);
  if (first.status !== "started") throw new Error("Expected challenge");
  for (let index = 0; index < 5; index++)
    await gateway.verify(first.challenge.id, "000000");
  advance(60_000);
  expect(await gateway.verify(first.challenge.id, "246810")).toMatchObject({
    status: "invalid",
    challenge: { attemptsRemaining: 0 },
  });
  expect((await gateway.resend(first.challenge.id)).id).toBe(
    first.challenge.id,
  );
  await expect(gateway.start(email)).rejects.toMatchObject({
    code: "verification",
  });
  expect(create).not.toHaveBeenCalled();
});

test("expired code or proof never creates an account", async () => {
  const { gateway, advance, create } = setup();
  const first = await gateway.start(email);
  if (first.status !== "started") throw new Error("Expected challenge");
  advance(300_000);
  expect(await gateway.verify(first.challenge.id, "246810")).toMatchObject({
    status: "invalid",
  });
  const next = await verified(gateway);
  advance(300_000);
  expect(await gateway.complete(next.proof)).toEqual({
    status: "attempt-invalid",
  });
  expect(create).not.toHaveBeenCalled();
});

test("cancellation and other-purpose proof cannot create an account", async () => {
  const { gateway, create } = setup();
  const { proof, challenge } = await verified(gateway);
  expect(await gateway.complete({ handle: "mock-recovery-proof-2" })).toEqual({
    status: "attempt-invalid",
  });
  gateway.cancel(challenge.id);
  expect(await gateway.complete(proof)).toEqual({ status: "attempt-invalid" });
  expect(create).not.toHaveBeenCalled();
});

test("duplicate is checked again at creation, without overwriting another account", async () => {
  const { gateway, registered, create } = setup();
  const { proof } = await verified(gateway);
  registered.add(email.identifier);
  expect(await gateway.complete(proof)).toEqual({ status: "unavailable" });
  expect(await gateway.complete(proof)).toEqual({ status: "attempt-invalid" });
  expect(create).not.toHaveBeenCalled();
});

test("delivery failure cannot create or activate an account", async () => {
  const { gateway, create } = setup(false);
  await expect(gateway.start(email)).rejects.toMatchObject({
    code: "unavailable",
  });
  expect(create).not.toHaveBeenCalled();
});

test("cancelled OTP cannot verify while another contact keeps its independent attempt", async () => {
  const { gateway, create } = setup();
  const first = await gateway.start(email);
  const second = await gateway.start({
    ...email,
    identifier: "another@example.invalid",
  });
  if (first.status !== "started" || second.status !== "started")
    throw new Error("Expected independent challenges");
  gateway.cancel(first.challenge.id);
  expect(await gateway.verify(first.challenge.id, "246810")).toMatchObject({
    status: "invalid",
  });
  const result = await gateway.verify(second.challenge.id, "246810");
  if (result.status !== "verified") throw new Error("Expected second proof");
  expect(await gateway.complete(result.proof)).toEqual({ status: "created" });
  expect(create).toHaveBeenCalledTimes(1);
  expect(create).toHaveBeenCalledWith({
    ...email,
    identifier: "another@example.invalid",
  });
});

test("parallel confirmations of one proof create at most one mock account", async () => {
  const { gateway, create } = setup();
  const { proof } = await verified(gateway);
  expect(
    await Promise.all([gateway.complete(proof), gateway.complete(proof)]),
  ).toEqual([{ status: "created" }, { status: "attempt-invalid" }]);
  expect(create).toHaveBeenCalledTimes(1);
});

test.each([
  email,
  { ...email, method: "phone" as const, identifier: "0000000999" },
])(
  "shared $method account logs in only after creation and has no Staff grants/catalog",
  async (input) => {
    const server = createMockSessionGateway();
    const { proof } = await verified(server.registrationGateway, input);
    await expect(
      server.gateway.login(input.identifier, input.password),
    ).rejects.toMatchObject({ code: "credentials" });
    await server.registrationGateway.complete(proof);
    const lease = await server.gateway.login(input.identifier, input.password);
    expect(lease.session).toMatchObject({
      subjectType: "Trader",
      grants: [],
      nextAction: "ready",
    });
    const profile = await server.profileGateway.load(lease.credential);
    expect(profile.account.accountTypeLabel).toBe("Thương lái");
    expect(profile.account.accessSummary).toEqual([]);
    await expect(async () =>
      server.notificationGateway.load(lease.credential),
    ).rejects.toMatchObject({ code: "unavailable" });
    expect(await server.registrationGateway.start(input)).toEqual({
      status: "unavailable",
    });
  },
);

test("new Trader uses the shared profile/recovery source without changing Staff accounts", async () => {
  const server = createMockSessionGateway();
  const staff = await server.gateway.login("tran.thu.ha", "OmtsDemo2026");
  const { proof } = await verified(server.registrationGateway);
  await server.registrationGateway.complete(proof);
  const trader = await server.gateway.login(email.identifier, email.password);
  const profile = await server.profileGateway.load(trader.credential);
  await server.profileGateway.save(trader.credential, {
    displayName: "Thương lái thử nghiệm",
    expectedRevision: profile.revision,
  });
  const request = await server.recoveryGateway.start(email.identifier);
  const verification = await server.recoveryGateway.verify(
    request.id,
    "246810",
  );
  if (verification.status !== "verified")
    throw new Error("Expected recovery proof");
  await server.recoveryGateway.complete(
    verification.proof,
    "RecoveredTrader2026",
  );
  await expect(server.gateway.inspect(trader.credential)).rejects.toMatchObject(
    { code: "expired" },
  );
  const login = await server.gateway.login(
    email.identifier,
    "RecoveredTrader2026",
  );
  expect(login.session).toMatchObject({
    subjectType: "Trader",
    displayName: "Thương lái thử nghiệm",
    grants: [],
  });
  expect(await server.gateway.inspect(staff.credential)).toEqual(staff.session);
});
