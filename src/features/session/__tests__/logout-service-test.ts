import { createLogoutService } from "@/features/session/services/logout-service";

const tokens = {
  accessToken: "access-token-for-test",
  accessTokenExpiresAt: "2026-10-22T12:15:00.000Z",
  refreshToken: "refresh-token-for-test",
  refreshTokenExpiresAt: "2026-11-21T12:00:00.000Z",
};

function createDependencies() {
  return {
    clearProtectedCache: jest.fn().mockResolvedValue(undefined),
    clearSessionState: jest.fn().mockResolvedValue(undefined),
    serverLogoutRepository: {
      revoke: jest.fn().mockResolvedValue("revoked" as const),
    },
    tokenRepository: {
      clear: jest.fn().mockResolvedValue(undefined),
      read: jest.fn().mockResolvedValue(tokens),
      save: jest.fn(),
    },
  };
}

describe("logout service", () => {
  test("still attempts every cleanup if one adapter throws synchronously", async () => {
    const dependencies = createDependencies();
    dependencies.tokenRepository.clear.mockImplementation(() => { throw new Error("keychain unavailable"); });
    await expect(createLogoutService(dependencies).logout("online")).resolves.toMatchObject({
      localCleanup: "failed", serverRevoke: "revoked",
    });
    expect(dependencies.clearProtectedCache).toHaveBeenCalledTimes(1);
    expect(dependencies.clearSessionState).toHaveBeenCalledTimes(1);
  });
  test("clears every local boundary before online server revoke", async () => {
    const dependencies = createDependencies();
    const service = createLogoutService(dependencies);

    await expect(service.logout("online")).resolves.toEqual({
      localCleanup: "cleared",
      navigateToLogin: true,
      serverRevoke: "revoked",
      warningCode: null,
    });

    const revokeOrder =
      dependencies.serverLogoutRepository.revoke.mock.invocationCallOrder[0];
    expect(dependencies.tokenRepository.clear.mock.invocationCallOrder[0]).toBeLessThan(
      revokeOrder,
    );
    expect(dependencies.clearProtectedCache.mock.invocationCallOrder[0]).toBeLessThan(
      revokeOrder,
    );
    expect(dependencies.clearSessionState.mock.invocationCallOrder[0]).toBeLessThan(
      revokeOrder,
    );
  });

  test("logs out locally while offline without retaining a fake queue secret", async () => {
    const dependencies = createDependencies();
    const service = createLogoutService(dependencies);

    await expect(service.logout("offline")).resolves.toEqual({
      localCleanup: "cleared",
      navigateToLogin: true,
      serverRevoke: "deferred-contract-required",
      warningCode: "MSG07",
    });
    expect(dependencies.serverLogoutRepository.revoke).not.toHaveBeenCalled();
    expect(dependencies.tokenRepository.clear).toHaveBeenCalledTimes(1);
  });

  test("keeps navigation fail-closed when the server revoke fails", async () => {
    const dependencies = createDependencies();
    dependencies.serverLogoutRepository.revoke.mockRejectedValue(
      new Error("network unavailable"),
    );
    const service = createLogoutService(dependencies);

    await expect(service.logout("online")).resolves.toMatchObject({
      localCleanup: "cleared",
      navigateToLogin: true,
      serverRevoke: "failed",
    });
  });

  test("still clears local state when stored tokens are unreadable", async () => {
    const dependencies = createDependencies();
    dependencies.tokenRepository.read.mockRejectedValue(
      new Error("corrupt token envelope"),
    );
    const service = createLogoutService(dependencies);

    await expect(service.logout("online")).resolves.toMatchObject({
      localCleanup: "cleared",
      navigateToLogin: true,
      serverRevoke: "failed",
    });
    expect(dependencies.tokenRepository.clear).toHaveBeenCalledTimes(1);
  });

  test("reports local cleanup failure but still hides the protected shell", async () => {
    const dependencies = createDependencies();
    dependencies.clearProtectedCache.mockRejectedValue(
      new Error("cache deletion failed"),
    );
    const service = createLogoutService(dependencies);

    await expect(service.logout("online")).resolves.toMatchObject({
      localCleanup: "failed",
      navigateToLogin: true,
    });
  });
});
