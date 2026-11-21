import type { AuthTokens } from "@/features/auth/models/Session";

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

/** Bước của màn: bấm liên kết; số chưa có tài khoản thì gửi yêu cầu; yêu cầu đang chờ hoặc bị từ chối. */
export type LinkAccountStep = {
  kind: "link";
} | {
  kind: "request";
  maskedPhone: string;
} | {
  kind: "pending";
  name: string;
} | {
  kind: "rejected";
  reason: string | null;
};

/**
 * `state` của đường dẫn `/link`. `redirected` khi SessionGuard tự đẩy sang (mở màn bảo vệ lúc chưa có phiên, phiên hết hạn):
 * trang phía sau trong lịch sử khi đó là màn bảo vệ, nên nút "Quay lại" không được lùi về đó.
 */
export type LinkRouteState = {
  redirected: true;
};

export type TraderAccessRequest = {
  displayName: string;
  note: string;
};
