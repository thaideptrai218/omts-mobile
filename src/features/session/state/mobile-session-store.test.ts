import { createMemorySessionCredentials } from "../adapters/memory-session-credentials";
import { createMockSessionGateway } from "../adapters/mock-session-gateway";
import {
  MOCK_PASSWORD,
  MOCK_VERIFICATION_CODE,
} from "../adapters/mock-session-fixtures";
import { SessionFailure } from "../domain/mobile-session";
import { createMobileSessionStore } from "./mobile-session-store";

function setup() {
  let time = 1_000;
  let offline = false;
  const mock = createMockSessionGateway(() => time);
  const repository = createMemorySessionCredentials();
  const store = createMobileSessionStore({
    gateway: mock.gateway,
    repository,
    isOffline: () => offline,
  });
  return {
    store,
    repository,
    gateway: mock.gateway,
    advance: (ms: number) => {
      time += ms;
    },
    offline: (value: boolean) => {
      offline = value;
    },
  };
}

test("logout never waits for a pending remote revoke", async () => {
  const { store, gateway, repository } = setup();
  await store.login("tran.thu.ha", MOCK_PASSWORD);
  jest
    .spyOn(gateway, "revoke")
    .mockImplementation(() => new Promise(() => undefined));
  await store.logout();
  expect(store.getSnapshot()).toEqual({ status: "signedOut" });
  expect(await repository.read()).toBeNull();
});

test("cleanup failure hides the app and exposes only logout retry, not a false success", async () => {
  const { store, repository } = setup();
  await store.login("tran.thu.ha", MOCK_PASSWORD);
  jest
    .spyOn(repository, "clear")
    .mockRejectedValueOnce(new Error("device storage failure"));
  await store.logout();
  expect(store.getSnapshot()).toEqual({
    status: "error",
    operation: "logout",
    reason: "unavailable",
  });
  await store.logout();
  expect(store.getSnapshot()).toEqual({ status: "signedOut" });
  expect(await repository.read()).toBeNull();
});

test("first login must change password then verify one declared contact before app access", async () => {
  const { store, repository } = setup();
  await store.bootstrap();
  expect(store.getSnapshot()).toEqual({ status: "signedOut" });
  await store.login("nguyen.minh.an", MOCK_PASSWORD);
  expect(store.getSnapshot()).toMatchObject({
    session: { nextAction: "changePassword" },
  });
  await expect(store.sendCode("email")).rejects.toMatchObject({
    code: "verification",
  });
  expect(await store.changePassword("wrong", "NewPass2026")).toBe(false);
  expect(await store.changePassword(MOCK_PASSWORD, "NewPass2026")).toBe(true);
  await store.reloadSession();
  expect(store.getSnapshot()).toMatchObject({
    session: { nextAction: "verifyContact" },
  });
  const challenge = await store.sendCode("email");
  await store.verifyCode(challenge.id, MOCK_VERIFICATION_CODE);
  expect(store.getSnapshot()).toMatchObject({
    session: {
      nextAction: "ready",
      contacts: [
        { channel: "email", verified: true },
        { channel: "sms", verified: false },
      ],
    },
  });
  await store.logout();
  expect(await repository.read()).toBeNull();
  expect(store.getSnapshot()).toEqual({ status: "signedOut" });
  await expect(
    store.login("nguyen.minh.an", MOCK_PASSWORD),
  ).rejects.toMatchObject({ code: "credentials" });
  await store.login("nguyen.minh.an", "NewPass2026");
  expect(store.getSnapshot()).toMatchObject({
    session: { nextAction: "ready" },
  });
});

test("SMS alone also completes onboarding; old challenge cannot be replayed", async () => {
  const { store } = setup();
  await store.login("nguyen.minh.an", MOCK_PASSWORD);
  await store.changePassword(MOCK_PASSWORD, "NewPass2026");
  const code = await store.sendCode("sms");
  await store.verifyCode(code.id, MOCK_VERIFICATION_CODE);
  expect(store.getSnapshot()).toMatchObject({
    session: { nextAction: "ready" },
  });
  await expect(
    store.verifyCode(code.id, MOCK_VERIFICATION_CODE),
  ).rejects.toMatchObject({ code: "verification" });
});

test("offline bootstrap retains credential, retries, then refreshes expired mock access", async () => {
  const { store, repository, gateway, offline, advance } = setup();
  await store.login("tran.thu.ha", MOCK_PASSWORD);
  const old = await repository.read();
  offline(true);
  await store.bootstrap();
  expect(store.getSnapshot()).toMatchObject({
    status: "error",
    reason: "offline",
  });
  expect(await repository.read()).toEqual(old);
  offline(false);
  advance(60_001);
  const refresh = jest.spyOn(gateway, "refresh");
  await store.bootstrap();
  expect(refresh).toHaveBeenCalledTimes(1);
  expect(store.getSnapshot()).toMatchObject({ status: "active" });
  expect(await repository.read()).not.toEqual(old);
});

test("offline mutation is rejected without advancing onboarding; offline logout clears local state", async () => {
  const { store, offline, repository, gateway } = setup();
  await store.login("nguyen.minh.an", MOCK_PASSWORD);
  offline(true);
  await expect(
    store.changePassword(MOCK_PASSWORD, "NewPass2026"),
  ).rejects.toMatchObject({ code: "offline" });
  expect(store.getSnapshot()).toMatchObject({
    session: { nextAction: "changePassword" },
  });
  const revoke = jest.spyOn(gateway, "revoke");
  await store.logout();
  expect(revoke).not.toHaveBeenCalled();
  expect(await repository.read()).toBeNull();
});

test("logout invalidates a late login completion", async () => {
  const { store, repository, gateway } = setup();
  const original = gateway.login;
  let release!: () => void;
  gateway.login = async (...args) => {
    await new Promise<void>((resolve) => {
      release = resolve;
    });
    return original(...args);
  };
  const login = store.login("tran.thu.ha", MOCK_PASSWORD);
  await store.logout();
  release();
  await login;
  expect(store.getSnapshot()).toEqual({ status: "signedOut" });
  expect(await repository.read()).toBeNull();
});

test("revoked credential ends bootstrap without pretending a network failure is expiry", async () => {
  const { store, repository, gateway } = setup();
  await store.login("tran.thu.ha", MOCK_PASSWORD);
  await gateway.revoke((await repository.read())!);
  await store.bootstrap();
  expect(store.getSnapshot()).toEqual({ status: "signedOut" });
  expect(await repository.read()).toBeNull();
});

test("transient gateway failure retains credential and hides protected content until retry", async () => {
  const { store, repository, gateway } = setup();
  await store.login("tran.thu.ha", MOCK_PASSWORD);
  const credential = await repository.read();
  jest
    .spyOn(gateway, "inspect")
    .mockRejectedValueOnce(new SessionFailure("unavailable"));
  await store.bootstrap();
  expect(store.getSnapshot()).toMatchObject({
    status: "error",
    reason: "unavailable",
  });
  expect(await repository.read()).toEqual(credential);
  await store.bootstrap();
  expect(store.getSnapshot()).toMatchObject({ status: "active" });
});

test("a late bootstrap read cannot restore the account after logout", async () => {
  const { store, repository } = setup();
  await store.login("tran.thu.ha", MOCK_PASSWORD);
  const oldCredential = await repository.read();
  let release!: () => void;
  jest.spyOn(repository, "read").mockImplementationOnce(async () => {
    await new Promise<void>((resolve) => {
      release = resolve;
    });
    return oldCredential;
  });
  const pending = store.bootstrap();
  await store.logout();
  release();
  await pending;
  expect(store.getSnapshot()).toEqual({ status: "signedOut" });
  expect(await repository.read()).toBeNull();
});

test("a late password-change result cannot reopen onboarding after logout", async () => {
  const { store, gateway, repository } = setup();
  await store.login("nguyen.minh.an", MOCK_PASSWORD);
  const change = gateway.changePassword;
  let release!: () => void;
  let entered!: () => void;
  const started = new Promise<void>((resolve) => {
    entered = resolve;
  });
  gateway.changePassword = async (...args) => {
    const result = await change(...args);
    entered();
    await new Promise<void>((resolve) => {
      release = resolve;
    });
    return result;
  };
  const pending = store.changePassword(MOCK_PASSWORD, "NewPass2026");
  const rejected = expect(pending).rejects.toMatchObject({ code: "expired" });
  await started;
  await store.logout();
  release();
  await rejected;
  expect(store.getSnapshot()).toEqual({ status: "signedOut" });
  expect(await repository.read()).toBeNull();
});

test("duplicate login is rejected without creating a second gateway request", async () => {
  const { store, gateway } = setup();
  const login = gateway.login;
  let release!: () => void;
  const request = jest
    .spyOn(gateway, "login")
    .mockImplementation(async (...args) => {
      await new Promise<void>((resolve) => {
        release = resolve;
      });
      return login(...args);
    });
  const pending = store.login("tran.thu.ha", MOCK_PASSWORD);
  await expect(store.login("tran.thu.ha", MOCK_PASSWORD)).rejects.toMatchObject(
    { code: "unavailable" },
  );
  expect(request).toHaveBeenCalledTimes(1);
  release();
  await pending;
  expect(store.getSnapshot()).toMatchObject({ status: "active" });
});

test("bootstrap after failed logout retries cleanup rather than restoring the stored account", async () => {
  const { store, repository } = setup();
  await store.login("tran.thu.ha", MOCK_PASSWORD);
  jest
    .spyOn(repository, "clear")
    .mockRejectedValueOnce(new Error("storage unavailable"));
  const read = jest.spyOn(repository, "read");
  await store.logout();
  await store.bootstrap();
  expect(read).not.toHaveBeenCalled();
  expect(store.getSnapshot()).toEqual({ status: "signedOut" });
});

test("a transient refresh failure retains the handle for an explicit session-check retry", async () => {
  const { store, repository, gateway, advance } = setup();
  await store.login("tran.thu.ha", MOCK_PASSWORD);
  const oldCredential = await repository.read();
  advance(61_000);
  const refresh = jest
    .spyOn(gateway, "refresh")
    .mockRejectedValueOnce(new SessionFailure("unavailable"));
  await store.bootstrap();
  expect(store.getSnapshot()).toMatchObject({
    status: "error",
    reason: "unavailable",
  });
  expect(await repository.read()).toEqual(oldCredential);
  await store.bootstrap();
  expect(refresh).toHaveBeenCalledTimes(2);
  expect(store.getSnapshot()).toMatchObject({ status: "active" });
});

test("standard password change preserves verified status and zone-role assignments", async () => {
  const { store } = setup();
  await store.login("tran.thu.ha", MOCK_PASSWORD);
  const before = store.getSnapshot();
  expect(await store.changePassword(MOCK_PASSWORD, "AnotherPass2026")).toBe(
    true,
  );
  expect(store.getSnapshot()).toEqual(before);
  await store.logout();
  await expect(store.login("tran.thu.ha", MOCK_PASSWORD)).rejects.toMatchObject(
    { code: "credentials" },
  );
  await store.login("tran.thu.ha", "AnotherPass2026");
  expect(store.getSnapshot()).toEqual(before);
});
