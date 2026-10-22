import type { MobileSession } from "@/features/session/domain/mobile-session";

// Synthetic fixtures only. Never copy production credentials or contacts here.
export const MOCK_PASSWORD = "OmtsDemo2026";
export const MOCK_VERIFICATION_CODE = "246810";

export const mockSessionFixtures: readonly MobileSession[] = [
  {
    accountId: "mock-staff-first",
    displayName: "Nguyễn Minh An",
    username: "nguyen.minh.an",
    grants: [{ zoneName: "Vùng Đông", roleName: "Nhân viên" }],
    contacts: [
      {
        channel: "email",
        maskedRecipient: "a***@example.invalid",
        verified: false,
      },
      { channel: "sms", maskedRecipient: "******0123", verified: false },
    ],
    nextAction: "changePassword",
  },
  {
    accountId: "mock-staff-ready",
    displayName: "Trần Thu Hà",
    username: "tran.thu.ha",
    grants: [{ zoneName: "Vùng Tây", roleName: "Quản lý vùng" }],
    contacts: [
      {
        channel: "email",
        maskedRecipient: "h***@example.invalid",
        verified: true,
      },
    ],
    nextAction: "ready",
  },
];
