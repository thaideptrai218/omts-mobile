import { SessionFailure } from "@/features/session/domain/mobile-session";
import type { VerificationChallenge } from "@/features/verification/domain/verification-contract";
import { validateNewPassword } from "@/shared/security/new-password-policy";
import type {
  RegistrationFormData,
  RegistrationMethod,
} from "../domain/registration-form";
import type { RegistrationGateway } from "../services/registration-gateway";

type Budget = {
  until: number;
  sends: number;
  failures: number;
  nextSend: number;
};
type Attempt = {
  challenge: VerificationChallenge;
  input: RegistrationFormData | null;
  budget: Budget;
  code: string;
  proof: string | null;
  proofExpiresAt: number;
};
type Options = {
  exists: (method: RegistrationMethod, identifier: string) => boolean;
  create: (input: RegistrationFormData) => void;
  now?: () => number;
  deliveryAvailable?: () => boolean;
};

export function createMockRegistrationGateway({
  exists,
  create,
  now = () => Date.now(),
  deliveryAvailable = () => true,
}: Options): RegistrationGateway {
  const attempts = new Map<string, Attempt>();
  const budgets = new Map<string, Budget>();
  let sequence = 0;
  const key = (input: RegistrationFormData) =>
    `${input.method}:${input.identifier}`;
  function cancel(id: string) {
    const attempt = attempts.get(id);
    if (attempt) {
      attempt.input = null;
      attempt.proof = null;
    }
  }
  function prune() {
    for (const [id, attempt] of attempts) {
      const expiry = attempt.proof
        ? attempt.proofExpiresAt
        : attempt.challenge.expiresAtEpochMs;
      if (now() >= expiry) cancel(id);
    }
  }
  function issue(input: RegistrationFormData): VerificationChallenge {
    prune();
    const sentAt = now();
    let budget = budgets.get(key(input));
    if (!budget || sentAt >= budget.until) {
      budget = { until: sentAt + 300_000, sends: 0, failures: 0, nextSend: 0 };
      budgets.set(key(input), budget);
    }
    if (budget.sends >= 3 || budget.failures >= 5 || sentAt < budget.nextSend)
      throw new SessionFailure("verification");
    budget.sends++;
    budget.nextSend = sentAt + 60_000;
    if (!deliveryAvailable()) throw new SessionFailure("unavailable");
    for (const [id, attempt] of attempts) {
      if (attempt.input && key(attempt.input) === key(input)) cancel(id);
    }
    const at = input.identifier.indexOf("@");
    const challenge: VerificationChallenge = {
      id: `mock-registration-code-${++sequence}`,
      purpose: "traderRegistration",
      channel: input.method === "email" ? "email" : "sms",
      maskedRecipient:
        input.method === "email"
          ? `${input.identifier.slice(0, 1)}***${input.identifier.slice(at)}`
          : `******${input.identifier.slice(-4)}`,
      expiresAtEpochMs: sentAt + 300_000,
      resendAvailableAtEpochMs: budget.nextSend,
      attemptsRemaining: 5 - budget.failures,
      sendsRemaining: 3 - budget.sends,
    };
    attempts.set(challenge.id, {
      challenge,
      input: { ...input },
      budget,
      code: ["246810", "246811", "246812"][budget.sends - 1],
      proof: null,
      proofExpiresAt: 0,
    });
    return { ...challenge };
  }
  return {
    async start(input) {
      prune();
      const normalized = { ...input, identifier: input.identifier.trim() };
      if (
        !normalized.identifier ||
        !validateNewPassword({
          password: input.password,
          passwordConfirmation: input.password,
        }).isValid
      )
        throw new SessionFailure("unavailable");
      if (exists(input.method, normalized.identifier))
        return { status: "unavailable" };
      return { status: "started", challenge: issue(normalized) };
    },
    async resend(id) {
      const attempt = attempts.get(id);
      if (!attempt?.input || attempt.proof)
        throw new SessionFailure("verification");
      const { budget } = attempt;
      if (now() < budget.nextSend || budget.sends >= 3 || budget.failures >= 5)
        return { ...attempt.challenge };
      const input = { ...attempt.input };
      const challenge = issue(input);
      cancel(id);
      return challenge;
    },
    async verify(id, code) {
      prune();
      const attempt = attempts.get(id);
      if (
        !attempt?.input ||
        attempt.proof ||
        attempt.challenge.attemptsRemaining <= 0
      )
        return {
          status: "invalid",
          challenge: attempt ? { ...attempt.challenge } : null,
        };
      if (code !== attempt.code) {
        attempt.budget.failures++;
        attempt.challenge = {
          ...attempt.challenge,
          attemptsRemaining: 5 - attempt.budget.failures,
        };
        return { status: "invalid", challenge: { ...attempt.challenge } };
      }
      attempt.proof = `mock-registration-proof-${++sequence}`;
      attempt.proofExpiresAt = now() + 300_000; // Mock-only proof lifetime.
      return { status: "verified", proof: { handle: attempt.proof } };
    },
    async complete(proof) {
      prune();
      const attempt = [...attempts.values()].find(
        (item) => item.proof === proof.handle,
      );
      if (!attempt?.input || !attempt.proof)
        return { status: "attempt-invalid" };
      if (exists(attempt.input.method, attempt.input.identifier)) {
        cancel(attempt.challenge.id);
        return { status: "unavailable" };
      }
      create(attempt.input);
      cancel(attempt.challenge.id);
      return { status: "created" };
    },
    cancel,
  };
}
