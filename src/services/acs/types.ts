/**
 * Hợp đồng dữ liệu của các API tài khoản (ACS) trong OMTS.Api, nhánh develop sau OMTS-198.
 * Tên trường theo camelCase như JSON server trả; enum đi bằng tên ("Sms", "Mobile", "Trader").
 */

export type ClientType = "Web" | "Mobile";

export type SubjectType = "SystemAdministrator" | "CooperativeOwner" | "Staff" | "Trader";

export type NotificationChannel = "InApp" | "Push" | "Email" | "Sms" | "Zalo";

/**
 * Phiên OMTS: `POST api/auth/zalo/link`, `POST api/auth/zalo/login`, `POST api/auth/refresh`. Server còn trả
 * `mustChangePassword`, `phoneVerificationRequired` cho bản web; mobile không dùng (không có mật khẩu,
 * số điện thoại đã được Zalo xác minh lúc liên kết).
 */
export type AuthTokens = {
  accessToken: string;
  accessTokenExpiresAt: string;
  refreshToken: string;
  refreshTokenExpiresAt: string;
  accountId: string;
  displayName: string;
  subjectType: SubjectType;
};

/**
 * `POST api/auth/zalo/link` (đề xuất, xem docs/zalo-account-linking.md): phiên OMTS sau khi liên kết.
 * `notice`: chữ MSG57 khi nhiều hồ sơ khách cũ trùng số, ngược lại null.
 */
export type ZaloLinkResult = AuthTokens & {
  notice: string | null;
};

/** `POST api/auth/zalo/login` (đề xuất): phiên OMTS cho tài khoản đã liên kết. */
export type ZaloLoginResult = AuthTokens;

export type ProfileGrantView = {
  role: string;
  zoneId: string | null;
  zoneName: string | null;
  allZones: boolean;
};

export type ProfileView = {
  accountId: string;
  username: string;
  displayName: string;
  subjectType: SubjectType;
  email: string | null;
  emailVerified: boolean;
  phoneNumber: string | null;
  phoneVerified: boolean;
  grants: ProfileGrantView[];
  rowVersion: string;
};

export type ProfileSaved = {
  profile: ProfileView;
  message: string;
};

export type ChannelPreferenceView = {
  channel: NotificationChannel;
  enabled: boolean;
  eligible: boolean;
  /** EMAIL_NOT_VERIFIED, ZALO_NOT_CONFIGURED, NO_PUSH_DEVICE hoặc null. */
  ineligibleReason: string | null;
};

export type CategoryPreferenceView = {
  category: string;
  mandatory: boolean;
  channels: ChannelPreferenceView[];
};

export type NotificationPreferenceChange = {
  category: string;
  channel: NotificationChannel;
  enabled: boolean;
};

export type NotificationPreferencesSaved = {
  categories: CategoryPreferenceView[];
  message: string;
  notice: string | null;
};

export type RegisterPushDeviceRequest = {
  token: string;
  platform: "ios" | "android" | "web";
  permissionGranted: boolean;
};

/** Một chức năng người dùng được dùng, kèm phạm vi vùng và các thao tác (View, Create, Edit…). */
export type FunctionAccess = {
  function: string;
  name: string;
  allZones: boolean;
  zoneIds: string[];
  actions: string[];
};

export type GrantView = {
  zoneId: string | null;
  zoneCode: string | null;
  zoneName: string | null;
  allZones: boolean;
  role: string;
  permissions: unknown[];
};

/** `GET api/me/permissions`: nguồn duy nhất để dựng menu trên mobile. */
export type MyPermissions = {
  accountId: string;
  subjectType: SubjectType;
  isCooperativeOwner: boolean;
  requiresPasswordChange: boolean;
  requiresPhoneVerification: boolean;
  functions: FunctionAccess[];
  grants: GrantView[];
};
