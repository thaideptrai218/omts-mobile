import {
  SessionFailure,
  type SessionCredential,
} from "@/features/session/domain/mobile-session";
import type {
  VerificationChannel,
  VerificationChallenge,
} from "@/features/verification/domain/verification-contract";
import type {
  ContactChangeGateway,
  ContactChangeInput,
} from "../services/contact-change-gateway";
import {
  createMockProfileSnapshot,
  mockProfileRevision,
  type MockProfileOwner,
} from "./mock-profile-snapshot";

type Budget = {
  until: number;
  sends: number;
  failures: number;
  nextSend: number;
};
type Attempt = {
  accountId: string;
  input: ContactChangeInput;
  challenge: VerificationChallenge;
  budget: Budget;
  code: string;
};
type Options = {
  resolveOwner: (credential: SessionCredential) => MockProfileOwner;
  currentIdentifier: (
    accountId: string,
    channel: VerificationChannel,
  ) => string | undefined;
  isTaken: (
    channel: VerificationChannel,
    identifier: string,
    accountId: string,
  ) => boolean;
  replace: (
    account: MockProfileOwner,
    channel: VerificationChannel,
    identifier: string,
  ) => void;
  now?: () => number;
  deliveryAvailable?: () => boolean;
};

export function createMockContactChangeGateway({
  resolveOwner,
  currentIdentifier,
  isTaken,
  replace,
  now = () => Date.now(),
  deliveryAvailable = () => true,
}: Options): ContactChangeGateway {
  const attempts = new Map<string, Attempt>();
  const budgets = new Map<string, Budget>();
  let sequence = 0;
  function owner(credential: SessionCredential) {
    const account = resolveOwner(credential);
    if (account.session.nextAction !== "ready")
      throw new SessionFailure("unavailable");
    return account;
  }
  function eligibility(account: MockProfileOwner, input: ContactChangeInput) {
    if (mockProfileRevision(account) !== input.expectedRevision)
      return "conflict" as const;
    if (
      !input.identifier ||
      currentIdentifier(account.session.accountId, input.channel) ===
        input.identifier ||
      isTaken(input.channel, input.identifier, account.session.accountId)
    )
      return "contact-invalid" as const;
    return null;
  }
  function find(credential: SessionCredential, id: string) {
    const account = owner(credential);
    const attempt = attempts.get(id);
    if (!attempt || attempt.accountId !== account.session.accountId)
      throw new SessionFailure("verification");
    return { account, attempt };
  }
  function issue(
    accountId: string,
    input: ContactChangeInput,
  ): VerificationChallenge {
    const sentAt = now();
    const key = `${accountId}:${input.channel}:${input.identifier}`;
    let budget = budgets.get(key);
    if (!budget || sentAt >= budget.until) {
      budget = { until: sentAt + 300_000, sends: 0, failures: 0, nextSend: 0 };
      budgets.set(key, budget);
    }
    if (sentAt < budget.nextSend || budget.sends >= 3 || budget.failures >= 5)
      throw new SessionFailure("verification");
    budget.sends++;
    budget.nextSend = sentAt + 60_000;
    if (!deliveryAvailable()) throw new SessionFailure("unavailable");
    for (const [id, previous] of attempts) {
      if (
        previous.accountId === accountId &&
        previous.input.channel === input.channel
      )
        attempts.delete(id);
    }
    const at = input.identifier.indexOf("@");
    const challenge: VerificationChallenge = {
      id: `mock-contact-code-${++sequence}`,
      purpose: "profileContactChange",
      channel: input.channel,
      maskedRecipient:
        input.channel === "email"
          ? `${input.identifier.slice(0, 1)}***${input.identifier.slice(at)}`
          : `******${input.identifier.slice(-4)}`,
      expiresAtEpochMs: sentAt + 300_000,
      resendAvailableAtEpochMs: budget.nextSend,
      attemptsRemaining: 5 - budget.failures,
      sendsRemaining: 3 - budget.sends,
    };
    attempts.set(challenge.id, {
      accountId,
      input: { ...input },
      challenge,
      budget,
      code: ["246810", "246811", "246812"][budget.sends - 1],
    });
    return { ...challenge };
  }
  return {
    async start(credential, input) {
      const account = owner(credential);
      const normalized = { ...input, identifier: input.identifier.trim() };
      const invalid = eligibility(account, normalized);
      if (invalid) return { status: invalid };
      return {
        status: "started",
        challenge: issue(account.session.accountId, normalized),
      };
    },
    async resend(credential, id) {
      const { account, attempt } = find(credential, id);
      if (eligibility(account, attempt.input))
        throw new SessionFailure("verification");
      if (
        now() < attempt.budget.nextSend ||
        attempt.budget.sends >= 3 ||
        attempt.budget.failures >= 5
      )
        return { ...attempt.challenge };
      return issue(attempt.accountId, attempt.input);
    },
    async verify(credential, id, code) {
      const { account, attempt } = find(credential, id);
      const invalid = eligibility(account, attempt.input);
      if (invalid) {
        attempts.delete(id);
        return { status: invalid };
      }
      if (
        now() >= attempt.challenge.expiresAtEpochMs ||
        attempt.challenge.attemptsRemaining <= 0
      )
        return { status: "invalid", challenge: { ...attempt.challenge } };
      if (code !== attempt.code) {
        attempt.budget.failures++;
        attempt.challenge = {
          ...attempt.challenge,
          attemptsRemaining: 5 - attempt.budget.failures,
        };
        return { status: "invalid", challenge: { ...attempt.challenge } };
      }
      // Check and write synchronously in this mock; API atomicity is not implied.
      replace(account, attempt.input.channel, attempt.input.identifier);
      attempts.delete(id);
      return {
        status: "saved",
        profile: createMockProfileSnapshot(account),
      };
    },
    cancel(id) {
      attempts.delete(id);
    },
  };
}
