import type { ServerRevokeStatus } from "@/features/session/domain/logout";

export type ServerLogoutRepository = Readonly<{
  revoke(accessToken: string): Promise<ServerRevokeStatus>;
}>;
