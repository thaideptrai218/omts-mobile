import type { PurchaseDraft, PurchaseFilter, PurchaseRequest, RespondPurchaseRequest } from "@/features/sales/models/PurchaseRequest";
import type { SalesProduct, SaveSalesProduct } from "@/features/sales/models/SalesProduct";
import type { Paged } from "@/models/Pagination";
import { newOperationId } from "@/utils/operationId";

import { api } from "@/services/httpClient";

import { todayIso } from "@/utils/format";
export const listSalesProducts = (all = false) => api<SalesProduct[]>(`/api/sales-products?includeUnavailable=${all}`);
export const saveSalesProduct = (id: string | null, body: SaveSalesProduct) =>
  api<SalesProduct>(`/api/sales-products${id ? "/" + id : ""}`, { method: id ? "PUT" : "POST", body });
const root = (mine: boolean) => mine ? "/api/me/purchase-requests" : "/api/purchase-requests";
export const listPurchaseRequests = (mine: boolean, status: PurchaseFilter, page = 1) =>
  api<Paged<PurchaseRequest>>(`${root(mine)}?status=${status}&page=${page}&pageSize=20`);
export const getPurchaseRequest = (mine: boolean, id: string) => api<PurchaseRequest>(`${root(mine)}/${id}`);
export const submitPurchaseRequest = (draft: PurchaseDraft) => api<PurchaseRequest>(root(true), {
  method: "POST", body: { productId: draft.productId, requestedCages: Number(draft.cages.trim()), pickupDate: draft.pickupDate, note: draft.note.trim(), clientOperationId: draft.clientOperationId },
});
export const cancelPurchaseRequest = (row: PurchaseRequest, reason: string) => api<PurchaseRequest>(`${root(true)}/${row.id}/cancel`, { method: "POST", body: { reason, rowVersion: row.rowVersion } });
export const respondPurchaseRequest = (row: PurchaseRequest, body: RespondPurchaseRequest) =>
  api<PurchaseRequest>(`${root(false)}/${row.id}/response`, { method: "POST", body: { ...body, rowVersion: row.rowVersion } });

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
