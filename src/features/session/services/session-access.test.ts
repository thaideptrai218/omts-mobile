import { createMemorySessionCredentials } from "../adapters/memory-session-credentials";
import { createMockSessionGateway } from "../adapters/mock-session-gateway";
import { MOCK_PASSWORD } from "../adapters/mock-session-fixtures";
import { createSessionAccess } from "./session-access";
import { SessionFailure } from "../domain/mobile-session";

test("concurrent expired requests share one refresh", async () => {
  let now = 0;
  const { gateway } = createMockSessionGateway(() => now);
  const repository = createMemorySessionCredentials();
  const access = createSessionAccess(gateway, repository);
  const { credential } = await gateway.login("tran.thu.ha", MOCK_PASSWORD);
  now = 61_000;
  const refresh = jest.spyOn(gateway, "refresh");
  const results = await Promise.all([
    access.ensure(credential),
    access.ensure(credential),
    access.ensure(credential),
  ]);
  expect(refresh).toHaveBeenCalledTimes(1);
  expect(results[0]).toEqual(results[2]);
});

test("logout clear runs after an already-started credential save", async () => {
  const { gateway } = createMockSessionGateway();
  const credential = { handle: "mock-delayed-save" };
  let stored: typeof credential | null = null;
  let release!: () => void;
  let entered!: () => void;
  const started = new Promise<void>((resolve) => {
    entered = resolve;
  });
  const repository = {
    read: async () => stored,
    save: jest.fn(async (next: typeof credential) => {
      entered();
      await new Promise<void>((resolve) => {
        release = resolve;
      });
      stored = next;
    }),
    clear: jest.fn(async () => {
      stored = null;
    }),
  };
  const access = createSessionAccess(gateway, repository);
  const save = access.save(credential);
  await started;
  const clear = access.clear();
  expect(repository.clear).not.toHaveBeenCalled();
  release();
  await Promise.all([save, clear]);
  expect(await repository.read()).toBeNull();
  expect(repository.clear).toHaveBeenCalledTimes(1);
});

test("refresh returning after clear cannot persist a new session", async () => {
  let now = 0;
  const { gateway } = createMockSessionGateway(() => now);
  const repository = createMemorySessionCredentials();
  const access = createSessionAccess(gateway, repository);
  const { credential } = await gateway.login("tran.thu.ha", MOCK_PASSWORD);
  now = 61_000;
  const original = gateway.refresh;
  let release!: () => void;
  gateway.refresh = async (value) => {
    await new Promise<void>((resolve) => {
      release = resolve;
    });
    return original(value);
  };
  const pending = access.ensure(credential);
  // Let inspect reject and enter refresh before clearing.
  await Promise.resolve();
  await Promise.resolve();
  await access.clear();
  release();
  await expect(pending).rejects.toMatchObject({ code: "expired" });
  expect(await repository.read()).toBeNull();
});

test("an expired inspection arriving after logout must not even start refresh", async () => {
  const { gateway } = createMockSessionGateway();
  const repository = createMemorySessionCredentials();
  const access = createSessionAccess(gateway, repository);
  const { credential } = await gateway.login("tran.thu.ha", MOCK_PASSWORD);
  let reject!: (error: Error) => void;
  jest.spyOn(gateway, "inspect").mockImplementationOnce(
    () =>
      new Promise((_, fail) => {
        reject = fail;
      }),
  );
  const refresh = jest.spyOn(gateway, "refresh");
  const pending = access.ensure(credential);
  await access.clear();
  reject(new SessionFailure("expired"));
  await expect(pending).rejects.toMatchObject({ code: "expired" });
  expect(refresh).not.toHaveBeenCalled();
  expect(await repository.read()).toBeNull();
});

test("a delayed old inspection reuses the rotated credential instead of refreshing a revoked handle", async () => {
  let now = 0;
  const { gateway } = createMockSessionGateway(() => now);
  const repository = createMemorySessionCredentials();
  const access = createSessionAccess(gateway, repository);
  const { credential } = await gateway.login("tran.thu.ha", MOCK_PASSWORD);
  now = 61_000;
  let reject!: (error: Error) => void;
  jest.spyOn(gateway, "inspect").mockImplementationOnce(
    () =>
      new Promise((_, fail) => {
        reject = fail;
      }),
  );
  const refresh = jest.spyOn(gateway, "refresh");
  const delayed = access.ensure(credential);
  const rotated = await access.ensure(credential);
  reject(new SessionFailure("expired"));
  await expect(delayed).resolves.toEqual(rotated);
  expect(refresh).toHaveBeenCalledTimes(1);
});
