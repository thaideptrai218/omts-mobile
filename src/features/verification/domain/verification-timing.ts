import type { VerificationChallenge } from "@/features/verification/domain/verification-contract";

export type VerificationTiming = Readonly<{
  hasRemainingSends: boolean;
  isExpired: boolean;
  isResendCooldownComplete: boolean;
  secondsUntilExpiration: number;
  secondsUntilResend: number;
}>;

function secondsUntil(targetEpochMs: number, nowEpochMs: number): number {
  return Math.max(0, Math.ceil((targetEpochMs - nowEpochMs) / 1_000));
}

export function getVerificationTiming(
  challenge: VerificationChallenge,
  nowEpochMs: number,
): VerificationTiming {
  const secondsUntilExpiration = secondsUntil(
    challenge.expiresAtEpochMs,
    nowEpochMs,
  );
  const secondsUntilResend = secondsUntil(
    challenge.resendAvailableAtEpochMs,
    nowEpochMs,
  );

  return {
    hasRemainingSends: challenge.sendsRemaining > 0,
    isExpired: nowEpochMs >= challenge.expiresAtEpochMs,
    isResendCooldownComplete: secondsUntilResend === 0,
    secondsUntilExpiration,
    secondsUntilResend,
  };
}
