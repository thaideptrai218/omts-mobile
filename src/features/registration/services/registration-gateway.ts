import type { RegistrationFormData } from "../domain/registration-form";
import type { VerificationChallenge } from "@/features/verification/domain/verification-contract";

// Application contract only; no backend DTO or customer/order linkage.
export type RegistrationProof = Readonly<{ handle: string }>;
export type RegistrationStartResult =
  | { status: "started"; challenge: VerificationChallenge }
  | { status: "unavailable" };
export type RegistrationVerifyResult =
  | { status: "verified"; proof: RegistrationProof }
  | { status: "invalid"; challenge: VerificationChallenge | null };
export type RegistrationCompletionResult = {
  status: "created" | "attempt-invalid" | "unavailable" | "offline";
};
export interface RegistrationGateway {
  start(input: RegistrationFormData): Promise<RegistrationStartResult>;
  resend(challengeId: string): Promise<VerificationChallenge>;
  verify(challengeId: string, code: string): Promise<RegistrationVerifyResult>;
  complete(proof: RegistrationProof): Promise<RegistrationCompletionResult>;
  cancel(challengeId: string): void;
}
