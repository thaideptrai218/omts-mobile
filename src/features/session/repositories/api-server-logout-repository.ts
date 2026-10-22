import type { ServerLogoutRepository } from "@/features/session/repositories/server-logout-repository";
import type { ApiTransport } from "@/shared/api/api-transport";

export function createApiServerLogoutRepository(
  transport: ApiTransport,
): ServerLogoutRepository {
  return {
    async revoke(accessToken) {
      const result = await transport.request({
        headers: { Authorization: `Bearer ${accessToken}` },
        method: "POST",
        path: "api/auth/logout",
      });

      if (result.ok) return "revoked";
      // An expired access token can be rejected before the logout action runs.
      // A 401 therefore does not prove that the refresh session was revoked.
      return "failed";
    },
  };
}
