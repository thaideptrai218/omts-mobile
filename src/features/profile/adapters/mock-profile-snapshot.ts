import type { MobileSession } from "@/features/session/domain/mobile-session";
import type { ProfileSnapshot } from "../services/profile-service";

export type MockProfileOwner = {
  session: MobileSession;
  profileRevision: number;
};

export function mockProfileRevision(account: MockProfileOwner) {
  return `mock-profile-${account.session.accountId}-${account.profileRevision}`;
}

// A detached DTO from current mock state: no I/O, writes or async work.
export function createMockProfileSnapshot(
  account: MockProfileOwner,
): ProfileSnapshot {
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
    revision: mockProfileRevision(account),
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
