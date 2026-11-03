import type { InputItem, InputItemSearchParams, SaveInputItem } from "@/features/purchasing/models/InputItem";
import type { CancelReceiptRequest, PurchaseReceiptSearchParams, ReceiptSearch, ReceiptView, SaveReceipt } from "@/features/purchasing/models/PurchaseReceipt";
import type { RaftMaterialCost } from "@/features/purchasing/models/RaftMaterialCost";
import type { RaftLookup, ZoneLookup } from "@/features/purchasing/models/Reference";
import type { SaveSupplier, SupplierDebtRow, SupplierListItem, SupplierSearchParams, SupplierView } from "@/features/purchasing/models/Supplier";
import type { SaveSupplierPayment, SupplierPayment, SupplierPaymentSearch, SupplierPaymentSearchParams } from "@/features/purchasing/models/SupplierPayment";
import type { Paged } from "@/models/Pagination";

import { api } from "@/services/httpClient";

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

export function listSupplierDebts() {
  return api<SupplierDebtRow[]>("/api/suppliers/debts");
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

export function createReceipt(body: SaveReceipt) {
  return api<ReceiptView>("/api/purchase-receipts", { method: "POST", body });
}

export function updateReceipt(id: string, body: SaveReceipt) {
  return api<ReceiptView>(`/api/purchase-receipts/${id}`, { method: "PUT", body });
}

export function completeReceipt(id: string, rowVersion: string | null) {
  return api<ReceiptView>(`/api/purchase-receipts/${id}/complete`, { method: "POST", body: { rowVersion } });
}

export function cancelReceipt(id: string, body: CancelReceiptRequest) {
  return api<ReceiptView>(`/api/purchase-receipts/${id}/cancel`, { method: "POST", body });
}

export function listRaftMaterialCosts() {
  return api<RaftMaterialCost[]>("/api/purchase-receipts/raft-material-costs");
}

export function listSupplierPayments(filter: SupplierPaymentSearchParams) {
  return api<SupplierPaymentSearch>(
    `/api/supplier-payments${query({ supplierId: filter.supplierId, page: filter.page ?? 1, pageSize: filter.pageSize ?? 20 })}`,
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

export function lookupRafts(zoneId: string) {
  return api<RaftLookup[]>(`/api/zones/${zoneId}/rafts${query({ statusId: STATUS_IN_USE })}`);
}
