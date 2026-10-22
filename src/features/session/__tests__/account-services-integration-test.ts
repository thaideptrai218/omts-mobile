import { createSessionProfileService } from "@/features/profile/services/session-profile-service";
import { createSessionNotificationPreferencesService } from "@/features/notifications/services/session-notification-preferences-service";
import { deferredResult } from "@/shared/testing/deferred-result";
import { createMockSessionGateway } from "../adapters/mock-session-gateway";
import { createMemorySessionCredentials } from "../adapters/memory-session-credentials";
import { MOCK_PASSWORD } from "../adapters/mock-session-fixtures";
import { SessionFailure } from "../domain/mobile-session";
import {
  createMobileSessionStore,
  type MobileSessionStore,
} from "../state/mobile-session-store";

const accountId = "mock-staff-ready";
const preference = {
  notificationTypeId: "mock-water-reminder",
  channelId: "mock-in-app",
  enabled: false,
};

function bind(
  store: MobileSessionStore,
  server: ReturnType<typeof createMockSessionGateway>,
) {
  const scope = store.createAccountScope(accountId);
  return {
    scope,
    profile: createSessionProfileService(scope, server.profileGateway),
    preferences: createSessionNotificationPreferencesService(
      scope,
      server.notificationGateway,
    ),
  };
}

async function setup() {
  let now = 0;
  const server = createMockSessionGateway(() => now);
  const repository = createMemorySessionCredentials();
  const store = createMobileSessionStore({
    gateway: server.gateway,
    repository,
    isOffline: () => false,
  });
  await store.login("tran.thu.ha", MOCK_PASSWORD);
  return {
    store,
    server,
    repository,
    ...bind(store, server),
    advance: () => {
      now += 61_000;
    },
  };
}

test("profile and preferences persist independently across the same account's relogin", async () => {
  const { profile, preferences, store, server } = await setup();
  const loaded = await profile.load();
  if (loaded.status !== "loaded") throw new Error("Expected synthetic profile");
  const saved = await profile.save({
    displayName: "Hà đã cập nhật",
    expectedRevision: loaded.profile.revision,
  });
  expect(saved.status).toBe("saved");
  expect((await preferences.save({ selections: [preference] })).status).toBe(
    "saved",
  );
  expect(await profile.load()).toEqual(
    saved.status === "saved"
      ? { status: "loaded", profile: saved.profile }
      : null,
  );
  await store.logout();
  await store.login("tran.thu.ha", MOCK_PASSWORD);
  const next = bind(store, server);
  expect(await next.profile.load()).toMatchObject({
    status: "loaded",
    profile: { displayName: "Hà đã cập nhật" },
  });
  const settings = await next.preferences.load();
  expect(
    settings.status === "loaded" &&
      settings.settings.items[1].channels[0].enabled,
  ).toBe(false);
});

test("refresh rotates the credential without invalidating either feature's active scope", async () => {
  const { profile, preferences, advance, server, store } = await setup();
  const refresh = jest.spyOn(server.gateway, "refresh");
  advance();
  expect((await profile.load()).status).toBe("loaded");
  expect((await preferences.load()).status).toBe("loaded");
  expect(refresh).toHaveBeenCalledTimes(1);
  expect(store.getSnapshot()).toMatchObject({
    status: "active",
    session: { accountId },
  });
});

test("expiry in preferences invalidates both old services even after same-account relogin", async () => {
  const { profile, preferences, scope, store, server } = await setup();
  jest
    .spyOn(server.notificationGateway, "load")
    .mockRejectedValueOnce(new SessionFailure("expired"));
  expect((await preferences.load()).status).toBe("session-expired");
  expect(store.getSnapshot()).toEqual({
    status: "signedOut",
    reason: "sessionExpired",
  });
  await store.login("tran.thu.ha", MOCK_PASSWORD);
  const current = store.getSnapshot();
  expect((await profile.load()).status).toBe("session-expired");
  expect((await preferences.save({ selections: [preference] })).status).toBe(
    "session-expired",
  );
  await scope.expire();
  expect(store.getSnapshot()).toEqual(current);
  expect((await bind(store, server).preferences.load()).status).toBe("loaded");
});

test("late profile success cannot overwrite a newer name or expire fresh preferences", async () => {
  const { profile, scope, server, store } = await setup();
  const loaded = await profile.load();
  if (loaded.status !== "loaded") throw new Error("Expected profile");
  const entered = deferredResult<void>();
  const release = deferredResult<void>();
  const save = server.profileGateway.save;
  jest
    .spyOn(server.profileGateway, "save")
    .mockImplementationOnce(async (...args) => {
      const result = await save(...args);
      entered.resolve();
      await release.promise;
      return result;
    });
  const pending = profile.save({
    displayName: "Tên ở phiên trước",
    expectedRevision: loaded.profile.revision,
  });
  await entered.promise;
  await store.logout();
  await store.login("tran.thu.ha", MOCK_PASSWORD);
  const next = bind(store, server);
  const current = await next.profile.load();
  if (current.status !== "loaded") throw new Error("Expected new profile");
  await next.profile.save({
    displayName: "Tên ở phiên mới",
    expectedRevision: current.profile.revision,
  });
  release.resolve();
  expect((await pending).status).toBe("session-expired");
  await scope.expire();
  expect(store.getSnapshot()).toMatchObject({
    status: "active",
    session: { displayName: "Tên ở phiên mới" },
  });
  expect((await next.preferences.load()).status).toBe("loaded");
});

test("late expired preference response cannot clear the next login's profile", async () => {
  const { preferences, scope, store, server } = await setup();
  const entered = deferredResult<void>();
  const release = deferredResult<void>();
  jest
    .spyOn(server.notificationGateway, "save")
    .mockImplementationOnce(async () => {
      entered.resolve();
      await release.promise;
      return { status: "session-expired", message: { code: "MSG19" } };
    });
  const pending = preferences.save({ selections: [preference] });
  await entered.promise;
  await store.logout();
  await store.login("tran.thu.ha", MOCK_PASSWORD);
  release.resolve();
  expect((await pending).status).toBe("session-expired");
  await scope.expire();
  expect((await bind(store, server).profile.load()).status).toBe("loaded");
  expect(store.getSnapshot()).toMatchObject({ status: "active" });
});

test.each(["profile", "preferences"] as const)(
  "%s expiry preserves MSG19 through failed cleanup and explicit retry",
  async (feature) => {
    const context = await setup();
    const { store, server, repository } = context;
    if (feature === "profile")
      jest
        .spyOn(server.profileGateway, "load")
        .mockRejectedValueOnce(new SessionFailure("expired"));
    else
      jest
        .spyOn(server.notificationGateway, "load")
        .mockRejectedValueOnce(new SessionFailure("expired"));
    jest
      .spyOn(repository, "clear")
      .mockRejectedValueOnce(new Error("synthetic cleanup failure"));
    expect((await context[feature].load()).status).toBe("session-expired");
    expect(store.getSnapshot()).toMatchObject({
      status: "error",
      operation: "logout",
      signOutReason: "sessionExpired",
    });
    await store.bootstrap();
    expect(store.getSnapshot()).toEqual({
      status: "signedOut",
      reason: "sessionExpired",
    });
    expect(await repository.read()).toBeNull();
  },
);
