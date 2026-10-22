import type {
  ProfileLoadResult,
  ProfileSaveResult,
  ProfileService,
  ProfileSnapshot,
} from "@/features/profile/services/profile-service";

export const profileFixture: ProfileSnapshot = {
  account: {
    accessSummary: ["Quản lý vùng — Vùng Đông"],
    accountCode: "ACC-TEST-12",
    accountTypeLabel: "Nhân viên hợp tác xã",
    email: { value: "hai@example.com", verified: true },
    phone: { value: null, verified: false },
    username: "le.minh.hai",
  },
  displayName: "Lê Minh Hải",
  revision: "opaque-version-1",
};

export function createProfileServiceMock() {
  return {
    load: jest.fn<Promise<ProfileLoadResult>, []>().mockResolvedValue({
      profile: profileFixture,
      status: "loaded",
    }),
    save: jest.fn<Promise<ProfileSaveResult>, Parameters<ProfileService["save"]>>()
      .mockResolvedValue({
        profile: { ...profileFixture, displayName: "Hải mới", revision: "opaque-version-2" },
        status: "saved",
      }),
  };
}
