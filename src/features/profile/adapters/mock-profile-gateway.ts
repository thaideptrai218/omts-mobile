import {
  SessionFailure,
  type MobileSession,
  type SessionCredential,
} from "@/features/session/domain/mobile-session";
import { validateProfileForm } from "../domain/profile-form";
import type { ProfileGateway } from "../services/profile-gateway";
import type { ProfileSnapshot } from "../services/profile-service";

export type MockProfileOwner = {
  session: MobileSession;
  profileRevision: number;
};

export function createMockProfileGateway(
  resolveOwner: (credential: SessionCredential) => MockProfileOwner,
): ProfileGateway {
  function owner(credential: SessionCredential) {
    const account = resolveOwner(credential);
    if (account.session.nextAction !== "ready")
      throw new SessionFailure("unavailable");
    return account;
  }
  function snapshot(account: MockProfileOwner): ProfileSnapshot {
    const { session } = account;
    const contact = (channel: "email" | "sms") => {
      const value = session.contacts.find((item) => item.channel === channel);
      return {
        value: value?.maskedRecipient ?? null,
        verified: value?.verified ?? false,
      };
    };
    return {
      displayName: session.displayName,
      revision: `mock-profile-${session.accountId}-${account.profileRevision}`,
      account: {
        accountCode: session.accountId,
        accountTypeLabel:
          session.subjectType === "Trader"
            ? "Thương lái"
            : "Nhân viên hợp tác xã",
        username: session.username,
        accessSummary: session.grants.map(
          (grant) => `${grant.roleName} — ${grant.zoneName}`,
        ),
        email: contact("email"),
        phone: contact("sms"),
      },
    };
  }
  return {
    async load(credential) {
      return snapshot(owner(credential));
    },
    async save(credential, input) {
      const account = owner(credential);
      if ("username" in input) return { status: "username-readonly" };
      if (input.expectedRevision !== snapshot(account).revision) {
        return { status: "conflict", updatedBy: null, updatedAt: null };
      }
      const validation = validateProfileForm({
        displayName: input.displayName,
      });
      if (!validation.isValid) throw new SessionFailure("unavailable");
      account.session = {
        ...account.session,
        displayName: validation.data.displayName,
      };
      account.profileRevision++;
      return { status: "saved", profile: snapshot(account) };
    },
  };
}
