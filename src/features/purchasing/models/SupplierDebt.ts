import type { PaymentMethod } from "@/features/purchasing/models/SupplierPayment";
import type { Paged } from "@/models/Pagination";

/* Công nợ nhà cung cấp (PURCHASE-04, PURCHASE-05 bước 1), theo `api/supplier-debts` của backend. */

/** Nhà cung cấp trên các màn công nợ, kể cả nhà đã ngừng dùng (GBR-01). */
export type SupplierDebtSupplier = {
  id: string;
  name: string;
  phoneNumber: string;
  statusId: number;
  status: string;
};

/** Một dòng danh sách: `debt` dương là HTX còn nợ, âm là HTX đã trả trước. */
export type SupplierDebtRow = {
  supplier: SupplierDebtSupplier;
  debt: number;
  /** Số ngày từ phiếu chưa trả cũ nhất; null khi không còn nợ. */
  debtAgeDays: number | null;
  oldestUnpaidDate: string | null;
};

/** Danh sách nhà cung cấp có công nợ khác 0; tổng tính trên mọi dòng khớp, không chỉ trang này. */
export type SupplierDebtList = {
  page: Paged<SupplierDebtRow>;
  totalOwed: number;
  totalAdvance: number;
  /** MSG-GEN-10 khi không có nhà cung cấp nào. */
  message: string | null;
  messageCode: string | null;
};

export type SupplierDebtSearchParams = {
  search?: string | null;
  page?: number;
  pageSize?: number;
};

/** Phiếu nhập còn phải trả, cũ nhất trước. `remaining` = tổng − giảm giá − trả hàng − đã trả. */
export type UnpaidReceipt = {
  id: string;
  code: string;
  receiptDate: string;
  total: number;
  returned: number;
  covered: number;
  remaining: number;
  ageDays: number;
  discount: number;
  receivedAt: string;
};

export type SupplierDebtDetail = {
  supplier: SupplierDebtSupplier;
  debtToday: number;
  debtAgeDays: number | null;
  oldestUnpaidDate: string | null;
  unpaidReceipts: UnpaidReceipt[];
};

export type SupplierStatementEntryKind = "Receipt" | "Return" | "Payment" | "PaidBack";

/** Một dòng sao kê: `amount` dương làm tăng nợ, âm làm giảm; `debtAfter` là dư nợ sau dòng này. */
export type SupplierStatementEntry = {
  date: string;
  kind: SupplierStatementEntryKind;
  id: string;
  code: string;
  /** Phiếu nhập của một lần trả hàng; null với trả hàng không theo phiếu. */
  receiptCode: string | null;
  method: PaymentMethod | null;
  bankReference: string | null;
  note: string | null;
  amount: number;
  debtAfter: number;
};

/** Sao kê theo kỳ (PURCHASE-04 bước 3): nợ đầu kỳ, các dòng theo ngày, nợ cuối kỳ. */
export type SupplierDebtStatement = {
  supplier: SupplierDebtSupplier;
  from: string;
  to: string;
  openingDebt: number;
  entries: SupplierStatementEntry[];
  closingDebt: number;
  debtToday: number;
  debtAgeDays: number | null;
};
