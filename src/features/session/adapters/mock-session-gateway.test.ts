import { createMockSessionGateway } from "./mock-session-gateway";
import { MOCK_PASSWORD, MOCK_VERIFICATION_CODE } from "./mock-session-fixtures";

async function setup() {
  let time = 0;
  const mock = createMockSessionGateway(() => time);
  const { credential } = await mock.gateway.login(
    "nguyen.minh.an",
    MOCK_PASSWORD,
  );
  await mock.gateway.changePassword(credential, MOCK_PASSWORD, "NewPass2026");
  return {
    ...mock,
    credential,
    advance: (ms: number) => {
      time += ms;
    },
  };
}

test("five bad codes exhaust attempts and valid code cannot bypass the limit", async () => {
  const { gateway, credential, currentChallenge } = await setup();
  const challenge = await gateway.sendCode(credential, "sms");
  for (let index = 0; index < 5; index++) {
    await expect(
      gateway.verifyCode(credential, challenge.id, "000000"),
    ).rejects.toMatchObject({
      code: "verification",
      challenge: { attemptsRemaining: 4 - index },
    });
  }
  await expect(
    gateway.verifyCode(credential, challenge.id, MOCK_VERIFICATION_CODE),
  ).rejects.toMatchObject({ code: "verification" });
  expect(currentChallenge("mock-staff-first")?.attemptsRemaining).toBe(0);
});

test("rejected resend preserves code; cooldown and total sends apply across channels", async () => {
  const { gateway, credential, advance } = await setup();
  const first = await gateway.sendCode(credential, "email");
  await expect(gateway.sendCode(credential, "sms")).rejects.toMatchObject({
    code: "verification",
  });
  advance(60_000);
  const second = await gateway.sendCode(credential, "sms");
  expect(second.sendsRemaining).toBe(1);
  await expect(
    gateway.verifyCode(credential, first.id, MOCK_VERIFICATION_CODE),
  ).rejects.toMatchObject({ code: "verification" });
  advance(60_000);
  const third = await gateway.sendCode(credential, "email");
  expect(third.sendsRemaining).toBe(0);
  advance(60_000);
  await expect(gateway.sendCode(credential, "sms")).rejects.toMatchObject({
    code: "verification",
  });
  await expect(
    gateway.verifyCode(credential, third.id, MOCK_VERIFICATION_CODE),
  ).resolves.toMatchObject({ nextAction: "ready" });
});

test("expired codes and codes from another account cannot complete onboarding", async () => {
  const { gateway, credential, advance } = await setup();
  const challenge = await gateway.sendCode(credential, "email");
  advance(300_000);
  await expect(
    gateway.verifyCode(credential, challenge.id, MOCK_VERIFICATION_CODE),
  ).rejects.toMatchObject({ code: "verification" });
  const other = await gateway.login("tran.thu.ha", MOCK_PASSWORD);
  await expect(
    gateway.verifyCode(other.credential, challenge.id, MOCK_VERIFICATION_CODE),
  ).rejects.toMatchObject({ code: "verification" });
});

test("a rejected resend does not invalidate the previous code", async () => {
  const { gateway, credential } = await setup();
  const code = await gateway.sendCode(credential, "email");
  await expect(gateway.sendCode(credential, "email")).rejects.toMatchObject({
    code: "verification",
  });
  await expect(
    gateway.verifyCode(credential, code.id, MOCK_VERIFICATION_CODE),
  ).resolves.toMatchObject({ nextAction: "ready" });
});
