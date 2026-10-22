import { createMemorySessionCredentials } from "@/features/session/adapters/memory-session-credentials";
import { createMockSessionGateway } from "@/features/session/adapters/mock-session-gateway";
import {
  MOCK_PASSWORD,
  MOCK_VERIFICATION_CODE,
} from "@/features/session/adapters/mock-session-fixtures";
import { SessionFailure } from "@/features/session/domain/mobile-session";
import { createMobileSessionStore } from "@/features/session/state/mobile-session-store";
import { deferredResult } from "@/shared/testing/deferred-result";
import { createSessionNotificationPreferencesService } from "../services/session-notification-preferences-service";

const selection = {
  notificationTypeId: "mock-water-reminder",
  channelId: "mock-in-app",
  enabled: false,
};

async function setup(username = "tran.thu.ha", onboard = true) {
  let offline = false;
  const server = createMockSessionGateway();
  const repository = createMemorySessionCredentials();
  const store = createMobileSessionStore({
    gateway: server.gateway,
    repository,
    isOffline: () => offline,
  });
  await store.login(username, MOCK_PASSWORD);
  if (username === "nguyen.minh.an" && onboard) {
    await store.changePassword(MOCK_PASSWORD, "AnDemo2026");
    const challenge = await store.sendCode("sms");
    await store.verifyCode(challenge.id, MOCK_VERIFICATION_CODE);
  }
  const snapshot = store.getSnapshot();
  if (snapshot.status !== "active")
    throw new Error("Expected synthetic account");
  const scope = store.createAccountScope(snapshot.session.accountId);
  const service = createSessionNotificationPreferencesService(
    scope,
    server.notificationGateway,
  );
  return {
    ...server,
    store,
    scope,
    service,
    repository,
    setOffline: (value: boolean) => {
      offline = value;
    },
  };
}

test("saves the correct account, survives relogin and returns isolated snapshots", async () => {
  const { service, store, notificationGateway } = await setup();
  const original = await service.load();
  const saved = await service.save({ selections: [selection] });
  expect(saved).toMatchObject({ status: "saved", message: { code: "MSG10" } });
  expect(
    original.status === "loaded" &&
      original.settings.items[1].channels[0].enabled,
  ).toBe(true);
  await store.logout();
  await store.login("tran.thu.ha", MOCK_PASSWORD);
  const fresh = createSessionNotificationPreferencesService(
    store.createAccountScope("mock-staff-ready"),
    notificationGateway,
  );
  const loaded = await fresh.load();
  expect(
    loaded.status === "loaded" && loaded.settings.items[1].channels[0].enabled,
  ).toBe(false);
});

test("another account has independent selections; unverified email remains locked after SMS onboarding", async () => {
  const { service, store, gateway, notificationGateway } = await setup();
  await service.save({ selections: [selection] });
  await store.logout();
  await store.login("nguyen.minh.an", MOCK_PASSWORD);
  await store.changePassword(MOCK_PASSWORD, "AnDemo2026");
  const challenge = await store.sendCode("sms");
  await store.verifyCode(challenge.id, MOCK_VERIFICATION_CODE);
  const own = createSessionNotificationPreferencesService(
    store.createAccountScope("mock-staff-first"),
    notificationGateway,
  );
  const loaded = await own.load();
  expect(
    loaded.status === "loaded" && loaded.settings.items[1].channels[0].enabled,
  ).toBe(true);
  expect(
    await own.save({
      selections: [{ ...selection, channelId: "mock-email", enabled: true }],
    }),
  ).toMatchObject({ status: "invalid-preference", message: { code: "MSG21" } });
  const otherLease = await gateway.login("tran.thu.ha", MOCK_PASSWORD);
  const other = await notificationGateway.load(otherLease.credential);
  expect(
    other.status === "loaded" && other.settings.items[1].channels[0].enabled,
  ).toBe(false);
});

test("mandatory channel cannot be disabled, including a direct malformed UI request", async () => {
  const { service } = await setup();
  expect(
    await service.save({
      selections: [{ ...selection, notificationTypeId: "mock-water-alert" }],
    }),
  ).toMatchObject({ status: "invalid-preference", message: { code: "MSG23" } });
  const loaded = await service.load();
  expect(
    loaded.status === "loaded" && loaded.settings.items[0].channels[0].enabled,
  ).toBe(true);
});

test("offline load/save retain session and do not call gateway", async () => {
  const { service, store, notificationGateway, setOffline } = await setup();
  const load = jest.spyOn(notificationGateway, "load");
  const save = jest.spyOn(notificationGateway, "save");
  setOffline(true);
  expect(await service.load()).toEqual({ status: "offline" });
  expect(await service.save({ selections: [selection] })).toEqual({
    status: "offline",
  });
  expect(load).not.toHaveBeenCalled();
  expect(save).not.toHaveBeenCalled();
  expect(store.getSnapshot().status).toBe("active");
});

test.each(["load", "save"] as const)(
  "expired %s clears credential and carries MSG19 to login",
  async (method) => {
    const { service, store, repository, notificationGateway } = await setup();
    jest
      .spyOn(notificationGateway, method)
      .mockRejectedValueOnce(new SessionFailure("expired"));
    const result =
      method === "load"
        ? await service.load()
        : await service.save({ selections: [selection] });
    expect(result).toMatchObject({ status: "session-expired" });
    expect(store.getSnapshot()).toEqual({
      status: "signedOut",
      reason: "sessionExpired",
    });
    expect(await repository.read()).toBeNull();
  },
);

test("old scope cannot read, save or expire a later login of the same account", async () => {
  const { service, scope, store, notificationGateway } = await setup();
  await store.logout();
  await store.login("tran.thu.ha", MOCK_PASSWORD);
  const current = store.getSnapshot();
  const load = jest.spyOn(notificationGateway, "load");
  const save = jest.spyOn(notificationGateway, "save");
  expect(await service.load()).toMatchObject({ status: "session-expired" });
  expect(await service.save({ selections: [selection] })).toMatchObject({
    status: "session-expired",
  });
  await scope.expire();
  expect(load).not.toHaveBeenCalled();
  expect(save).not.toHaveBeenCalled();
  expect(store.getSnapshot()).toEqual(current);
});

test("late successful save cannot terminate the next account session", async () => {
  const { service, store, notificationGateway } = await setup();
  const entered = deferredResult<void>();
  const response = deferredResult<void>();
  const save = notificationGateway.save;
  jest
    .spyOn(notificationGateway, "save")
    .mockImplementation(async (...args) => {
      const result = await save(...args);
      entered.resolve();
      await response.promise;
      return result;
    });
  const pending = service.save({ selections: [selection] });
  await entered.promise;
  await store.logout();
  await store.login("nguyen.minh.an", MOCK_PASSWORD);
  const next = store.getSnapshot();
  response.resolve();
  expect(await pending).toMatchObject({ status: "session-expired" });
  expect(store.getSnapshot()).toEqual(next);
});

test("profile preferences do not bypass the onboarding gate", async () => {
  const { service, store, notificationGateway, scope } = await setup(
    "nguyen.minh.an",
    false,
  );
  const load = jest.spyOn(notificationGateway, "load");
  expect(await service.load()).toMatchObject({ status: "session-expired" });
  await scope.expire();
  expect(load).not.toHaveBeenCalled();
  expect(store.getSnapshot()).toMatchObject({
    status: "active",
    session: { nextAction: "changePassword" },
  });
});
