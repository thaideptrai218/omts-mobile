import type { VerificationChallenge } from "@/features/verification/domain/verification-contract";
import { validateNewPassword } from "@/shared/security/new-password-policy";
import { MOCK_VERIFICATION_CODE } from "@/features/session/adapters/mock-session-fixtures";
import type { RecoveryGateway } from "../services/recovery-gateway";

export type MockRecoveryOwner = Readonly<{
  accountId: string;
  replacePassword: (password: string) => void;
}>;
type Attempt = {
  challenge: VerificationChallenge;
  owner: MockRecoveryOwner | null;
  proof: string | null;
  proofExpiresAt: number;
  cancelled: boolean;
  code: string;
};
type Budget = {
  until: number;
  sends: number;
  failures: number;
  nextSend: number;
};

function maskIdentifier(identifier: string) {
  const separator = identifier.indexOf("@");
  return separator >= 0
    ? `${identifier.slice(0, 1)}***${identifier.slice(separator)}`
    : `******${identifier.slice(-4)}`;
}

export function createMockRecoveryGateway(
  resolveOwner: (identifier: string) => MockRecoveryOwner | null,
  now: () => number = Date.now,
  deliveryAvailable: () => boolean = () => true,
): RecoveryGateway {
  const attempts = new Map<string, Attempt>();
  const budgets = new Map<string, Budget>();
  const identifiers = new Map<string, string>();
  let sequence = 0;

  function issue(identifier: string): VerificationChallenge {
    let budget = budgets.get(identifier);
    if (!budget || now() >= budget.until) {
      budget = {
        until: now() + 5 * 60_000,
        sends: 0,
        failures: 0,
        nextSend: 0,
      };
      budgets.set(identifier, budget);
    }
    // Same public response even when unknown, throttled or ineligible.
    const allowed =
      budget.sends < 3 && budget.failures < 5 && now() >= budget.nextSend;
    for (const [id, attempt] of attempts) {
      if (identifiers.get(id) === identifier) attempt.cancelled = true;
    }
    if (allowed) {
      budget.sends++;
      budget.nextSend = now() + 60_000;
    }
    const challenge: VerificationChallenge = {
      id: `mock-recovery-code-${++sequence}`,
      purpose: "accountRecovery",
      channel: identifier.includes("@") ? "email" : "sms",
      maskedRecipient: maskIdentifier(identifier),
      expiresAtEpochMs: budget.until,
      resendAvailableAtEpochMs: budget.nextSend,
      attemptsRemaining: Math.max(0, 5 - budget.failures),
      sendsRemaining: Math.max(0, 3 - budget.sends),
    };
    let owner: MockRecoveryOwner | null = null;
    // Provider/lookup failure is deliberately indistinguishable from no eligible account.
    if (allowed) {
      try {
        if (deliveryAvailable()) owner = resolveOwner(identifier);
      } catch {
        /* same public envelope */
      }
    }
    attempts.set(challenge.id, {
      challenge,
      owner,
      proof: null,
      proofExpiresAt: 0,
      cancelled: false,
      code: allowed
        ? [MOCK_VERIFICATION_CODE, "246811", "246812"][budget.sends - 1]
        : "",
    });
    identifiers.set(challenge.id, identifier);
    return { ...challenge };
  }
  return {
    async start(identifier) {
      return issue(identifier.trim());
    },
    async resend(challengeId) {
      const previous = attempts.get(challengeId);
      const identifier = identifiers.get(challengeId);
      if (!previous || previous.cancelled || previous.proof || !identifier)
        throw new Error("Recovery attempt unavailable");
      const budget = budgets.get(identifier);
      if (
        !budget ||
        now() < budget.nextSend ||
        budget.sends >= 3 ||
        budget.failures >= 5
      )
        return { ...previous.challenge };
      return issue(identifier);
    },
    async verify(challengeId, code) {
      const attempt = attempts.get(challengeId);
      if (
        !attempt ||
        attempt.cancelled ||
        attempt.proof ||
        now() >= attempt.challenge.expiresAtEpochMs ||
        attempt.challenge.attemptsRemaining <= 0
      )
        return {
          status: "invalid",
          challenge: attempt ? { ...attempt.challenge } : null,
        };
      const budget = budgets.get(identifiers.get(challengeId) ?? "");
      if (!attempt.owner || code !== attempt.code) {
        if (budget) budget.failures++;
        attempt.challenge = {
          ...attempt.challenge,
          attemptsRemaining: Math.max(
            0,
            attempt.challenge.attemptsRemaining - 1,
          ),
        };
        return { status: "invalid", challenge: { ...attempt.challenge } };
      }
      attempt.proof = `mock-recovery-proof-${++sequence}`;
      attempt.proofExpiresAt = now() + 5 * 60_000; // Mock-only proof TTL, not an API policy.
      return { status: "verified", proof: { handle: attempt.proof } };
    },
    async complete(proof, newPassword) {
      const attempt = [...attempts.values()].find(
        (item) => item.proof === proof.handle,
      );
      if (
        !attempt ||
        !attempt.proof ||
        attempt.cancelled ||
        !attempt.owner ||
        now() >= attempt.proofExpiresAt
      )
        return { status: "attempt-invalid" };
      if (
        !validateNewPassword({
          password: newPassword,
          passwordConfirmation: newPassword,
        }).isValid
      )
        throw new Error("Invalid recovery password");
      attempt.owner.replacePassword(newPassword);
      for (const item of attempts.values()) {
        if (item.owner?.accountId === attempt.owner.accountId) {
          item.cancelled = true;
          item.proof = null;
        }
      }
      return { status: "completed" };
    },
    cancel(challengeId) {
      const attempt = attempts.get(challengeId);
      if (attempt) {
        attempt.cancelled = true;
        attempt.proof = null;
      }
    },
  };
}
