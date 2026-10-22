import type { ConnectivityStatus } from "@/features/connectivity/domain/connectivity";
import type { LogoutResult } from "@/features/session/domain/logout";
import type { ServerLogoutRepository } from "@/features/session/repositories/server-logout-repository";
import type { SessionTokenRepository } from "@/features/session/repositories/session-token-repository";

type LogoutServiceDependencies = Readonly<{
  clearProtectedCache: () => Promise<void>;
  clearSessionState: () => Promise<void>;
  serverLogoutRepository: ServerLogoutRepository;
  tokenRepository: SessionTokenRepository;
}>;

export function createLogoutService({
  clearProtectedCache,
  clearSessionState,
  serverLogoutRepository,
  tokenRepository,
}: LogoutServiceDependencies) {
  return {
    async logout(connectivity: ConnectivityStatus): Promise<LogoutResult> {
      let accessToken: string | null = null;
      let tokenReadFailed = false;

      try {
        accessToken = (await tokenRepository.read())?.accessToken ?? null;
      } catch {
        tokenReadFailed = true;
        // A corrupt/unreadable token must not prevent local cleanup.
      }

      const cleanupResults = await Promise.allSettled([
        Promise.resolve().then(() => tokenRepository.clear()),
        Promise.resolve().then(() => clearProtectedCache()),
        Promise.resolve().then(() => clearSessionState()),
      ]);
      const localCleanup = cleanupResults.every(
        (result) => result.status === "fulfilled",
      )
        ? "cleared"
        : "failed";

      if (!accessToken) {
        return {
          localCleanup,
          navigateToLogin: true,
          serverRevoke: tokenReadFailed ? "failed" : "not-needed",
          warningCode: connectivity === "offline" ? "MSG07" : null,
        };
      }

      if (connectivity === "offline") {
        return {
          localCleanup,
          navigateToLogin: true,
          serverRevoke: "deferred-contract-required",
          warningCode: "MSG07",
        };
      }

      let serverRevoke: LogoutResult["serverRevoke"] = "failed";
      try {
        serverRevoke = await serverLogoutRepository.revoke(accessToken);
      } catch {
        serverRevoke = "failed";
      }

      return {
        localCleanup,
        navigateToLogin: true,
        serverRevoke,
        warningCode: null,
      };
    },
  } as const;
}

export type LogoutService = ReturnType<typeof createLogoutService>;
