import {
  MobileSession,
  MobileSessionGateway,
  SessionCredential,
  SessionFailure,
} from "@/features/session/domain/mobile-session";
import { validateNewPassword } from "@/shared/security/new-password-policy";
import { createMockOnboardingCodes } from "./mock-onboarding-codes";
import { mockSessionFixtures, MOCK_PASSWORD } from "./mock-session-fixtures";
import { createMockProfileGateway } from "@/features/profile/adapters/mock-profile-gateway";
import { createMockSessionNotificationGateway } from "@/features/notifications/adapters/mock-session-notification-gateway";

type MockAccount = {
  session: MobileSession;
  password: string;
  profileRevision: number;
};
type MockLease = { account: MockAccount; accessExpires: number };

export function createMockSessionGateway(now: () => number = Date.now) {
  const accounts = mockSessionFixtures.map(
    (session): MockAccount => ({
      session: {
        ...session,
        contacts: session.contacts.map((contact) => ({ ...contact })),
      },
      password: MOCK_PASSWORD,
      profileRevision: 1,
    }),
  );
  const leases = new Map<string, MockLease>();
  const codes = createMockOnboardingCodes(now);
  let sequence = 0;

  function lease(credential: SessionCredential): MockLease {
    const found = leases.get(credential.handle);
    if (!found) throw new SessionFailure("expired");
    return found;
  }
  function issue(account: MockAccount) {
    const credential = { handle: `mock-session-${++sequence}` };
    // Accelerated mock timing only, not a production lifetime decision.
    leases.set(credential.handle, { account, accessExpires: now() + 60_000 });
    return { credential, session: account.session };
  }

  const gateway: MobileSessionGateway = {
    async login(identifier, password) {
      const account = accounts.find(
        (item) => item.session.username === identifier.trim(),
      );
      if (!account || account.password !== password)
        throw new SessionFailure("credentials");
      codes.reset(account.session.accountId);
      return issue(account);
    },
    async inspect(credential) {
      const current = lease(credential);
      if (now() >= current.accessExpires) throw new SessionFailure("expired");
      return current.account.session;
    },
    async refresh(credential) {
      const current = lease(credential);
      leases.delete(credential.handle);
      return issue(current.account);
    },
    async changePassword(credential, currentPassword, next) {
      const { account } = lease(credential);
      if (account.password !== currentPassword) return null;
      if (
        !validateNewPassword({ password: next, passwordConfirmation: next })
          .isValid
      ) {
        throw new SessionFailure("unavailable");
      }
      account.password = next;
      if (account.session.nextAction === "changePassword") {
        account.session = {
          ...account.session,
          nextAction: account.session.contacts.some(
            (contact) => contact.verified,
          )
            ? "ready"
            : "verifyContact",
        };
      }
      return account.session;
    },
    async sendCode(credential, channel) {
      const { session } = lease(credential).account;
      const contact = session.contacts.find((item) => item.channel === channel);
      if (session.nextAction !== "verifyContact" || !contact)
        throw new SessionFailure("verification");
      return codes.send(session.accountId, contact);
    },
    async verifyCode(credential, challengeId, code) {
      const { account } = lease(credential);
      if (account.session.nextAction !== "verifyContact")
        throw new SessionFailure("verification");
      let channel;
      try {
        channel = codes.verify(account.session.accountId, challengeId, code);
      } catch {
        throw new SessionFailure(
          "verification",
          codes.current(account.session.accountId) ?? undefined,
        );
      }
      account.session = {
        ...account.session,
        contacts: account.session.contacts.map((contact) =>
          contact.channel === channel
            ? { ...contact, verified: true }
            : contact,
        ),
        nextAction: "ready",
      };
      return account.session;
    },
    async revoke(credential) {
      leases.delete(credential.handle);
    },
  };
  const profileGateway = createMockProfileGateway(
    (credential) => lease(credential).account,
  );
  const notificationGateway = createMockSessionNotificationGateway(
    (credential) => lease(credential).account.session,
  );
  return {
    gateway,
    profileGateway,
    notificationGateway,
    currentChallenge: codes.current,
  };
}
