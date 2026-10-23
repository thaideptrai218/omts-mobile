import { createMockRecoveryGateway } from "../adapters/mock-recovery-gateway";
import { createRecoveryFlowService } from "../services/recovery-flow-service";
import { MOCK_VERIFICATION_CODE } from "@/features/session/adapters/mock-session-fixtures";
import { deferredResult } from "@/shared/testing/deferred-result";

function setup() {
  let offline = false;
  const replacePassword = jest.fn();
  const gateway = createMockRecoveryGateway(() => ({
    accountId: "synthetic-account",
    replacePassword,
  }));
  const service = createRecoveryFlowService(gateway, () => offline);
  return {
    gateway,
    service,
    replacePassword,
    offline: (value: boolean) => {
      offline = value;
    },
  };
}

test("proof stays outside presentation results and successful completion clears recovery state", async () => {
  const { service, replacePassword } = setup();
  await service.start("ha@example.invalid");
  expect(await service.verify(MOCK_VERIFICATION_CODE)).toEqual({
    status: "verified",
  });
  expect(
    await service.completion.complete({ newPassword: "NewPass2026" }),
  ).toEqual({ status: "completed" });
  expect(
    await service.completion.complete({ newPassword: "AnotherPass2026" }),
  ).toEqual({ status: "attempt-invalid" });
  expect(replacePassword).toHaveBeenCalledTimes(1);
});

test("offline operations never call the gateway; offline completion retains valid proof for explicit retry", async () => {
  const { service, gateway, offline } = setup();
  const start = jest.spyOn(gateway, "start");
  const verify = jest.spyOn(gateway, "verify");
  const resend = jest.spyOn(gateway, "resend");
  const complete = jest.spyOn(gateway, "complete");
  offline(true);
  await expect(service.start("ha@example.invalid")).rejects.toMatchObject({
    code: "offline",
  });
  expect(start).not.toHaveBeenCalled();
  offline(false);
  await service.start("ha@example.invalid");
  offline(true);
  await expect(service.verify(MOCK_VERIFICATION_CODE)).rejects.toMatchObject({
    code: "offline",
  });
  await expect(service.resend()).rejects.toMatchObject({ code: "offline" });
  expect(verify).not.toHaveBeenCalled();
  expect(resend).not.toHaveBeenCalled();
  offline(false);
  await service.verify(MOCK_VERIFICATION_CODE);
  offline(true);
  expect(
    await service.completion.complete({ newPassword: "NewPass2026" }),
  ).toEqual({ status: "offline" });
  expect(complete).not.toHaveBeenCalled();
  offline(false);
  expect(complete).not.toHaveBeenCalled();
  expect(
    await service.completion.complete({ newPassword: "NewPass2026" }),
  ).toEqual({ status: "completed" });
});

test("reset/cancel invalidates proof before changing delivery method", async () => {
  const { service, replacePassword } = setup();
  await service.start("ha@example.invalid");
  await service.verify(MOCK_VERIFICATION_CODE);
  service.reset();
  expect(
    await service.completion.complete({ newPassword: "NewPass2026" }),
  ).toEqual({ status: "attempt-invalid" });
  expect(replacePassword).not.toHaveBeenCalled();
});

test("a request returning after disposal is cancelled even if the service is activated again", async () => {
  const { service, gateway } = setup();
  const entered = deferredResult<void>();
  const release = deferredResult<void>();
  const start = gateway.start;
  const cancel = jest.spyOn(gateway, "cancel");
  jest.spyOn(gateway, "start").mockImplementationOnce(async (...args) => {
    const challenge = await start(...args);
    entered.resolve();
    await release.promise;
    return challenge;
  });
  const request = service.start("ha@example.invalid");
  const rejected = expect(request).rejects.toMatchObject({
    code: "unavailable",
  });
  await entered.promise;
  service.dispose();
  service.activate();
  release.resolve();
  await rejected;
  expect(cancel).toHaveBeenCalledWith("mock-recovery-code-1");
  expect(
    await service.completion.complete({ newPassword: "NewPass2026" }),
  ).toEqual({ status: "attempt-invalid" });
});

test("late successful reset does not revive the disposed flow", async () => {
  const { service, gateway, replacePassword } = setup();
  await service.start("ha@example.invalid");
  await service.verify(MOCK_VERIFICATION_CODE);
  const release = deferredResult<void>();
  const entered = deferredResult<void>();
  const complete = gateway.complete;
  jest.spyOn(gateway, "complete").mockImplementationOnce(async (...args) => {
    const result = await complete(...args);
    entered.resolve();
    await release.promise;
    return result;
  });
  const pending = service.completion.complete({ newPassword: "NewPass2026" });
  await entered.promise;
  service.dispose();
  release.resolve();
  expect(await pending).toEqual({ status: "attempt-invalid" });
  expect(replacePassword).toHaveBeenCalledTimes(1);
});

test.each(["verify", "resend"] as const)(
  "late %s response cannot restore a disposed flow or leave a usable attempt",
  async (action) => {
    jest.useFakeTimers();
    try {
      const { service, gateway } = setup();
      await service.start("ha@example.invalid");
      jest.advanceTimersByTime(60_000);
      const release = deferredResult<void>();
      const entered = deferredResult<void>();
      const cancel = jest.spyOn(gateway, "cancel");
      const verify = gateway.verify;
      const resend = gateway.resend;
      if (action === "verify") {
        jest
          .spyOn(gateway, "verify")
          .mockImplementationOnce(async (...args) => {
            const result = await verify(...args);
            entered.resolve();
            await release.promise;
            return result;
          });
      } else {
        jest
          .spyOn(gateway, "resend")
          .mockImplementationOnce(async (...args) => {
            const result = await resend(...args);
            entered.resolve();
            await release.promise;
            return result;
          });
      }
      const pending =
        action === "verify"
          ? service.verify(MOCK_VERIFICATION_CODE)
          : service.resend();
      const rejected = expect(pending).rejects.toMatchObject({
        code: "unavailable",
      });
      await entered.promise;
      service.dispose();
      release.resolve();
      await rejected;
      const returnedId =
        action === "verify" ? "mock-recovery-code-1" : "mock-recovery-code-2";
      expect(cancel).toHaveBeenCalledWith(returnedId);
      expect(
        await gateway.verify(
          returnedId,
          action === "verify" ? MOCK_VERIFICATION_CODE : "246811",
        ),
      ).toMatchObject({ status: "invalid" });
      expect(
        await service.completion.complete({ newPassword: "ReviewPass2026" }),
      ).toEqual({ status: "attempt-invalid" });
    } finally {
      jest.useRealTimers();
    }
  },
);

test("an infrastructure rejection preserves the current proof without auto-retrying completion", async () => {
  const { service, gateway, replacePassword } = setup();
  await service.start("ha@example.invalid");
  await service.verify(MOCK_VERIFICATION_CODE);
  const complete = jest
    .spyOn(gateway, "complete")
    .mockRejectedValueOnce(new Error("Synthetic transport failure"));
  await expect(
    service.completion.complete({ newPassword: "ReviewPass2026" }),
  ).rejects.toThrow("Synthetic transport failure");
  expect(complete).toHaveBeenCalledTimes(1);
  expect(replacePassword).not.toHaveBeenCalled();
  expect(
    await service.completion.complete({ newPassword: "ReviewPass2026" }),
  ).toEqual({ status: "completed" });
  expect(complete).toHaveBeenCalledTimes(2);
});
