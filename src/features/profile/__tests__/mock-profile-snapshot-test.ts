import { mockSessionFixtures } from "@/features/session/adapters/mock-session-fixtures";
import { createMockProfileGateway } from "../adapters/mock-profile-gateway";
import { createMockContactChangeGateway } from "../adapters/mock-contact-change-gateway";
import {
  createMockProfileSnapshot,
  type MockProfileOwner,
} from "../adapters/mock-profile-snapshot";

function owner(): MockProfileOwner {
  return { session: mockSessionFixtures[1], profileRevision: 1 };
}

test.each([
  { subjectType: "Staff" as const, label: "Nhân viên hợp tác xã" },
  { subjectType: "Trader" as const, label: "Thương lái" },
])(
  "snapshot maps $subjectType and missing contacts without inventing values",
  ({ subjectType, label }) => {
    const account = owner();
    account.session = {
      ...account.session,
      subjectType,
      grants: [],
      contacts: [],
    };
    expect(createMockProfileSnapshot(account)).toEqual({
      displayName: account.session.displayName,
      revision: "mock-profile-mock-staff-ready-1",
      account: {
        accountCode: account.session.accountId,
        accountTypeLabel: label,
        username: account.session.username,
        accessSummary: [],
        email: { value: null, verified: false },
        phone: { value: null, verified: false },
      },
    });
  },
);

test("snapshot is a pure detached value, not a live view of account changes", () => {
  const account = owner();
  const before = JSON.stringify(account);
  const first = createMockProfileSnapshot(account);
  const copy = createMockProfileSnapshot(account);
  expect(JSON.stringify(account)).toBe(before);
  expect(first).toEqual(copy);
  expect(first.account.email).not.toBe(copy.account.email);
  expect(first.account.accessSummary).not.toBe(copy.account.accessSummary);
  account.profileRevision++;
  account.session = {
    ...account.session,
    displayName: "Tên mới",
    contacts: [],
  };
  expect(first).toEqual(copy);
  expect(first.account.email).toEqual({
    value: "h***@example.invalid",
    verified: true,
  });
  expect(first.account.accessSummary).toEqual(["Quản lý vùng — Vùng Tây"]);
  expect(createMockProfileSnapshot(account)).toMatchObject({
    displayName: "Tên mới",
    revision: "mock-profile-mock-staff-ready-2",
    account: { email: { value: null, verified: false } },
  });
});

test("extracting the builder does not bypass gateway readiness guards", async () => {
  const account = owner();
  account.session = { ...account.session, nextAction: "verifyContact" };
  const profile = createMockProfileGateway(() => account);
  const replace = jest.fn();
  const contact = createMockContactChangeGateway({
    resolveOwner: () => account,
    currentIdentifier: () => "ha@example.invalid",
    isTaken: () => false,
    replace,
  });
  const credential = { handle: "synthetic-unready" };
  await expect(profile.load(credential)).rejects.toMatchObject({
    code: "unavailable",
  });
  await expect(
    profile.save(credential, {
      displayName: "Tên mới",
      expectedRevision: "mock-profile-mock-staff-ready-1",
    }),
  ).rejects.toMatchObject({ code: "unavailable" });
  await expect(
    contact.start(credential, {
      channel: "email",
      identifier: "new@example.invalid",
      expectedRevision: "mock-profile-mock-staff-ready-1",
    }),
  ).rejects.toMatchObject({ code: "unavailable" });
  expect(replace).not.toHaveBeenCalled();
  expect(account.profileRevision).toBe(1);
});
