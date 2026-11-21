import type { FinanceAccountRef, PaymentCustomer, RecordedPaymentMethod } from "@/features/finance/models/CustomerPayment";

/** Một hóa đơn chưa trả đủ (BR-DEBT-05): `unpaid` = `total` − `covered`, luôn lớn hơn 0. */
export type UnpaidInvoice = {
  id: string;
  code: string;
  invoiceDate: string;
  total: number;
  covered: number;
  unpaid: number;
  ageDays: number;
};

/** Tài khoản ngân hàng của sổ quỹ; `isDefault` là tài khoản nhận tiền của HTX (DEBT-01). */
export type PaymentBankAccount = {
  id: string;
  bankBin: string;
  providerName: string;
  accountNumber: string;
  holderName: string;
  isDefault: boolean;
};

/**
 * `GET api/customer-payments/form/{customerId}` (DEBT-02 bước 1, DEBT-02.3 bước 2): công nợ hôm nay, tiền HTX còn nợ lại
 * thương lái, các hóa đơn chưa trả đủ (cũ nhất trước), người có thể thu hoặc trả tiền và các tài khoản ngân hàng.
 */
export type CustomerPaymentForm = {
  customer: PaymentCustomer;
  /** Lớn hơn 0: thương lái nợ HTX; nhỏ hơn 0: HTX nợ lại thương lái (BR-DEBT-02). */
  debt: number;
  /** Tiền HTX nợ lại (số dương), là mức trả lại tối đa. */
  owedBack: number;
  debtAgeDays: number | null;
  unpaidInvoices: UnpaidInvoice[];
  cashCollectors: FinanceAccountRef[];
  bankAccounts: PaymentBankAccount[];
};

/** Các ô chung của phiếu thu và phiếu trả lại tiền, giữ dạng chữ người dùng gõ. */
export type PaymentDraft = {
  amount: string;
  method: RecordedPaymentMethod;
  bankReference: string;
  /** Rỗng: không chọn tài khoản. */
  cashAccountId: string;
  paymentDate: string;
  /** Rỗng: người đang ghi phiếu. */
  collectedById: string;
  note: string;
};

/** Trừ tiền vào hóa đơn cũ nhất trước, hay tự chọn hóa đơn và số tiền. */
export type AllocationMode = "oldest" | "pick";
