import type { VerificationChallenge } from "@/features/verification/domain/verification-contract";
import type { RecoveryCompletionResult } from "./recovery-completion-service";

export type RecoveryProof = Readonly<{ handle: string }>;
export type RecoveryCodeResult =
  | Readonly<{ status: "verified"; proof: RecoveryProof }>
  | Readonly<{ status: "invalid"; challenge: VerificationChallenge | null }>;

// Application contract for mock assembly, not a backend endpoint/DTO.
export type RecoveryGateway = Readonly<{
  start(identifier: string): Promise<VerificationChallenge>;
  resend(challengeId: string): Promise<VerificationChallenge>;
  verify(challengeId: string, code: string): Promise<RecoveryCodeResult>;
  complete(
    proof: RecoveryProof,
    newPassword: string,
  ): Promise<RecoveryCompletionResult>;
  cancel(challengeId: string): void;
}>;
