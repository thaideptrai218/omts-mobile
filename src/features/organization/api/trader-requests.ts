import { api } from "@/shared/api/http";

import type { TraderRequestView } from "@/shared/api/account-contracts";

/**
 * Chủ HTX duyệt các yêu cầu tài khoản thương lái gửi từ Mini App (`api/trader-requests`). Duyệt thì tài khoản
 * dùng được ngay và thương lái nhận thông báo; từ chối phải có lý do, thương lái thấy lý do khi mở app.
 */
export function listTraderRequests(rejected = false) {
  return api<TraderRequestView[]>(`/api/trader-requests${rejected ? "?rejected=true" : ""}`);
}

export function approveTraderRequest(accountId: string) {
  return api<TraderRequestView>(`/api/trader-requests/${accountId}/approve`, { method: "POST" });
}

export function rejectTraderRequest(accountId: string, reason: string) {
  return api<TraderRequestView>(`/api/trader-requests/${accountId}/reject`, { method: "POST", body: { reason } });
}
