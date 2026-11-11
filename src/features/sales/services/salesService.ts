import type { AcceptPurchaseRequest, MyPurchases, PurchaseDraft, PurchaseFilter, PurchaseRequest, PurchaseRequestSaved, TraderPurchaseRequest } from "@/features/sales/models/PurchaseRequest";
import type { SalesProduct, SaveSalesProduct } from "@/features/sales/models/SalesProduct";
import type { Paged } from "@/models/Pagination";
import { newOperationId } from "@/utils/operationId";

import { api } from "@/services/httpClient";

import { todayIso } from "@/utils/format";
export const listSalesProducts = (all = false) => api<SalesProduct[]>(`/api/sales-products?includeUnavailable=${all}`);
export const saveSalesProduct = (id: string | null, body: SaveSalesProduct) =>
  api<SalesProduct>(`/api/sales-products${id ? "/" + id : ""}`, { method: id ? "PUT" : "POST", body });
/** Mã trạng thái của yêu cầu mua trong danh mục trạng thái. "Đã giao đủ" không có mã riêng: là `fulfilled` của đơn Đã chấp nhận. */
export const PURCHASE_STATUS = { awaitingResponse: 3201, accepted: 3202, declined: 3203, cancelled: 3204, awaitingStaff: 3205 } as const;
/** Chủ HTX còn trả lời được (BR-SALE-02): chờ phản hồi, hoặc đang chờ nhân viên đồng ý ca. */
export const isAwaitingAnswer = (statusId: number) => statusId === PURCHASE_STATUS.awaitingResponse || statusId === PURCHASE_STATUS.awaitingStaff;

const staff = "/api/purchase-requests";
const mine = "/api/me/purchase-requests";
/** Danh sách của nhân viên: chờ phản hồi trước, rồi mới nhất trước. */
export const listPurchaseRequests = (filter: PurchaseFilter, page = 1) =>
  api<Paged<PurchaseRequest>>(`${staff}?${filter === "all" ? "" : `statusId=${PURCHASE_STATUS[filter]}&`}page=${page}&pageSize=20`);
export const getPurchaseRequest = (id: string) => api<PurchaseRequest>(`${staff}/${id}`);
/** Mua hàng của tôi (SALE-10): mới nhất trước, không lọc theo trạng thái. */
export const listMyPurchases = (page = 1) => api<MyPurchases>(`/api/me/purchases?page=${page}&pageSize=20`);
export const getMyPurchaseRequest = (id: string) => api<TraderPurchaseRequest>(`${mine}/${id}`);
/** Gửi lại cùng `clientOperationId` thì server trả yêu cầu đã lưu (`replayed`), không tạo yêu cầu thứ hai. */
export const submitPurchaseRequest = (draft: PurchaseDraft) => api<PurchaseRequestSaved>(mine, {
  method: "POST", body: { productId: draft.productId, requestedCages: Number(draft.cages.trim()), pickupDate: draft.pickupDate, note: draft.note.trim(), clientOperationId: draft.clientOperationId },
});
export const cancelPurchaseRequest = (row: TraderPurchaseRequest, reason: string) =>
  api<TraderPurchaseRequest>(`${mine}/${row.id}/cancel`, { method: "POST", body: { reason, rowVersion: row.rowVersion } });
/** Chủ HTX nhận đơn: số lồng và ngày nhận phải khớp kế hoạch nhân lực đã đủ người đồng ý. */
export const acceptPurchaseRequest = (row: PurchaseRequest, body: AcceptPurchaseRequest) =>
  api<PurchaseRequest>(`${staff}/${row.id}/accept`, { method: "POST", body: { ...body, rowVersion: row.rowVersion } });
/** Chủ HTX từ chối đơn: lý do (ghi chú) bắt buộc. */
export const declinePurchaseRequest = (row: PurchaseRequest, note: string) =>
  api<PurchaseRequest>(`${staff}/${row.id}/decline`, { method: "POST", body: { note, rowVersion: row.rowVersion } });
/** Chủ HTX đánh dấu đơn đã thu xong: không ghi thêm lô, bắt đầu cân được. */
export const markHarvestDone = (row: PurchaseRequest) =>
  api<PurchaseRequest>(`${staff}/${row.id}/harvest-done`, { method: "POST", body: { rowVersion: row.rowVersion } });
/** Bỏ đánh dấu thu xong khi đơn chưa cân lần nào. */
export const clearHarvestDone = (row: PurchaseRequest) =>
  api<PurchaseRequest>(`${staff}/${row.id}/harvest-done/clear`, { method: "POST", body: { rowVersion: row.rowVersion } });

export const newPurchaseDraft = (): PurchaseDraft => ({ productId: "", cages: "", pickupDate: todayIso(), note: "", clientOperationId: newOperationId() });
/** Số lồng là số nguyên; không dùng bộ đọc tiền hoặc làm tròn số thập phân. */
export function wholeCages(text: string): number | null {
  const value = text.trim(); const n = Number(value);
  return /^\d+$/.test(value) && Number.isSafeInteger(n) && n > 0 && n <= 2147483647 ? n : null;
}
export function pickupDateError(value: string): string {
  const parsed = new Date(`${value}T00:00:00Z`);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value) || !Number.isFinite(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== value)
    return "Vui lòng chọn ngày nhận hợp lệ.";
  return value < todayIso() ? "Ngày nhận không được trước hôm nay." : "";
}
export function validatePurchaseDraft(draft: PurchaseDraft, products: SalesProduct[]): string {
  if (!products.some(p => p.id === draft.productId && p.availableForPurchase)) return "Vui lòng chọn sản phẩm đang bán.";
  if (wholeCages(draft.cages) === null) return "Số lồng phải là số nguyên lớn hơn 0.";
  return pickupDateError(draft.pickupDate) || (draft.note.length > 500 ? "Ghi chú tối đa 500 ký tự." : "");
}
