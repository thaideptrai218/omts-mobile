/**
 * Hợp đồng dữ liệu của các API tài khoản (ACS) trong OMTS.Api, nhánh develop sau OMTS-198.
 * Tên trường theo camelCase như JSON server trả; enum đi bằng tên ("Sms", "Mobile", "Trader").
 */
export type SubjectType = "SystemAdministrator" | "CooperativeOwner" | "Staff" | "Trader";

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

export type LogoutOutcome = "online" | "expired" | "offline";
