import type { Paged } from "@/models/Pagination";

/**
 * Hồ sơ khách hàng (thương lái) của HTX, SALE-04. Hợp đồng theo OMTS.Api `api/customers`, `api/customer-settings`
 * và `api/banks`. Tiền tính bằng đồng; ngày dạng "2026-10-25"; thời điểm là ISO có múi giờ.
 */
export type CustomerType = "Individual" | "Company";

export type Gender = "Male" | "Female" | "Other";

/** Lọc trạng thái của danh sách; mặc định Đang dùng (đúng như các ô chọn khách hàng). */
export type CustomerStatusFilter = "InUse" | "Discontinued" | "All";

/** Ô "Lọc thêm" của danh sách: theo loại khách hàng, hoặc chỉ khách vượt hạn mức nợ. */
export type CustomerExtraFilter = "all" | CustomerType | "overDebtLimit";

/** Một dòng của `GET api/customers`. Số nợ và doanh số là null khi người xem không có quyền CUSTOMER_DEBTS View. */
export type CustomerListItem = {
  id: string;
  code: string;
  name: string;
  phoneNumber: string | null;
  address: string | null;
  hasTraderAccount: boolean;
  rowVersion: string;
  statusId: number;
  status: string;
  customerType: CustomerType;
  gender: Gender | null;
  birthDate: string | null;
  phoneNumber2: string | null;
  email: string | null;
  facebook: string | null;
  province: string | null;
  ward: string | null;
  companyName: string | null;
  taxCode: string | null;
  note: string | null;
  photoUrl: string | null;
  lastTransactionAt: string | null;
  createdAt: string;
  createdBy: string | null;
  /** Lớn hơn 0 là khách còn nợ; nhỏ hơn 0 là HTX còn nợ lại khách. */
  currentDebt: number | null;
  totalSales: number | null;
  netSales: number | null;
  /** Cảnh báo nợ đang bật và khách vượt hạn mức tiền hoặc số ngày nợ. */
  overDebtLimit: boolean;
  overDebtAmount: boolean;
  overDebtDays: boolean;
  debtDays: number | null;
};

export type CustomerListSummary = {
  debt: number;
  totalSales: number;
  netSales: number;
};

export type CustomerListPage = Paged<CustomerListItem> & {
  summary: CustomerListSummary | null;
};

export type CustomerSearchParams = {
  search?: string;
  status?: CustomerStatusFilter;
  type?: CustomerType | null;
  overDebtLimit?: boolean;
  page?: number;
  pageSize?: number;
};

export type LinkedTraderAccount = {
  accountId: string;
  username: string | null;
  displayName: string;
};

/** `GET api/customers/{id}`: hồ sơ đầy đủ, kể cả số CCCD (chỉ có ở màn chi tiết) và số nợ hiện tại. */
export type CustomerView = {
  id: string;
  name: string;
  phoneNumber: string | null;
  email: string | null;
  address: string | null;
  note: string | null;
  /** Hồ sơ gắn tài khoản thương lái: số điện thoại theo tài khoản, nhân viên không đổi được (BR-SALE-04). */
  phoneLocked: boolean;
  traderAccount: LinkedTraderAccount | null;
  /** Có giá trị khi hồ sơ đã được gộp vào hồ sơ khác: chỉ xem, không sửa. */
  mergedIntoCustomerId: string | null;
  currentDebt: number;
  rowVersion: string;
  code: string;
  statusId: number;
  status: string;
  customerType: CustomerType;
  gender: Gender | null;
  birthDate: string | null;
  phoneNumber2: string | null;
  facebook: string | null;
  province: string | null;
  ward: string | null;
  companyName: string | null;
  taxCode: string | null;
  identityNumber: string | null;
  bankBin: string | null;
  bankName: string | null;
  bankAccountNumber: string | null;
  photoUrl: string | null;
  createdAt: string;
  createdBy: string | null;
  /** Đã có hóa đơn, phiếu thu, điều chỉnh, yêu cầu mua hoặc tài khoản: chỉ ngừng dùng được, không xóa. */
  isUsed: boolean;
};

/**
 * Thân `POST api/customers` và `PUT api/customers/{id}`. Lưu là thay toàn bộ hồ sơ: trường để trống bị xóa, nên form
 * luôn gửi đủ mọi trường. Mã để trống thì hệ thống tự đặt (thêm mới) hoặc giữ mã cũ (sửa).
 */
export type SaveCustomer = {
  name: string;
  phoneNumber: string | null;
  address: string | null;
  note: string | null;
  rowVersion?: string | null;
  code: string | null;
  customerType: CustomerType;
  gender: Gender | null;
  birthDate: string | null;
  phoneNumber2: string | null;
  email: string | null;
  facebook: string | null;
  province: string | null;
  ward: string | null;
  companyName: string | null;
  taxCode: string | null;
  identityNumber: string | null;
  bankBin: string | null;
  bankAccountNumber: string | null;
};

/** Trả về khi lưu hồ sơ (MSG-GEN-05). */
export type CustomerSaved = {
  customer: CustomerView;
  message: string;
  messageCode: string;
};

/** Các trường HTX bắt buộc thêm (tên và số điện thoại đầu luôn bắt buộc). `address` bắt cả địa chỉ, tỉnh và phường/xã. */
export type CustomerRequiredFields = {
  phoneNumber2: boolean;
  email: boolean;
  gender: boolean;
  birthDate: boolean;
  address: boolean;
  facebook: boolean;
  bank: boolean;
  taxCode: boolean;
};

/** `GET api/customer-settings`. */
export type CustomerSettings = {
  debtWarningEnabled: boolean;
  maxDebtAmount: number | null;
  maxDebtDays: number | null;
  allowMoreDebtOverLimit: boolean;
  noDebtForWalkIn: boolean;
  requiredFields: CustomerRequiredFields;
  rowVersion: string;
};

/** Một ngân hàng của `GET api/banks` (API này chỉ mở cho Chủ HTX). */
export type Bank = {
  bin: string;
  shortName: string;
  name: string;
};

/** Dữ liệu đang gõ của form hồ sơ: ô nhập giữ chuỗi, chưa chọn là chuỗi rỗng. */
export type CustomerDraft = {
  name: string;
  phoneNumber: string;
  code: string;
  customerType: CustomerType;
  gender: Gender | "";
  birthDate: string;
  phoneNumber2: string;
  email: string;
  facebook: string;
  address: string;
  province: string;
  ward: string;
  companyName: string;
  taxCode: string;
  identityNumber: string;
  bankBin: string;
  bankAccountNumber: string;
  note: string;
};

/** Những gì form tải trước khi mở: hồ sơ (khi sửa), cài đặt trường bắt buộc, danh sách ngân hàng (null khi không đọc được). */
export type CustomerFormData = {
  customer: CustomerView | null;
  settings: CustomerSettings;
  banks: Bank[] | null;
};

/* Gộp hồ sơ trùng (SALE-04.3) */
export type CustomerMergeParty = {
  id: string;
  name: string;
  phoneNumber: string | null;
  currentDebt: number;
  hasTraderAccount: boolean;
  rowVersion: string;
  code: string | null;
};

/** Số bản ghi của hồ sơ bị gộp sẽ chuyển sang hồ sơ giữ lại; `name` là tên tiếng Anh của backend. */
export type CustomerReferenceCount = {
  name: string;
  count: number;
};

/** `GET api/customers/{id}/merge-preview`: hai hồ sơ, số bản ghi chuyển sang, có cần xác nhận Chủ HTX đã đồng ý không. */
export type CustomerMergePreview = {
  kept: CustomerMergeParty;
  merged: CustomerMergeParty;
  countedWithKept: CustomerReferenceCount[];
  requiresOwnerApproval: boolean;
  confirmation: string | null;
  locksMergedAccount: boolean;
};

export type MergeCustomer = {
  mergedCustomerId: string;
  keptRowVersion: string;
  mergedRowVersion: string;
  ownerApproved: boolean;
};
