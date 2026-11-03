import type { InputItemGroup } from "@/features/purchasing/models/InputItem";
import type { RaftRef, Ref, SupplierRef } from "@/features/purchasing/models/Reference";
import type { PaymentMethod } from "@/features/purchasing/models/SupplierPayment";
import type { Paged } from "@/models/Pagination";

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

export type ReceiptSearch = {
  page: Paged<ReceiptRow>;
  totals: ReceiptTotals;
  from: string;
  to: string;
  message: string | null;
};

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
  lines: {
    itemId: string | null;
    quantity: number | null;
    unitPrice: number | null;
    supplierLotCode?: string | null;
  }[];
  complete: boolean;
  rowVersion?: string | null;
};

export type PurchaseReceiptStatusFilter = "all" | "draft" | "completed" | "cancelled";

export type PurchaseReceiptSearchParams = {
  statusId?: number | null;
  supplierId?: string | null;
  page?: number;
  pageSize?: number;
};

export type CancelReceiptRequest = {
  reason: string;
  cancelPayments: boolean | null;
  rowVersion: string | null;
};
