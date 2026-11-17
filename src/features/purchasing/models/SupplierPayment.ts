import type { AccountRef, CashAccountRef, SupplierRef } from "@/features/purchasing/models/Reference";
import type { Paged } from "@/models/Pagination";

/** Hình thức tiền của phiếu nhập và trả hàng. Lần trả tiền nhà cung cấp chỉ nhận `Cash` hoặc `BankTransfer`. */
export type PaymentMethod = "Cash" | "BankTransfer" | "Other";

export type SupplierPaymentMethod = Extract<PaymentMethod, "Cash" | "BankTransfer">;

/** `Payment`: HTX trả nhà cung cấp, làm giảm nợ. `PaidBack`: nhà cung cấp hoàn tiền cho HTX, làm tăng nợ. */
export type SupplierPaymentKind = "Payment" | "PaidBack";

/** Phần của lần trả tiền tính vào một phiếu nhập, theo sổ công nợ hiện tại. */
export type PaymentAllocationView = {
  receiptId: string;
  receiptCode: string;
  receivedAt: string;
  receiptPayable: number;
  paidBefore: number;
  amount: number;
  receiptRemaining: number;
};

/* Trả tiền nhà cung cấp (PURCHASE-05), theo `api/supplier-payments` của backend. */
export type SupplierPayment = {
  id: string;
  code: string;
  supplier: SupplierRef;
  kind: SupplierPaymentKind;
  amount: number;
  paymentDate: string;
  method: PaymentMethod;
  bankReference: string | null;
  note: string | null;
  statusId: number;
  status: string;
  cancelledAt: string | null;
  cancelReason: string | null;
  recordedBy: AccountRef;
  rowVersion: string;
  /** Chỉ có khi vừa ghi: công nợ sau lần trả này. */
  debtAfter: number | null;
  discountAmount: number;
  purchaseReturnId: string | null;
  paidAt: string;
  paidBy: AccountRef | null;
  /** Null ở danh sách (danh sách không đọc phần tính vào phiếu). */
  allocations: PaymentAllocationView[] | null;
  cashAccount: CashAccountRef | null;
};

export type SupplierPaymentSearchParams = {
  supplierId?: string | null;
  kind?: SupplierPaymentKind | null;
  page?: number;
  pageSize?: number;
};

/** `totalPaid` chỉ cộng các lần trả (không tính giảm giá), `totalPaidBack` các lần hoàn tiền; tính trên mọi dòng khớp. */
export type SupplierPaymentSearch = {
  page: Paged<SupplierPayment>;
  totalPaid: number;
  totalPaidBack: number;
};

export type PaymentAllocationInput = {
  receiptId: string;
  amount: number;
};

/**
 * Ghi một lần trả tiền. `allocations` bỏ trống thì sổ công nợ tự tính vào các phiếu cũ nhất. Hai cờ xác nhận chỉ gửi
 * `true` sau khi người dùng đồng ý câu hỏi MSG-PURCHASE-05 (trả quá số nợ) hoặc MSG-PURCHASE-06 (trùng mã giao dịch).
 */
export type SaveSupplierPayment = {
  supplierId: string;
  kind: SupplierPaymentKind;
  paymentDate: string;
  amount: number;
  method: SupplierPaymentMethod;
  bankReference: string | null;
  note: string | null;
  allocations: PaymentAllocationInput[] | null;
  confirmAdvance: boolean;
  confirmDuplicateBankReference: boolean;
  deduplicationKey: string;
};

/** Cờ backend gửi kèm 409 để client hỏi lại rồi gửi lại cùng yêu cầu. */
export type SupplierPaymentConfirmFlag = "confirmAdvance" | "confirmDuplicateBankReference";
