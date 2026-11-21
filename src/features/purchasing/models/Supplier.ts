/**
 * Mua hàng của HTX: nhà cung cấp, danh mục vật tư, phiếu nhập, trả tiền nhà cung cấp, chi phí vật tư theo bè.
 * Hợp đồng theo OMTS.Api (`api/suppliers`, `api/farming-input-items`, `api/purchase-receipts`,
 * `api/supplier-payments`). Tiền tính bằng đồng; ngày dạng "2026-10-25".
 */
export type SupplierType = "Seed" | "Material" | "Other";

/* Nhà cung cấp */
export type SupplierListItem = {
  id: string;
  code: string;
  name: string;
  supplierType: SupplierType;
  phoneNumber: string;
  statusId: number;
  status: string;
  email: string | null;
  address: string | null;
  province: string | null;
  ward: string | null;
  companyName: string | null;
  taxCode: string | null;
  note: string | null;
  createdAt: string;
  createdBy: string | null;
  /** Null khi người xem không có quyền xem phiếu nhập. */
  totalPurchased: number | null;
  /** Null khi người xem không có quyền xem công nợ nhà cung cấp (BR-FARM-07). */
  currentDebt: number | null;
};

/** Một phiếu nhập gần đây của nhà cung cấp (mọi trạng thái), với tổng tiền. Công nợ đọc ở `api/supplier-debts`. */
export type SupplierReceiptRow = {
  id: string;
  code: string;
  receiptDate: string;
  statusId: number;
  status: string;
  total: number;
};

export type SupplierView = {
  id: string;
  code: string;
  name: string;
  supplierType: SupplierType;
  phoneNumber: string;
  address: string | null;
  email: string | null;
  certificates: {
    index: number;
    url: string | null;
  }[];
  statusId: number;
  status: string;
  receipts: SupplierReceiptRow[];
  rowVersion: string;
  province: string | null;
  ward: string | null;
  note: string | null;
  companyName: string | null;
  taxCode: string | null;
  /** CCCD: chỉ có ở màn chi tiết. */
  identityNumber: string | null;
  createdAt: string;
  createdBy: string | null;
};

/**
 * Thêm hoặc sửa nhà cung cấp. Địa chỉ và email gửi gì lưu nấy (gửi lại giá trị cũ để giữ). Các trường không có trên
 * mobile (tỉnh, phường, tên công ty, mã số thuế, CCCD, mã) không gửi thì backend giữ nguyên khi sửa.
 */
export type SaveSupplier = {
  name: string;
  supplierType: SupplierType;
  phoneNumber: string;
  address: string | null;
  email: string | null;
  note?: string | null;
  rowVersion?: string | null;
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
