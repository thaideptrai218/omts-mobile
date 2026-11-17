import type { Paged } from "@/models/Pagination";

/** Thu tiền của thương lái hoặc trả lại tiền cho thương lái (BR-DEBT-03). */
export type CustomerPaymentKind = "Payment" | "PaidBack";

/**
 * Cách trả tiền: VietQR của hóa đơn (chỉ hệ thống ghi, GFR-08), chuyển khoản khác, tiền mặt, ví điện tử (chỉ phiếu sổ quỹ
 * tính vào công nợ tạo ra).
 */
export type CustomerPaymentMethod = "VietQrInvoice" | "OtherTransfer" | "Cash" | "EWallet";

/** Hai hình thức người dùng tự ghi được trên mobile (DEBT-02 bước 2). */
export type RecordedPaymentMethod = "Cash" | "OtherTransfer";

/** Một tài khoản được nhắc tên trong phiếu: người thu, người ghi, người xác nhận, người hủy. */
export type FinanceAccountRef = {
  id: string;
  name: string;
};

/** Hồ sơ thương lái trên các màn công nợ (SCR-DEBT-02). `code` là mã khách hàng KH000123. */
export type PaymentCustomer = {
  id: string;
  name: string;
  phoneNumber: string | null;
  code: string | null;
};

export type PaymentInvoiceRef = {
  id: string;
  code: string;
};

/** Tài khoản ngân hàng của sổ quỹ mà tiền chuyển khoản vào (hoặc trả lại từ đó). */
export type PaymentCashAccount = {
  id: string;
  providerName: string;
  accountNumber: string;
};

/** Phần tiền của phiếu trừ vào một hóa đơn. */
export type CustomerPaymentAllocation = {
  invoiceId: string;
  invoiceCode: string;
  invoicedAt: string;
  invoiceTotal: number;
  amount: number;
};

/** `GET api/customer-payments/{id}`: một phiếu thu hoặc phiếu trả lại tiền như nhân viên HTX thấy. */
export type CustomerPayment = {
  id: string;
  code: string;
  /** Null khi tiền chuyển khoản chưa gắn với hồ sơ thương lái nào (BR-DEBT-03). */
  customer: PaymentCustomer | null;
  kind: CustomerPaymentKind;
  amount: number;
  paymentDate: string;
  method: CustomerPaymentMethod;
  bankReference: string | null;
  /** Hóa đơn đi kèm tiền (tiền mặt nhận tại cảng, VietQR của hóa đơn). */
  invoice: PaymentInvoiceRef | null;
  collectedBy: FinanceAccountRef | null;
  /** Null khi hệ thống tự ghi (GFR-08). */
  recordedBy: FinanceAccountRef | null;
  note: string | null;
  statusId: number;
  status: string;
  confirmedBy: FinanceAccountRef | null;
  confirmedAt: string | null;
  cancelledBy: FinanceAccountRef | null;
  cancelledAt: string | null;
  cancelReason: string | null;
  rowVersion: string;
  /** Mã hóa đơn trong nội dung chuyển khoản không khớp hóa đơn nào đã lưu (DEBT-02.6). */
  transferInvoiceCode: string | null;
  transferredAt: string | null;
  paidAt: string;
  discountAmount: number;
  cashAccount: PaymentCashAccount | null;
  /** Rỗng khi phiếu không chỉ định hóa đơn: tiền trừ dần vào các hóa đơn cũ nhất. */
  allocations: CustomerPaymentAllocation[] | null;
};

/** Kết quả ghi, trả lại, xác nhận hoặc hủy một phiếu: phiếu, công nợ sau thao tác (null khi không có hồ sơ) và MSG-GEN-05. */
export type CustomerPaymentSaved = {
  payment: CustomerPayment;
  debtAfter: number | null;
  message: string;
  messageCode: string;
};

/** DEBT-02.2 bước 2: các khoản chờ xác nhận, cũ nhất trước. `totalAmount` là tổng của mọi khoản, không chỉ trang này. */
export type AwaitingCustomerPayments = {
  page: Paged<CustomerPayment>;
  totalAmount: number;
  message: string | null;
  messageCode: string | null;
};

export type CustomerPaymentsConfirmed = {
  confirmed: CustomerPayment[];
  cancelled: CustomerPayment[];
  message: string;
  messageCode: string;
};

export type PaymentAllocationInput = {
  invoiceId: string;
  amount: number;
};

/** Thân `POST api/customer-payments` (phiếu thu) và `POST api/customer-payments/pay-back` (trả lại tiền). */
export type RecordCustomerPayment = {
  customerId: string;
  paymentDate: string;
  amount: number;
  method: RecordedPaymentMethod;
  bankReference: string | null;
  collectedByAccountId: string | null;
  note: string | null;
  confirmAboveDebt: boolean;
  confirmDuplicateBankReference: boolean;
  deduplicationKey: string;
  discountAmount: number;
  cashAccountId: string | null;
  /** Null: không chỉ định hóa đơn, tiền trừ dần vào các hóa đơn cũ nhất. Phiếu trả lại tiền luôn null. */
  allocations: PaymentAllocationInput[] | null;
};

export type CancelCustomerPayment = {
  reason: string;
  rowVersion: string | null;
};

export type ConfirmCustomerPayments = {
  confirm: string[];
};

/** Hai câu hỏi lại của máy chủ (409 MSG-DEBT-04, MSG-DEBT-05), trả lời bằng cờ cùng tên trong request. */
export type PaymentQuestionField = "confirmAboveDebt" | "confirmDuplicateBankReference";

export type PaymentQuestionFlags = Partial<Record<PaymentQuestionField, boolean>>;

export type PaymentQuestion = {
  field: PaymentQuestionField;
  text: string;
  /** Các câu đã trả lời Có trước câu này, gửi lại cùng câu trả lời mới. */
  flags: PaymentQuestionFlags;
};

/** Dữ liệu chuyển sang trang chi tiết ngay sau khi lưu, để hiện công nợ sau khi ghi. */
export type PaymentSavedState = {
  debtAfter: number | null;
};
