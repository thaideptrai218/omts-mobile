import { SessionFailure } from "@/features/session/domain/mobile-session";
import type { SessionContact } from "@/features/session/domain/mobile-session";
import type { VerificationChallenge } from "@/features/verification/domain/verification-contract";
import { MOCK_VERIFICATION_CODE } from "./mock-session-fixtures";

export function createMockOnboardingCodes(now: () => number) {
  const requests = new Map<
    string,
    { challenge: VerificationChallenge; verified: boolean }
  >();
  let sequence = 0;

  return {
    reset(accountId: string) {
      requests.delete(accountId);
    },
    send(accountId: string, contact: SessionContact): VerificationChallenge {
      const previous = requests.get(accountId);
      if (
        previous &&
        (previous.verified ||
          previous.challenge.sendsRemaining === 0 ||
          now() < previous.challenge.resendAvailableAtEpochMs)
      ) {
        throw new SessionFailure("verification");
      }
      const challenge: VerificationChallenge = {
        id: `mock-code-${++sequence}`,
        purpose: "accountOnboarding",
        channel: contact.channel,
        maskedRecipient: contact.maskedRecipient,
        expiresAtEpochMs: now() + 5 * 60_000,
        resendAvailableAtEpochMs: now() + 60_000,
        attemptsRemaining: 5,
        sendsRemaining: previous ? previous.challenge.sendsRemaining - 1 : 2,
      };
      requests.set(accountId, { challenge, verified: false });
      return { ...challenge };
    },
    verify(accountId: string, challengeId: string, code: string) {
      const request = requests.get(accountId);
      if (
        !request ||
        request.verified ||
        request.challenge.id !== challengeId ||
        now() >= request.challenge.expiresAtEpochMs ||
        request.challenge.attemptsRemaining <= 0
      ) {
        throw new SessionFailure("verification");
      }
      if (!/^\d{6}$/.test(code) || code !== MOCK_VERIFICATION_CODE) {
        request.challenge = {
          ...request.challenge,
          attemptsRemaining: request.challenge.attemptsRemaining - 1,
        };
        throw new SessionFailure("verification");
      }
      request.verified = true;
      return request.challenge.channel;
    },
    current(accountId: string) {
      const challenge = requests.get(accountId)?.challenge;
      return challenge ? { ...challenge } : null;
    },
  };
}
