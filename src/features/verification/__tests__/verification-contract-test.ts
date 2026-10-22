import {
  createVerificationSubmission,
  InvalidVerificationCodeError,
  type VerificationChallenge,
} from "@/features/verification/domain/verification-contract";

const challenge: VerificationChallenge = {
  attemptsRemaining: 4,
  channel: "sms",
  expiresAtEpochMs: 1_798_000_300_000,
  id: "challenge-1",
  maskedRecipient: "******6789",
  purpose: "accountOnboarding",
  resendAvailableAtEpochMs: 1_798_000_060_000,
  sendsRemaining: 2,
};

describe("verification domain contract", () => {
  test("creates a submission bound to the exact challenge and purpose", () => {
    const submission = createVerificationSubmission(challenge, "123456");

    expect(submission).toEqual({
      challengeId: "challenge-1",
      code: "123456",
      purpose: "accountOnboarding",
    });
    expect(submission).not.toHaveProperty("maskedRecipient");
  });

  test.each(["", "12345", "1234567", "12a456"])(
    "rejects incomplete code %s",
    (code) => {
      expect(() => createVerificationSubmission(challenge, code)).toThrow(
        InvalidVerificationCodeError,
      );
    },
  );
});
