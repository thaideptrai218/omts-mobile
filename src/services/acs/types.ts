/**
 * Hợp đồng dữ liệu của các API tài khoản (ACS) trong OMTS.Api, nhánh develop sau OMTS-198.
 * Tên trường theo camelCase như JSON server trả; enum đi bằng tên ("Sms", "Mobile", "Trader").
 */

export type ClientType = "Web" | "Mobile";

export type VerificationChannel = "Sms" | "Email";

export type SubjectType = "SystemAdministrator" | "CooperativeOwner" | "Staff" | "Trader";

export type NotificationChannel = "InApp" | "Push" | "Email" | "Sms" | "Zalo";

/** `POST api/auth/login`, `POST api/auth/refresh` và `tokens` của đổi mật khẩu. */
export type AuthTokens = {
  accessToken: string;
  accessTokenExpiresAt: string;
  refreshToken: string;
  refreshTokenExpiresAt: string;
  accountId: string;
  displayName: string;
  subjectType: SubjectType;
  mustChangePassword: boolean;
  phoneVerificationRequired: boolean;
};

/**
 * `POST api/auth/zalo/link` (đề xuất, xem docs/zalo-account-linking.md): phiên OMTS sau khi liên kết.
 * `created`: vừa tạo tài khoản thương lái từ số Zalo; `oldDocumentsHidden`/`notice`: MSG57 khi nhiều hồ
 * sơ khách cũ trùng số.
 */
export type ZaloLinkResult = AuthTokens & {
  created: boolean;
  oldDocumentsHidden: boolean;
  notice: string | null;
};

/** `POST api/auth/zalo/login` (đề xuất): phiên OMTS cho tài khoản đã liên kết. */
export type ZaloLoginResult = AuthTokens;

/** Một yêu cầu xác minh đã gửi mã (ACS-06). */
export type VerificationStarted = {
  verificationId: string;
  maskedTarget: string;
  expiresAt: string;
  sendsLeft: number;
  nextResendAt: string;
};

export type VerificationTokenIssued = {
  verificationToken: string;
  expiresAt: string;
};

export type TraderRegistered = {
  accountId: string;
  username: string;
  oldDocumentsHidden: boolean;
  notice: string | null;
};

export type RecoveryStarted = {
  requestId: string;
  message: string;
};

export type PasswordChanged = {
  tokens: AuthTokens;
  message: string;
};

export type ContactConfirmed = {
  contact: string;
  oldDocumentsHidden: boolean;
  notice: string | null;
};

export type ContactChangeStarted = {
  verification: VerificationStarted;
  message: string;
};

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
