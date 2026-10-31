/**
 * Hợp đồng dữ liệu của các API tài khoản (ACS) trong OMTS.Api, nhánh develop sau OMTS-198.
 * Tên trường theo camelCase như JSON server trả; enum đi bằng tên ("Sms", "Mobile", "Trader").
 */

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
 * `POST api/auth/zalo/link`: phiên OMTS sau khi liên kết (xem docs/zalo-account-linking.md).
 * `notice`: chữ MSG57 khi nhiều hồ sơ khách cũ trùng số, ngược lại null.
 */
export type ZaloLinkResult = AuthTokens & {
  notice: string | null;
};

/** `POST api/auth/zalo/trader-requests` (202): yêu cầu tài khoản thương lái đang chờ Chủ HTX duyệt. */
export type TraderRequestSent = {
  status: "PENDING_APPROVAL";
  displayName: string;
  maskedPhone: string;
};

/** `GET api/trader-requests` (Chủ HTX): một yêu cầu tài khoản thương lái gửi từ Mini App. */
export type TraderRequestView = {
  accountId: string;
  displayName: string;
  phoneNumber: string | null;
  note: string | null;
  requestedAt: string | null;
  /** PENDING_APPROVAL, REJECTED, hoặc ACTIVE ngay sau khi duyệt. */
  status: string;
  rejectionReason: string | null;
};

/** Một thông báo in-app của người đang đăng nhập; chưa đọc khi `readAt` rỗng. */
export type NotificationView = {
  id: string;
  type: string;
  title: string;
  body: string | null;
  relatedRecordType: string | null;
  relatedRecordCode: string | null;
  createdAt: string;
  readAt: string | null;
  isMandatory: boolean;
};

/** `GET api/me/notifications`: mới nhất trước, kèm số chưa đọc cho huy hiệu. */
export type NotificationPage = {
  items: NotificationView[];
  total: number;
  unreadCount: number;
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
  messageCode?: string;
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
  messageCode?: string;
  notice: string | null;
  noticeCode?: string | null;
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
  functions: FunctionAccess[];
  grants: GrantView[];
};
