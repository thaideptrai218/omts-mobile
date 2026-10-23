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
import { createMockRecoveryGateway } from "@/features/recovery/adapters/mock-recovery-gateway";
import { mockRecoveryIdentifiers } from "@/features/recovery/adapters/mock-recovery-identifiers";
import { createMockRegistrationGateway } from "@/features/registration/adapters/mock-registration-gateway";
import { createMockContactChangeGateway } from "@/features/profile/adapters/mock-contact-change-gateway";

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
  const identifiers: {
    accountId: string;
    channel: "email" | "sms";
    identifier: string;
  }[] = [...mockRecoveryIdentifiers];
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
        (item) =>
          item.session.username === identifier.trim() ||
          identifiers.some(
            (contact) =>
              contact.accountId === item.session.accountId &&
              contact.identifier === identifier.trim() &&
              item.session.contacts.some(
                (value) => value.channel === contact.channel && value.verified,
              ),
          ),
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
  const contactChangeGateway = createMockContactChangeGateway({
    now,
    resolveOwner: (credential) => lease(credential).account,
    profileGateway,
    currentIdentifier: (accountId, channel) =>
      identifiers.find(
        (contact) =>
          contact.accountId === accountId && contact.channel === channel,
      )?.identifier,
    isTaken: (channel, identifier, accountId) =>
      identifiers.some(
        (contact) =>
          contact.channel === channel &&
          contact.identifier === identifier &&
          contact.accountId !== accountId,
      ),
    replace(account, channel, identifier) {
      const accountId = account.session.accountId;
      const oldIndex = identifiers.findIndex(
        (contact) =>
          contact.accountId === accountId && contact.channel === channel,
      );
      if (oldIndex >= 0) identifiers.splice(oldIndex, 1);
      identifiers.push({ accountId, channel, identifier });
      const at = identifier.indexOf("@");
      account.session = {
        ...account.session,
        contacts: [
          ...account.session.contacts.filter(
            (contact) => contact.channel !== channel,
          ),
          {
            channel,
            verified: true,
            maskedRecipient:
              channel === "email"
                ? `${identifier.slice(0, 1)}***${identifier.slice(at)}`
                : `******${identifier.slice(-4)}`,
          },
        ],
      };
      account.profileRevision++;
    },
  });
  const notificationGateway = createMockSessionNotificationGateway(
    (credential) => {
      const session = lease(credential).account.session;
      if (session.subjectType !== "Staff")
        throw new SessionFailure("unavailable");
      return session;
    },
  );
  const recoveryGateway = createMockRecoveryGateway((identifier) => {
    const contact = identifiers.find((item) => item.identifier === identifier);
    const account = accounts.find(
      (item) => item.session.accountId === contact?.accountId,
    );
    if (
      !account ||
      !contact ||
      !account.session.contacts.some(
        (item) => item.channel === contact.channel && item.verified,
      )
    )
      return null;
    return {
      accountId: account.session.accountId,
      isCurrent: () =>
        identifiers.some(
          (item) =>
            item.accountId === account.session.accountId &&
            item.channel === contact.channel &&
            item.identifier === identifier,
        ) &&
        account.session.contacts.some(
          (item) => item.channel === contact.channel && item.verified,
        ),
      replacePassword(password) {
        account.password = password;
        for (const [handle, current] of leases) {
          if (current.account === account) leases.delete(handle);
        }
        codes.reset(account.session.accountId);
      },
    };
  }, now);
  const registrationGateway = createMockRegistrationGateway({
    now,
    exists: (method, identifier) =>
      identifiers.some(
        (contact) =>
          contact.channel === (method === "email" ? "email" : "sms") &&
          contact.identifier === identifier,
      ),
    create(input) {
      const accountId = `mock-trader-${++sequence}`;
      const channel = input.method === "email" ? "email" : "sms";
      const at = input.identifier.indexOf("@");
      accounts.push({
        password: input.password,
        profileRevision: 1,
        session: {
          accountId,
          subjectType: "Trader",
          username: accountId,
          displayName: input.identifier,
          grants: [],
          nextAction: "ready",
          contacts: [
            {
              channel,
              verified: true,
              maskedRecipient:
                channel === "email"
                  ? `${input.identifier.slice(0, 1)}***${input.identifier.slice(at)}`
                  : `******${input.identifier.slice(-4)}`,
            },
          ],
        },
      });
      identifiers.push({ accountId, channel, identifier: input.identifier });
    },
  });
  return {
    gateway,
    profileGateway,
    contactChangeGateway,
    notificationGateway,
    recoveryGateway,
    registrationGateway,
    currentChallenge: codes.current,
  };
}
