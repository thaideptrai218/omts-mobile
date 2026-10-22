import type { PasswordChangeSubmission } from "@/features/security/domain/password-change-form";

export type PasswordChangeResult =
  | Readonly<{ status: "changed" }>
  | Readonly<{ status: "current-password-invalid" }>
  | Readonly<{ status: "offline" }>
  | Readonly<{ status: "session-expired" }>;

export type PasswordChangeService = Readonly<{
  change(input: PasswordChangeSubmission): Promise<PasswordChangeResult>;
}>;
