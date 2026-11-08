/**
 * Mua hàng của HTX: nhà cung cấp, danh mục vật tư, phiếu nhập, trả tiền nhà cung cấp, chi phí vật tư theo bè.
 * Hợp đồng theo OMTS.Api (`api/suppliers`, `api/farming-input-items`, `api/purchase-receipts`,
 * `api/supplier-payments`). Tiền tính bằng đồng; ngày dạng "2026-10-25".
 */
export type SupplierType = "Seed" | "Material" | "Other";

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
  certificates: {
    index: number;
    url: string | null;
  }[];
  debt: number;
  receipts: {
    id: string;
    code: string | null;
    receiptDate: string | null;
    zoneId: string;
    status: string | null;
    payable: number;
    outstanding: number;
  }[];
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

export type SupplierTypeFilter = "all" | SupplierType;

export type SupplierStatusFilter = "inUse" | "discontinued";

export type SupplierSearchParams = {
  search?: string;
  type?: SupplierType | null;
  statusId?: number | null;
  page?: number;
  pageSize?: number;
};
