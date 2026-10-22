import {
  isCompleteVerificationCode,
  normalizeVerificationCode,
} from "@/features/verification/domain/verification-code";

export type VerificationPurpose =
  | "accountOnboarding"
  | "accountRecovery"
  | "profileContactChange"
  | "traderRegistration";

export type VerificationChannel = "email" | "sms";

export type VerificationChallenge = Readonly<{
  attemptsRemaining: number;
  channel: VerificationChannel;
  expiresAtEpochMs: number;
  id: string;
  maskedRecipient: string;
  purpose: VerificationPurpose;
  resendAvailableAtEpochMs: number;
  sendsRemaining: number;
}>;

export type VerificationSubmission = Readonly<{
  challengeId: string;
  code: string;
  purpose: VerificationPurpose;
}>;

export type VerificationResult = Readonly<{
  challengeId: string;
  purpose: VerificationPurpose;
  token: string;
}>;

export class InvalidVerificationCodeError extends Error {
  constructor() {
    super("Verification code must contain exactly six ASCII digits.");
    this.name = "InvalidVerificationCodeError";
  }
}

export function createVerificationSubmission(
  challenge: VerificationChallenge,
  code: string,
): VerificationSubmission {
  if (!isCompleteVerificationCode(code)) {
    throw new InvalidVerificationCodeError();
  }

  return {
    challengeId: challenge.id,
    code: normalizeVerificationCode(code),
    purpose: challenge.purpose,
  };
}
