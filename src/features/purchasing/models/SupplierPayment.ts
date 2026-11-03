import type { SupplierRef } from "@/features/purchasing/models/Reference";
import type { Paged } from "@/models/Pagination";

export type PaymentMethod = "Cash" | "BankTransfer" | "Other";

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

export type SupplierPaymentSearchParams = {
  supplierId?: string | null;
  page?: number;
  pageSize?: number;
};

export type SupplierPaymentSearch = {
  page: Paged<SupplierPayment>;
  totalAmount: number;
};

export type SaveSupplierPayment = {
  supplierId: string;
  receiptId: string | null;
  amount: number;
  paymentDate: string;
  method: PaymentMethod;
  referenceCode: string | null;
  deduplicationKey: string;
};
