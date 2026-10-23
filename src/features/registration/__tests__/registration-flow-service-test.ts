import { createMockRegistrationGateway } from "../adapters/mock-registration-gateway";
import { createRegistrationFlowService } from "../services/registration-flow-service";
import { deferredResult } from "@/shared/testing/deferred-result";

const input = {
  method: "email" as const,
  identifier: "trader@example.invalid",
  password: "TraderPass2026",
};
function setup() {
  let offline = false;
  let time = 0;
  const create = jest.fn();
  const gateway = createMockRegistrationGateway({
    exists: () => false,
    create,
    now: () => time,
  });
  const service = createRegistrationFlowService(gateway, () => offline);
  return {
    service,
    gateway,
    create,
    offline: (value: boolean) => {
      offline = value;
    },
    advance: (ms: number) => {
      time += ms;
    },
  };
}
test("verification hides proof and requires explicit one-use completion", async () => {
  const { service, create } = setup();
  await service.start(input);
  expect(await service.verify("246810")).toEqual({ status: "verified" });
  expect(create).not.toHaveBeenCalled();
  expect(await service.complete()).toEqual({ status: "created" });
  expect(await service.complete()).toEqual({ status: "attempt-invalid" });
  expect(create).toHaveBeenCalledTimes(1);
});

test("offline operations do not call adapters; resolved offline permits only manual retry", async () => {
  const { service, gateway, offline, create } = setup();
  const start = jest.spyOn(gateway, "start");
  const verify = jest.spyOn(gateway, "verify");
  const resend = jest.spyOn(gateway, "resend");
  const complete = jest
    .spyOn(gateway, "complete")
    .mockResolvedValueOnce({ status: "offline" });
  offline(true);
  await expect(service.start(input)).rejects.toMatchObject({ code: "offline" });
  expect(start).not.toHaveBeenCalled();
  offline(false);
  await service.start(input);
  offline(true);
  await expect(service.verify("246810")).rejects.toMatchObject({
    code: "offline",
  });
  await expect(service.resend()).rejects.toMatchObject({ code: "offline" });
  expect(verify).not.toHaveBeenCalled();
  expect(resend).not.toHaveBeenCalled();
  offline(false);
  await service.verify("246810");
  offline(true);
  expect(await service.complete()).toEqual({ status: "offline" });
  expect(complete).not.toHaveBeenCalled();
  offline(false);
  expect(await service.complete()).toEqual({ status: "offline" });
  expect(create).not.toHaveBeenCalled();
  expect(complete).toHaveBeenCalledTimes(1);
  expect(await service.complete()).toEqual({ status: "created" });
  expect(create).toHaveBeenCalledTimes(1);
});

test("restart cancels verified proof and does not create an account", async () => {
  const { service, create } = setup();
  await service.start(input);
  await service.verify("246810");
  service.reset();
  expect(await service.complete()).toEqual({ status: "attempt-invalid" });
  expect(create).not.toHaveBeenCalled();
});

test.each(["start", "verify", "resend"] as const)(
  "late %s cannot revive a disposed flow",
  async (action) => {
    const { service, gateway, advance, create } = setup();
    const release = deferredResult<void>();
    const entered = deferredResult<void>();
    const cancel = jest.spyOn(gateway, "cancel");
    if (action !== "start") await service.start(input);
    advance(60_000);
    if (action === "start") {
      const start = gateway.start;
      jest.spyOn(gateway, "start").mockImplementationOnce(async (value) => {
        const result = await start(value);
        entered.resolve();
        await release.promise;
        return result;
      });
    } else if (action === "verify") {
      const verify = gateway.verify;
      jest.spyOn(gateway, "verify").mockImplementationOnce(async (...args) => {
        const result = await verify(...args);
        entered.resolve();
        await release.promise;
        return result;
      });
    } else {
      const resend = gateway.resend;
      jest.spyOn(gateway, "resend").mockImplementationOnce(async (value) => {
        const result = await resend(value);
        entered.resolve();
        await release.promise;
        return result;
      });
    }
    const pending =
      action === "start"
        ? service.start(input)
        : action === "verify"
          ? service.verify("246810")
          : service.resend();
    const rejected = expect(pending).rejects.toMatchObject({
      code: "unavailable",
    });
    await entered.promise;
    service.dispose();
    service.activate();
    release.resolve();
    await rejected;
    expect(cancel).toHaveBeenCalledWith(
      action === "resend"
        ? "mock-registration-code-2"
        : "mock-registration-code-1",
    );
    expect(await service.complete()).toEqual({ status: "attempt-invalid" });
    expect(create).not.toHaveBeenCalled();
  },
);

test("late completed creation cannot reopen disposed flow and is not claimed to roll back", async () => {
  const { service, gateway, create } = setup();
  await service.start(input);
  await service.verify("246810");
  const release = deferredResult<void>();
  const entered = deferredResult<void>();
  const complete = gateway.complete;
  jest.spyOn(gateway, "complete").mockImplementationOnce(async (proof) => {
    const result = await complete(proof);
    entered.resolve();
    await release.promise;
    return result;
  });
  const pending = service.complete();
  await entered.promise;
  service.dispose();
  release.resolve();
  expect(await pending).toEqual({ status: "attempt-invalid" });
  expect(create).toHaveBeenCalledTimes(1);
});

test("offline does not extend proof lifetime", async () => {
  const { service, gateway, advance, create } = setup();
  await service.start(input);
  await service.verify("246810");
  jest.spyOn(gateway, "complete").mockResolvedValueOnce({ status: "offline" });
  expect(await service.complete()).toEqual({ status: "offline" });
  advance(300_000);
  expect(await service.complete()).toEqual({ status: "attempt-invalid" });
  expect(create).not.toHaveBeenCalled();
});

test("a rejected completion remains retryable without an automatic account creation", async () => {
  const { service, gateway, create } = setup();
  await service.start(input);
  await service.verify("246810");
  const complete = jest
    .spyOn(gateway, "complete")
    .mockRejectedValueOnce(new Error("Synthetic transport failure"));
  await expect(service.complete()).rejects.toThrow(
    "Synthetic transport failure",
  );
  expect(complete).toHaveBeenCalledTimes(1);
  expect(create).not.toHaveBeenCalled();
  expect(await service.complete()).toEqual({ status: "created" });
  expect(complete).toHaveBeenCalledTimes(2);
  expect(create).toHaveBeenCalledTimes(1);
});

test("late completion cannot clear a newer attempt's verified proof", async () => {
  const { service, gateway, create } = setup();
  await service.start(input);
  await service.verify("246810");
  const entered = deferredResult<void>();
  const release = deferredResult<void>();
  const complete = gateway.complete;
  jest.spyOn(gateway, "complete").mockImplementationOnce(async (proof) => {
    const result = await complete(proof);
    entered.resolve();
    await release.promise;
    return result;
  });
  const oldCompletion = service.complete();
  await entered.promise;
  await service.start({ ...input, identifier: "another@example.invalid" });
  await service.verify("246810");
  release.resolve();
  expect(await oldCompletion).toEqual({ status: "attempt-invalid" });
  expect(await service.complete()).toEqual({ status: "created" });
  expect(create).toHaveBeenCalledTimes(2);
  expect(create.mock.calls[1][0].identifier).toBe("another@example.invalid");
});
