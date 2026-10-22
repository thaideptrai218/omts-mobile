import { createMemorySessionCredentials } from "@/features/session/adapters/memory-session-credentials";
import { createMockSessionGateway } from "@/features/session/adapters/mock-session-gateway";
import { MOCK_PASSWORD } from "@/features/session/adapters/mock-session-fixtures";
import { createMobileSessionStore } from "@/features/session/state/mobile-session-store";
import { SessionFailure } from "@/features/session/domain/mobile-session";
import { createSessionProfileService } from "../services/session-profile-service";

async function setup(username = "tran.thu.ha") {
  let offline = false;
  const { gateway, profileGateway } = createMockSessionGateway();
  const repository = createMemorySessionCredentials();
  const store = createMobileSessionStore({
    gateway,
    repository,
    isOffline: () => offline,
  });
  await store.login(username, MOCK_PASSWORD);
  const current = store.getSnapshot();
  if (current.status !== "active") throw new Error("Expected fixture session");
  const scope = store.createAccountScope(current.session.accountId);
  const service = createSessionProfileService(scope, profileGateway);
  return {
    store,
    gateway,
    profileGateway,
    scope,
    service,
    repository,
    setOffline: (value: boolean) => {
      offline = value;
    },
  };
}

test("profile and auth share the same account; save uses a new opaque revision and canonical name", async () => {
  const { service, store } = await setup();
  const loaded = await service.load();
  if (loaded.status !== "loaded") throw new Error("Expected loaded profile");
  expect(loaded.profile.account.username).toBe("tran.thu.ha");
  const saved = await service.save({
    displayName: "  Hà mới  ",
    expectedRevision: loaded.profile.revision,
  });
  expect(saved).toMatchObject({
    status: "saved",
    profile: { displayName: "Hà mới", account: loaded.profile.account },
  });
  if (saved.status !== "saved") throw new Error("Expected saved profile");
  expect(saved.profile.revision).not.toBe(loaded.profile.revision);
  expect(store.getSnapshot()).toMatchObject({
    session: { displayName: "Hà mới" },
  });
  await store.logout();
  await store.login("tran.thu.ha", MOCK_PASSWORD);
  expect(store.getSnapshot()).toMatchObject({
    session: { displayName: "Hà mới" },
  });
});

test("stale revision conflicts; explicit reload returns the other session's canonical profile", async () => {
  const { service, profileGateway, gateway } = await setup();
  const first = await service.load();
  if (first.status !== "loaded") throw new Error("Expected profile");
  const other = await gateway.login("tran.thu.ha", MOCK_PASSWORD);
  await profileGateway.save(other.credential, {
    displayName: "Tên ở thiết bị khác",
    expectedRevision: first.profile.revision,
  });
  expect(
    await service.save({
      displayName: "Bản nháp của tôi",
      expectedRevision: first.profile.revision,
    }),
  ).toMatchObject({ status: "conflict" });
  expect(await service.load()).toMatchObject({
    status: "loaded",
    profile: { displayName: "Tên ở thiết bị khác" },
  });
});

test("offline load/save do not call the gateway or clear the active session", async () => {
  const { service, profileGateway, setOffline, store } = await setup();
  const load = jest.spyOn(profileGateway, "load");
  const save = jest.spyOn(profileGateway, "save");
  setOffline(true);
  expect(await service.load()).toEqual({ status: "offline" });
  expect(
    await service.save({ displayName: "Hà mới", expectedRevision: "unused" }),
  ).toEqual({ status: "offline" });
  expect(load).not.toHaveBeenCalled();
  expect(save).not.toHaveBeenCalled();
  expect(store.getSnapshot()).toMatchObject({
    status: "active",
    session: { displayName: "Trần Thu Hà" },
  });
});

test.each(["tran.thu.ha", "nguyen.minh.an"])(
  "old profile scope cannot act on a later login for %s",
  async (username) => {
    const { service, scope, store } = await setup();
    await store.logout();
    await store.login(username, MOCK_PASSWORD);
    const current = store.getSnapshot();
    expect(await service.load()).toEqual({ status: "session-expired" });
    scope.acceptDisplayName("Stale name");
    await scope.expire();
    expect(store.getSnapshot()).toEqual(current);
  },
);

test("profile cannot bypass onboarding and does not expire a valid gated session", async () => {
  const { service, store, scope, profileGateway } =
    await setup("nguyen.minh.an");
  const load = jest.spyOn(profileGateway, "load");
  expect(await service.load()).toEqual({ status: "session-expired" });
  await scope.expire();
  expect(load).not.toHaveBeenCalled();
  expect(store.getSnapshot()).toMatchObject({
    session: { nextAction: "changePassword" },
  });
});

test("expired profile request tears down the session and preserves MSG19 reason", async () => {
  const { service, profileGateway, repository, store } = await setup();
  jest
    .spyOn(profileGateway, "load")
    .mockRejectedValueOnce(new SessionFailure("expired"));
  expect(await service.load()).toEqual({ status: "session-expired" });
  expect(store.getSnapshot()).toEqual({
    status: "signedOut",
    reason: "sessionExpired",
  });
  expect(await repository.read()).toBeNull();
});

test("expiry invalidates an old scope even after logging back into the same account", async () => {
  const { service, profileGateway, store, scope } = await setup();
  jest
    .spyOn(profileGateway, "load")
    .mockRejectedValueOnce(new SessionFailure("expired"));
  await service.load();
  await store.login("tran.thu.ha", MOCK_PASSWORD);
  const fresh = store.getSnapshot();
  expect(await service.load()).toEqual({ status: "session-expired" });
  scope.acceptDisplayName("Stale identity");
  await scope.expire();
  expect(store.getSnapshot()).toEqual(fresh);
});

test("late successful save cannot rename or expire the next account after logout", async () => {
  const { service, profileGateway, store } = await setup();
  const loaded = await service.load();
  if (loaded.status !== "loaded") throw new Error("Expected profile");
  const save = profileGateway.save;
  let release!: () => void;
  let entered!: () => void;
  const started = new Promise<void>((resolve) => {
    entered = resolve;
  });
  jest.spyOn(profileGateway, "save").mockImplementation(async (...args) => {
    const result = await save(...args);
    entered();
    await new Promise<void>((resolve) => {
      release = resolve;
    });
    return result;
  });
  const pending = service.save({
    displayName: "Old account changed",
    expectedRevision: loaded.profile.revision,
  });
  await started;
  await store.logout();
  await store.login("nguyen.minh.an", MOCK_PASSWORD);
  release();
  expect(await pending).toEqual({ status: "session-expired" });
  expect(store.getSnapshot()).toMatchObject({
    session: { username: "nguyen.minh.an", displayName: "Nguyễn Minh An" },
  });
});
