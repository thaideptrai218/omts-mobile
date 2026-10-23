import { MOCK_PASSWORD } from "@/features/session/adapters/mock-session-fixtures";
import { deferredResult } from "@/shared/testing/deferred-result";
import { contactChangeFixture } from "../testing/contact-change-fixture";

test("a rejected resend keeps the previous attempt available for manual verification", async () => {
  const { service, server, input, advance } = await contactChangeFixture();
  await service.start(input);
  advance(60_000);
  jest
    .spyOn(server.contactChangeGateway, "resend")
    .mockRejectedValueOnce(new Error("Synthetic pre-send failure"));
  await expect(service.resend()).rejects.toThrow("Synthetic pre-send failure");
  expect((await service.verify("246810")).status).toBe("saved");
});

test("a previous login's contact acceptance cannot alter a new login of the same account", async () => {
  const { scope, store } = await contactChangeFixture();
  await store.logout();
  await store.login("tran.thu.ha", MOCK_PASSWORD);
  const current = store.getSnapshot();
  scope.acceptContacts([
    { channel: "sms", maskedRecipient: "******9999", verified: true },
  ]);
  expect(store.getSnapshot()).toEqual(current);
});

test("successful verification updates the current session contacts without changing permissions", async () => {
  const { service, store, input } = await contactChangeFixture();
  const before = store.getSnapshot();
  await service.start(input);
  expect(store.getSnapshot()).toEqual(before);
  expect((await service.verify("246810")).status).toBe("saved");
  expect(store.getSnapshot()).toMatchObject({
    status: "active",
    session: {
      accountId: "mock-staff-ready",
      contacts: [
        {
          channel: "email",
          verified: true,
          maskedRecipient: "n***@example.invalid",
        },
      ],
      grants: [{ roleName: "Quản lý vùng", zoneName: "Vùng Tây" }],
    },
  });
});

test("offline never queues requests or discards a live attempt; retries are manual", async () => {
  const { service, server, input, offline } = await contactChangeFixture();
  const start = jest.spyOn(server.contactChangeGateway, "start");
  const verify = jest.spyOn(server.contactChangeGateway, "verify");
  const resend = jest.spyOn(server.contactChangeGateway, "resend");
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
  expect(verify).not.toHaveBeenCalled();
  expect((await service.verify("246810")).status).toBe("saved");
});

test("reset invalidates the old OTP without changing the profile", async () => {
  const { service, server, credential, profile, input } =
    await contactChangeFixture();
  await service.start(input);
  service.reset();
  await expect(service.verify("246810")).rejects.toMatchObject({
    code: "verification",
  });
  expect(await server.profileGateway.load(credential)).toEqual(profile);
});

test("a source from an earlier login cannot issue requests for a later account", async () => {
  const { service, store, server, input } = await contactChangeFixture();
  await store.logout();
  await store.login("nguyen.minh.an", MOCK_PASSWORD);
  const start = jest.spyOn(server.contactChangeGateway, "start");
  await expect(service.start(input)).rejects.toMatchObject({ code: "expired" });
  expect(start).not.toHaveBeenCalled();
  expect(store.getSnapshot()).toMatchObject({
    status: "active",
    session: { accountId: "mock-staff-first" },
  });
});

test.each(["start", "resend"] as const)(
  "late %s cancels the returned challenge even when the owning session ended",
  async (action) => {
    const { service, server, store, input, advance } =
      await contactChangeFixture();
    if (action === "resend") {
      await service.start(input);
      advance(60_000);
    }
    const entered = deferredResult<void>();
    const release = deferredResult<void>();
    const cancel = jest.spyOn(server.contactChangeGateway, "cancel");
    let returnedId = "";
    if (action === "start") {
      const original = server.contactChangeGateway.start;
      jest
        .spyOn(server.contactChangeGateway, "start")
        .mockImplementationOnce(async (...args) => {
          const result = await original(...args);
          if (result.status === "started") returnedId = result.challenge.id;
          entered.resolve();
          await release.promise;
          return result;
        });
    } else {
      const original = server.contactChangeGateway.resend;
      jest
        .spyOn(server.contactChangeGateway, "resend")
        .mockImplementationOnce(async (...args) => {
          const result = await original(...args);
          returnedId = result.id;
          entered.resolve();
          await release.promise;
          return result;
        });
    }
    const pending =
      action === "start" ? service.start(input) : service.resend();
    const rejected = expect(pending).rejects.toMatchObject({ code: "expired" });
    await entered.promise;
    service.dispose();
    service.activate();
    await store.logout();
    await store.login("nguyen.minh.an", MOCK_PASSWORD);
    release.resolve();
    await rejected;
    expect(cancel).toHaveBeenCalledWith(returnedId);
    expect(store.getSnapshot()).toMatchObject({
      status: "active",
      session: { accountId: "mock-staff-first" },
    });
  },
);

test("late saved contact cannot update a later account's session and is not a rollback", async () => {
  const { service, server, store, input } = await contactChangeFixture();
  await service.start(input);
  const entered = deferredResult<void>();
  const release = deferredResult<void>();
  const original = server.contactChangeGateway.verify;
  jest
    .spyOn(server.contactChangeGateway, "verify")
    .mockImplementationOnce(async (...args) => {
      const result = await original(...args);
      entered.resolve();
      await release.promise;
      return result;
    });
  const pending = service.verify("246810");
  const rejected = expect(pending).rejects.toMatchObject({ code: "expired" });
  await entered.promise;
  service.dispose();
  await store.logout();
  await store.login("nguyen.minh.an", MOCK_PASSWORD);
  release.resolve();
  await rejected;
  const current = store.getSnapshot();
  expect(current).toMatchObject({
    status: "active",
    session: {
      accountId: "mock-staff-first",
      contacts: [
        {
          channel: "email",
          maskedRecipient: "a***@example.invalid",
          verified: false,
        },
        { channel: "sms", maskedRecipient: "******0123", verified: false },
      ],
    },
  });
  await expect(
    server.gateway.login(input.identifier, MOCK_PASSWORD),
  ).resolves.toMatchObject({ session: { accountId: "mock-staff-ready" } });
});

test("an exhausted/expired owning session produces MSG19 teardown rather than saving contact", async () => {
  const { service, server, credential, store, input, profile } =
    await contactChangeFixture();
  await service.start(input);
  await server.gateway.revoke(credential);
  await expect(service.verify("246810")).rejects.toMatchObject({
    code: "expired",
  });
  expect(store.getSnapshot()).toEqual({
    status: "signedOut",
    reason: "sessionExpired",
  });
  const next = await server.gateway.login("tran.thu.ha", MOCK_PASSWORD);
  expect(await server.profileGateway.load(next.credential)).toEqual(profile);
});
