import type { InputItem, InputItemSearchParams, SaveInputItem } from "@/features/purchasing/models/InputItem";
import type {
  CancelPreview,
  CancelReceiptRequest,
  PurchaseReceiptSearchParams,
  ReceiptPayment,
  ReceiptSearch,
  ReceiptView,
  SavePurchaseReturn,
  SaveReceipt,
} from "@/features/purchasing/models/PurchaseReceipt";
import type { RaftMaterialCostResult } from "@/features/purchasing/models/RaftMaterialCost";
import type { RaftLookup, ZoneLookup } from "@/features/purchasing/models/Reference";
import type { SaveSupplier, SupplierListItem, SupplierSearchParams, SupplierView } from "@/features/purchasing/models/Supplier";
import type { SupplierDebtDetail, SupplierDebtList, SupplierDebtSearchParams, SupplierDebtStatement } from "@/features/purchasing/models/SupplierDebt";
import type { SaveSupplierPayment, SupplierPayment, SupplierPaymentSearch, SupplierPaymentSearchParams } from "@/features/purchasing/models/SupplierPayment";
import type { Paged } from "@/models/Pagination";
import type { StatementPeriod } from "@/models/Period";

import { api } from "@/services/httpClient";
import { appendPhoto } from "@/utils/imageFile";

export const STATUS_IN_USE = 101;
export const STATUS_DISCONTINUED = 102;
export const RECEIPT_DRAFT = 1701;
export const RECEIPT_COMPLETED = 1702;
export const RECEIPT_CANCELLED = 1703;

function query(params: Record<string, string | number | null | undefined>) {
  const q = Object.entries(params)
    .filter(([, v]) => v !== null && v !== undefined && v !== "")
    .map(([k, v]) => `${k}=${encodeURIComponent(String(v))}`)
    .join("&");
  return q ? `?${q}` : "";
}

export function listSuppliers(filter: SupplierSearchParams) {
  return api<Paged<SupplierListItem>>(
    `/api/suppliers${query({ search: filter.search, type: filter.type, statusId: filter.statusId, page: filter.page, pageSize: filter.pageSize ?? 50 })}`,
  );
}

export function getSupplier(id: string) {
  return api<SupplierView>(`/api/suppliers/${id}`);
}

export function createSupplier(body: SaveSupplier) {
  return api<SupplierView>("/api/suppliers", { method: "POST", body });
}

export function updateSupplier(id: string, body: SaveSupplier) {
  return api<SupplierView>(`/api/suppliers/${id}`, { method: "PUT", body });
}

export function setSupplierInUse(id: string, inUse: boolean) {
  return api<SupplierView>(`/api/suppliers/${id}/${inUse ? "reactivate" : "discontinue"}`, { method: "POST" });
}

/** Nhà cung cấp có công nợ khác 0, nợ lâu nhất trước (PURCHASE-04 bước 1). */
export function listSupplierDebts(filter: SupplierDebtSearchParams = {}) {
  return api<SupplierDebtList>(`/api/supplier-debts${query({ search: filter.search, page: filter.page ?? 1, pageSize: filter.pageSize ?? 20 })}`);
}

/** Nợ hôm nay và các phiếu nhập còn phải trả của một nhà cung cấp, cũ nhất trước. */
export function getSupplierDebt(supplierId: string) {
  return api<SupplierDebtDetail>(`/api/supplier-debts/${supplierId}`);
}

/** Sao kê theo kỳ; bỏ trống kỳ là tháng hiện tại. */
export function getSupplierStatement(supplierId: string, period: StatementPeriod = {}) {
  return api<SupplierDebtStatement>(`/api/supplier-debts/${supplierId}/statement${query({ from: period.from, to: period.to })}`);
}

export function addSupplierCertificate(id: string, photo: Blob) {
  const form = new FormData();
  appendPhoto(form, "files", photo);
  return api<SupplierView>(`/api/suppliers/${id}/certificates`, { method: "POST", form });
}

export function removeSupplierCertificate(id: string, index: number) {
  return api<SupplierView>(`/api/suppliers/${id}/certificates/${index}`, { method: "DELETE" });
}

export function listInputItems(filter: InputItemSearchParams = {}) {
  return api<InputItem[]>(`/api/farming-input-items${query({ group: filter.group, statusId: filter.statusId })}`);
}

export function createInputItem(body: SaveInputItem) {
  return api<InputItem>("/api/farming-input-items", { method: "POST", body });
}

export function updateInputItem(id: string, body: SaveInputItem) {
  return api<InputItem>(`/api/farming-input-items/${id}`, { method: "PUT", body });
}

export function setInputItemInUse(id: string, inUse: boolean) {
  return api<InputItem>(`/api/farming-input-items/${id}/${inUse ? "reactivate" : "discontinue"}`, { method: "POST" });
}

export function searchReceipts(filter: PurchaseReceiptSearchParams) {
  return api<ReceiptSearch>(
    `/api/purchase-receipts${query({ StatusId: filter.statusId, SupplierId: filter.supplierId, Page: filter.page ?? 1, PageSize: filter.pageSize ?? 20 })}`,
  );
}

export function getReceipt(id: string) {
  return api<ReceiptView>(`/api/purchase-receipts/${id}`);
}

/** Các lần trả tiền sổ công nợ tính vào phiếu này, cũ nhất trước. */
export function getReceiptPayments(id: string) {
  return api<ReceiptPayment[]>(`/api/purchase-receipts/${id}/payments`);
}

/** Công nợ trước và sau khi hủy, hoặc lý do không hủy được (PURCHASE-06 bước 2). Không thay đổi gì. */
export function previewCancelReceipt(id: string) {
  return api<CancelPreview>(`/api/purchase-receipts/${id}/cancel-preview`);
}

export function createReceipt(body: SaveReceipt) {
  return api<ReceiptView>("/api/purchase-receipts", { method: "POST", body });
}

export function updateReceipt(id: string, body: SaveReceipt) {
  return api<ReceiptView>(`/api/purchase-receipts/${id}`, { method: "PUT", body });
}

export function completeReceipt(id: string, rowVersion: string | null) {
  return api<ReceiptView>(`/api/purchase-receipts/${id}/complete`, { method: "POST", body: { rowVersion } });
}

/** Xóa phiếu nháp (PURCHASE-06.1); phiếu hoàn tất thì hủy kèm lý do. */
export function removeDraftReceipt(id: string) {
  return api<void>(`/api/purchase-receipts/${id}`, { method: "DELETE" });
}

export function cancelReceipt(id: string, body: CancelReceiptRequest) {
  return api<ReceiptView>(`/api/purchase-receipts/${id}/cancel`, { method: "POST", body });
}

export function createPurchaseReturn(id: string, body: SavePurchaseReturn) {
  return api<ReceiptView>(`/api/purchase-receipts/${id}/returns`, { method: "POST", body });
}

/** Chi phí vật tư theo bè trong kỳ, tính từ vật tư đã dùng; bỏ trống kỳ thì backend lấy kỳ mặc định. */
export function listRaftMaterialCosts(period: StatementPeriod = {}) {
  return api<RaftMaterialCostResult>(`/api/purchase-receipts/raft-material-costs${query({ From: period.from, To: period.to })}`);
}

export function listSupplierPayments(filter: SupplierPaymentSearchParams) {
  return api<SupplierPaymentSearch>(
    `/api/supplier-payments${query({ supplierId: filter.supplierId, kind: filter.kind, page: filter.page ?? 1, pageSize: filter.pageSize ?? 20 })}`,
  );
}

/** Khóa chống ghi trùng khi bấm hai lần hoặc gửi lại sau mất mạng: cùng một lần nhập dùng cùng một khóa. */
export function newDeduplicationKey() {
  return `m-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

export function recordSupplierPayment(body: SaveSupplierPayment) {
  return api<SupplierPayment>("/api/supplier-payments", { method: "POST", body });
}

export function lookupZones() {
  return api<ZoneLookup[]>("/api/zones/lookup");
}

/** Bè gắn được vào dòng hàng của phiếu nhập (`raft-lookup`): bè đang dùng mà người dùng được chọn. */
export function lookupRafts() {
  return api<RaftLookup[]>("/api/purchase-receipts/raft-lookup");
}
