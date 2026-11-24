import type { OriginState } from "@/models/OriginState";
import type { Paged } from "@/models/Pagination";

export type SalesPaymentTerm = "PayNow" | "PayLater";

export type SalesInvoiceLine = {
  id: string;
  lineNumber: number;
  productId: string;
  productName: string;
  harvestLotId: string;
  lotCode: string;
  kg: number;
  unitPrice: number;
  listPrice: number;
  amount: number;
  soldWholeLot: boolean;
};

export type SalesInvoicePayment = {
  id: string;
  code: string;
  amount: number;
  paymentDate: string;
  status: string;
};

export type SalesInvoiceDebtEffect = {
  isPaid: boolean | null;
  covered: number;
  unpaid: number;
};

export type SalesInvoice = {
  id: string;
  code: string;
  invoicedAt: string;
  invoiceDate: string;
  zone: { id: string; code: string; name: string };
  customer: { id: string; name: string; phoneNumber: string | null } | null;
  walkInCustomer: boolean;
  purchaseRequestId: string | null;
  lines: SalesInvoiceLine[];
  totalKg: number;
  subtotal: number;
  total: number;
  paymentTerm: SalesPaymentTerm;
  statusId: number;
  status: string;
  payments: SalesInvoicePayment[];
  qrToken: string | null;
  qrUrl: string | null;
  /** Lúc trả lời câu hỏi tạo mã QR khi kết thúc bán; null là chưa kết thúc. */
  qrDecidedAt: string | null;
  deliveryStatus: string;
  debtEffect: SalesInvoiceDebtEffect;
  rowVersion: string;
};

/** Kết quả công bố nguồn gốc của một lô khi kết thúc bán. */
export type InvoiceLotOrigin = {
  harvestLotId: string;
  lotCode: string;
  originState: OriginState;
  message: string | null;
  messageCode: string | null;
};

export type SalesInvoiceSent = {
  invoice: SalesInvoice;
  deliveryStatus: string;
  qrUrl: string | null;
  lots: InvoiceLotOrigin[];
  message: string | null;
  messageCode: string | null;
};

export type InvoicePublishCheck = {
  invoiceId: string;
  invoiceCode: string;
  lots: InvoiceLotOrigin[];
  getsQrCode: boolean;
};

export type FinishSalesInvoice = {
  wantsQrCode: boolean;
};

export type MyInvoiceRow = {
  id: string;
  code: string;
  invoicedAt: string;
  invoiceDate: string;
  zoneName: string;
  purchaseRequestCode: string | null;
  totalKg: number;
  total: number;
  statusId: number;
  status: string;
  paymentTerm: SalesPaymentTerm;
  isPaid: boolean | null;
  unpaidAmount: number;
};

export type MyInvoiceList = {
  page: Paged<MyInvoiceRow>;
  message: string | null;
  messageCode: string | null;
};

export type MyInvoiceLine = {
  lineNumber: number;
  productName: string;
  lotCode: string;
  kg: number;
  unitPrice: number;
  amount: number;
};

export type MyInvoice = {
  id: string;
  code: string;
  invoicedAt: string;
  invoiceDate: string;
  zoneName: string;
  purchaseRequestCode: string | null;
  lines: MyInvoiceLine[];
  totalKg: number;
  total: number;
  paymentTerm: SalesPaymentTerm;
  status: string;
  isPaid: boolean | null;
  covered: number;
  unpaidAmount: number;
  qrUrl: string | null;
};
