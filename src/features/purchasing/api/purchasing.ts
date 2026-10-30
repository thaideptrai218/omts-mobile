import type { Paged } from "@/shared/api/paged";
import { api } from "@/shared/api/http";

/**
 * Mua hàng của HTX: nhà cung cấp, danh mục vật tư, phiếu nhập, trả tiền nhà cung cấp, chi phí vật tư theo bè.
 * Hợp đồng theo OMTS.Api (`api/suppliers`, `api/farming-input-items`, `api/purchase-receipts`,
 * `api/supplier-payments`). Tiền tính bằng đồng; ngày dạng "2026-10-25".
 */


export type SupplierType = "Seed" | "Material" | "Other";
export type InputItemGroup = "Seed" | "RaftMaterial" | "Other";
export type PaymentMethod = "Cash" | "BankTransfer" | "Other";

export const STATUS_IN_USE = 101;
export const STATUS_DISCONTINUED = 102;
export const RECEIPT_DRAFT = 1701;
export const RECEIPT_COMPLETED = 1702;
export const RECEIPT_CANCELLED = 1703;

type Ref = { id: string; code: string | null; name: string | null };
export type SupplierRef = { id: string; name: string | null; phoneNumber: string | null };
export type RaftRef = { id: string; code: string | null };

/* Nhà cung cấp */

export type SupplierListItem = {
  id: string;
  name: string | null;
  supplierType: SupplierType;
  phoneNumber: string | null;
  statusId: number;
  status: string | null;
};

export type SupplierView = SupplierListItem & {
  otherContacts: string | null;
  certificates: { index: number; url: string | null }[];
  debt: number;
  receipts: { id: string; code: string | null; receiptDate: string | null; zoneId: string; status: string | null; payable: number; outstanding: number }[];
  rowVersion: string | null;
};

export type SaveSupplier = {
  name: string;
  supplierType: SupplierType;
  phoneNumber: string | null;
  otherContacts: string | null;
  rowVersion?: string | null;
};

export type SupplierDebtRow = {
  supplierId: string;
  supplierName: string | null;
  payable: number;
  returned: number;
  paid: number;
  refunded: number;
  unallocated: number;
  outstanding: number;
};

function query(params: Record<string, string | number | null | undefined>) {
  const q = Object.entries(params)
    .filter(([, v]) => v !== null && v !== undefined && v !== "")
    .map(([k, v]) => `${k}=${encodeURIComponent(String(v))}`)
    .join("&");
  return q ? `?${q}` : "";
}

export function listSuppliers(filter: { search?: string; type?: SupplierType | null; statusId?: number | null; page?: number; pageSize?: number }) {
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

/* Danh mục vật tư */

export type InputItem = {
  id: string;
  code: string | null;
  name: string | null;
  group: InputItemGroup;
  unit: string | null;
  description: string | null;
  isUsed: boolean;
  statusId: number;
  status: string | null;
  rowVersion: string | null;
};

export type SaveInputItem = {
  code: string;
  name: string;
  group: InputItemGroup;
  unit: string;
  description: string | null;
  rowVersion?: string | null;
};

export function listInputItems(filter: { group?: InputItemGroup | null; statusId?: number | null } = {}) {
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

/* Phiếu nhập */

export type ReceiptRow = {
  id: string;
  code: string | null;
  receiptDate: string | null;
  supplier: SupplierRef;
  zone: Ref;
  raft: RaftRef | null;
  statusId: number;
  status: string | null;
  subtotal: number;
  discount: number;
  payable: number;
  returned: number;
  paid: number;
  outstanding: number;
};

export type ReceiptTotals = {
  count: number;
  completedCount: number;
  subtotal: number;
  discount: number;
  payable: number;
  returned: number;
  paid: number;
  outstanding: number;
};

export type ReceiptSearch = { page: Paged<ReceiptRow>; totals: ReceiptTotals; from: string; to: string; message: string | null };

export type ReceiptLine = {
  id: string;
  itemId: string;
  itemCode: string | null;
  itemName: string | null;
  group: InputItemGroup;
  unit: string | null;
  quantity: number;
  unitPrice: number;
  lineAmount: number;
  supplierLotCode: string | null;
  actualSource: string | null;
  seedLotCode: string | null;
  returnedQuantity: number;
  returnable: number;
};

export type ReceiptPayment = {
  id: string;
  amount: number;
  paymentDate: string;
  method: PaymentMethod;
  referenceCode: string | null;
  statusId: number;
  status: string | null;
};

export type ReceiptReturn = {
  id: string;
  code: string | null;
  returnDate: string;
  reason: string | null;
  returnValue: number;
  refundAmount: number;
  debtReductionAmount: number;
};

export type ReceiptView = {
  id: string;
  code: string | null;
  supplier: SupplierRef;
  zone: Ref;
  raft: RaftRef | null;
  receiptDate: string | null;
  subtotal: number;
  discountAmount: number;
  payable: number;
  returned: number;
  paid: number;
  refunded: number;
  outstanding: number;
  amountPaidNow: number;
  paidNowMethod: PaymentMethod | null;
  notes: string | null;
  invoicePhotoUrls: string[];
  statusId: number;
  status: string | null;
  completedAt: string | null;
  cancelledAt: string | null;
  cancelReason: string | null;
  lines: ReceiptLine[];
  payments: ReceiptPayment[];
  returns: ReceiptReturn[];
  rowVersion: string | null;
};

export type SaveReceipt = {
  supplierId: string | null;
  zoneId: string | null;
  raftId: string | null;
  receiptDate: string | null;
  discountAmount: number | null;
  amountPaidNow: number | null;
  paidNowMethod: PaymentMethod | null;
  notes: string | null;
  lines: { itemId: string | null; quantity: number | null; unitPrice: number | null; supplierLotCode?: string | null }[];
  complete: boolean;
  rowVersion?: string | null;
};

export function searchReceipts(filter: { statusId?: number | null; supplierId?: string | null; page?: number; pageSize?: number }) {
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

export function cancelReceipt(id: string, body: { reason: string; cancelPayments: boolean | null; rowVersion: string | null }) {
  return api<ReceiptView>(`/api/purchase-receipts/${id}/cancel`, { method: "POST", body });
}

export type RaftMaterialCost = {
  raft: RaftRef;
  zone: Ref;
  materialCost: number;
  receipts: { receiptId: string; code: string | null; receiptDate: string; materialCost: number }[];
};

export function listRaftMaterialCosts() {
  return api<RaftMaterialCost[]>("/api/purchase-receipts/raft-material-costs");
}

/* Trả tiền nhà cung cấp */

export type SupplierPayment = {
  id: string;
  supplier: SupplierRef;
  receiptId: string | null;
  receiptCode: string | null;
  amount: number;
  paymentDate: string;
  method: PaymentMethod;
  referenceCode: string | null;
  statusId: number;
  status: string | null;
  cancelReason: string | null;
};

export function listSupplierPayments(filter: { supplierId?: string | null; page?: number; pageSize?: number }) {
  return api<{ page: Paged<SupplierPayment>; totalAmount: number }>(
    `/api/supplier-payments${query({ supplierId: filter.supplierId, page: filter.page ?? 1, pageSize: filter.pageSize ?? 20 })}`,
  );
}

/** Khóa chống ghi trùng khi bấm hai lần hoặc gửi lại sau mất mạng: cùng một lần nhập dùng cùng một khóa. */
export function newDeduplicationKey() {
  return `m-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

export function recordSupplierPayment(body: {
  supplierId: string;
  receiptId: string | null;
  amount: number;
  paymentDate: string;
  method: PaymentMethod;
  referenceCode: string | null;
  deduplicationKey: string;
}) {
  return api<SupplierPayment>("/api/supplier-payments", { method: "POST", body });
}

/* Danh mục để chọn trong form phiếu nhập */

export type ZoneLookup = { id: string; code: string | null; name: string | null; statusId: number };
export type RaftLookup = { id: string; code: string | null; statusId: number };

export function lookupZones() {
  return api<ZoneLookup[]>("/api/zones/lookup");
}

export function lookupRafts(zoneId: string) {
  return api<RaftLookup[]>(`/api/zones/${zoneId}/rafts${query({ statusId: STATUS_IN_USE })}`);
}
