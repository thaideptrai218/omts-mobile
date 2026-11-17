import type {
  CancelInputIssue,
  CompleteInputIssue,
  InputIssuePage,
  InputIssueReceiver,
  InputIssueSearchParams,
  InputIssueType,
  InputIssueView,
  InputSeedLots,
  SaveInputIssue,
} from "@/features/purchasing/models/InputIssue";

import { api } from "@/services/httpClient";

/** Trạng thái phiếu xuất (`StatusIds.InputIssue` của backend). */
export const ISSUE_DRAFT = 3901;
export const ISSUE_COMPLETED = 3902;
export const ISSUE_CANCELLED = 3903;

function query(params: Record<string, string | number | null | undefined>) {
  const q = Object.entries(params)
    .filter(([, v]) => v !== null && v !== undefined && v !== "")
    .map(([k, v]) => `${k}=${encodeURIComponent(String(v))}`)
    .join("&");
  return q ? `?${q}` : "";
}

/** Phiếu người dùng được xem, mới nhất trước; Quản lý vùng chỉ thấy phiếu xuất dùng của vùng mình. */
export function searchIssues(filter: InputIssueSearchParams) {
  return api<InputIssuePage>(
    `/api/input-issues${query({
      kind: filter.kind,
      search: filter.search,
      status: filter.status,
      from: filter.from,
      to: filter.to,
      page: filter.page,
      pageSize: filter.pageSize,
    })}`,
  );
}

export function getIssue(id: string) {
  return api<InputIssueView>(`/api/input-issues/${id}`);
}

/** Lập phiếu; có `complete` thì hoàn thành luôn, thiếu hàng thì 409 MSG-INPUT-01 và không lưu gì. */
export function createIssue(body: SaveInputIssue) {
  return api<InputIssueView>("/api/input-issues", { method: "POST", body });
}

export function completeIssue(id: string, body: CompleteInputIssue) {
  return api<InputIssueView>(`/api/input-issues/${id}/complete`, { method: "POST", body });
}

/** Hủy phiếu đã hoàn thành: số lượng đã xuất được cộng lại vào kho. */
export function cancelIssue(id: string, body: CancelInputIssue) {
  return api<InputIssueView>(`/api/input-issues/${id}/cancel`, { method: "POST", body });
}

/** Xóa phiếu tạm (phiếu tạm chưa trừ kho). */
export function removeDraftIssue(id: string) {
  return api<void>(`/api/input-issues/${id}`, { method: "DELETE" });
}

export function listIssueTypes() {
  return api<InputIssueType[]>("/api/input-issue-types");
}

/** Nhân viên làm ở vùng, để chọn người nhận vật tư. */
export function listIssueReceivers(zoneId: string) {
  return api<InputIssueReceiver[]>(`/api/input-issues/receivers${query({ zoneId })}`);
}

/** Các lô giống còn của một vật tư giống, cũ nhất trước, kèm lô nên lấy mặc định. */
export function getSeedLots(itemId: string) {
  return api<InputSeedLots>(`/api/farming-input-items/${itemId}/seed-lots`);
}
