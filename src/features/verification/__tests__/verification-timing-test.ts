import type { VerificationChallenge } from "@/features/verification/domain/verification-contract";
import { getVerificationTiming } from "@/features/verification/domain/verification-timing";

const nowEpochMs = 1_798_000_000_000;

function createChallenge(
  overrides: Partial<VerificationChallenge> = {},
): VerificationChallenge {
  return {
    attemptsRemaining: 4,
    channel: "sms",
    expiresAtEpochMs: nowEpochMs + 5 * 60_000,
    id: "challenge-1",
    maskedRecipient: "******6789",
    purpose: "accountOnboarding",
    resendAvailableAtEpochMs: nowEpochMs + 60_000,
    sendsRemaining: 2,
    ...overrides,
  };
}

describe("verification timing", () => {
  test("returns whole seconds without enabling a boundary early", () => {
    const timing = getVerificationTiming(
      createChallenge({
        expiresAtEpochMs: nowEpochMs + 1_001,
        resendAvailableAtEpochMs: nowEpochMs + 1,
      }),
      nowEpochMs,
    );

    expect(timing.secondsUntilExpiration).toBe(2);
    expect(timing.secondsUntilResend).toBe(1);
    expect(timing.isExpired).toBe(false);
    expect(timing.isResendCooldownComplete).toBe(false);
  });

  test("marks cooldown complete at its exact server timestamp", () => {
    const timing = getVerificationTiming(
      createChallenge({ resendAvailableAtEpochMs: nowEpochMs }),
      nowEpochMs,
    );

    expect(timing.secondsUntilResend).toBe(0);
    expect(timing.isResendCooldownComplete).toBe(true);
  });

  test("marks challenge expired at its exact server timestamp", () => {
    const timing = getVerificationTiming(
      createChallenge({ expiresAtEpochMs: nowEpochMs }),
      nowEpochMs,
    );

    expect(timing.secondsUntilExpiration).toBe(0);
    expect(timing.isExpired).toBe(true);
  });

  test("reports send availability separately from cooldown", () => {
    const timing = getVerificationTiming(
      createChallenge({
        resendAvailableAtEpochMs: nowEpochMs,
        sendsRemaining: 0,
      }),
      nowEpochMs,
    );

    expect(timing.isResendCooldownComplete).toBe(true);
    expect(timing.hasRemainingSends).toBe(false);
  });

  test("clamps elapsed durations instead of returning negatives", () => {
    const timing = getVerificationTiming(
      createChallenge({
        expiresAtEpochMs: nowEpochMs - 10_000,
        resendAvailableAtEpochMs: nowEpochMs - 5_000,
      }),
      nowEpochMs,
    );

    expect(timing.secondsUntilExpiration).toBe(0);
    expect(timing.secondsUntilResend).toBe(0);
  });
});
