export type ServerRevokeStatus = "failed" | "revoked";

export type LogoutResult = Readonly<{
  localCleanup: "cleared" | "failed";
  navigateToLogin: true;
  serverRevoke:
    | ServerRevokeStatus
    | "deferred-contract-required"
    | "not-needed";
  warningCode: "MSG07" | null;
}>;
