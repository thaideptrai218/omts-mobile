import type { Paged } from "@/models/Pagination";

/**
 * Công nợ thương lái (DEBT-03) và điều chỉnh công nợ bằng tay. Hợp đồng theo OMTS.Api `api/customer-debts`.
 * Nợ lớn hơn 0 là thương lái còn nợ HTX; nhỏ hơn 0 là HTX còn nợ lại thương lái (BR-DEBT-02).
 */
export type DebtCustomer = {
  id: string;
  name: string;
  phoneNumber: string | null;
  code: string | null;
};

/** Người ghi, người thu, người xác nhận. */
export type PersonRef = {
  id: string;
  name: string;
};

export type CustomerDebtRow = {
  customer: DebtCustomer;
  debt: number;
  /** Số ngày tính từ hóa đơn chưa trả cũ nhất; null khi không còn nợ (BR-DEBT-05). */
  debtAgeDays: number | null;
  oldestUnpaidDate: string | null;
};

/** `GET api/customer-debts`: các hồ sơ có nợ khác 0 và tổng của cả HTX. */
export type CustomerDebtList = {
  page: Paged<CustomerDebtRow>;
  receivablesTotal: number;
  owedBackTotal: number;
  awaitingConfirmationCount: number;
  message: string | null;
  messageCode: string | null;
};

export type CustomerDebtSearchParams = {
  search?: string;
  page?: number;
  pageSize?: number;
};

export type StatementEntryKind = "Invoice" | "PriceCut" | "Return" | "Payment" | "Discount" | "PaidBack" | "Adjustment";

export type CustomerPaymentMethod = "VietQrInvoice" | "OtherTransfer" | "Cash" | "EWallet";

/** Một dòng phát sinh của sao kê, kèm dư nợ sau dòng đó. */
export type StatementEntry = {
  date: string;
  kind: StatementEntryKind;
  /** Mã của hóa đơn, phiếu thu, điều chỉnh...; dòng tiền và dòng chiết khấu của cùng một phiếu thu có cùng id. */
  id: string;
  code: string;
  /** Số tiền như đã ghi, luôn lớn hơn 0. */
  amount: number;
  /** Phần làm đổi dư nợ: lớn hơn 0 là tăng nợ, nhỏ hơn 0 là giảm, 0 khi đã hủy hoặc đang chờ chuyển khoản. */
  debtChange: number;
  invoiceCode: string | null;
  method: CustomerPaymentMethod | null;
  awaitingConfirmation: boolean;
  cancelled: boolean;
  debtAfter: number;
  cancelledAt: string | null;
  recordedBy: PersonRef | null;
  confirmedBy: PersonRef | null;
  collectedBy: PersonRef | null;
  /** Ghi chú của phiếu thu, hoặc lý do của điều chỉnh, giảm giá. */
  note: string | null;
  cancelReason: string | null;
  at: string | null;
  /** Phiếu thu đang chờ tiền chuyển khoản về: chưa làm đổi dư nợ. */
  pending: boolean;
};

export type UnpaidInvoice = {
  id: string;
  code: string;
  invoiceDate: string;
  total: number;
  covered: number;
  unpaid: number;
  ageDays: number;
};

/** `GET api/customer-debts/{customerId}/statement`: đầu kỳ, phát sinh theo ngày, cuối kỳ và các hóa đơn còn nợ hôm nay. */
export type CustomerDebtStatement = {
  customer: DebtCustomer;
  from: string;
  to: string;
  openingDebt: number;
  entries: StatementEntry[];
  closingDebt: number;
  debtToday: number;
  debtAgeDays: number | null;
  unpaidInvoices: UnpaidInvoice[];
};


/* Điều chỉnh công nợ bằng tay */
export type AdjustmentDirection = "increase" | "decrease";

/** Số tiền có dấu: lớn hơn 0 là thương lái nợ thêm, nhỏ hơn 0 là bớt nợ; không được bằng 0. */
export type RecordDebtAdjustment = {
  customerId: string;
  amount: number;
  reason: string;
  occurredAt?: string | null;
};

export type CancelDebtAdjustment = {
  reason: string;
  rowVersion?: string | null;
};

export type DebtAdjustmentView = {
  id: string;
  code: string;
  customer: DebtCustomer;
  amount: number;
  occurredAt: string;
  adjustmentDate: string;
  reason: string;
  recordedBy: PersonRef | null;
  cancelled: boolean;
  cancelledAt: string | null;
  cancelReason: string | null;
  rowVersion: string;
};

export type DebtAdjustmentSaved = {
  adjustment: DebtAdjustmentView;
  debtAfter: number;
  message: string;
  messageCode: string;
};
