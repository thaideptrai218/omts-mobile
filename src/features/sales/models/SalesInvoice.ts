import type { OriginState } from "@/models/OriginState";
import type { Paged } from "@/models/Pagination";

/** Phần tiền mặt không trả hết thì trả thế nào: không còn gì, hoặc ghi công nợ. */
export type InvoiceRestPayment = "None" | "PayLater";

export type SalesPaymentTerm = "PayNow" | "PayLater";

export type SalesInvoiceLineEntry = {
  productId: string;
  harvestLotId: string;
  /** Hóa đơn lập từ lần cân lấy kg của lần cân nên để null. */
  kg: number | null;
};

export type SalesInvoicePaymentEntry = {
  cashAmount: number;
  rest: InvoiceRestPayment;
  /** Trả lời câu hỏi MSG-SALE-11 (tiền thừa trừ vào công nợ); null là chưa hỏi. */
  subtractExtraFromDebt: boolean | null;
  /** Trả lời "có" cho MSG-SALE-12: Chủ HTX đã đồng ý cho ghi nợ. */
  payLaterOwnerAgreed: boolean;
};

export type CreateSalesInvoice = {
  customerId: string;
  walkInCustomer: boolean;
  zoneId: string | null;
  lines: SalesInvoiceLineEntry[];
  payment: SalesInvoicePaymentEntry;
  purchaseRequestId: string;
  takesRequestInFull: boolean;
  notSoldWholeLotIds: string[];
  deduplicationKey: string;
  portWeighingId: string;
};

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
  cageKgs: number[];
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
  portWeighingId: string | null;
  rowVersion: string;
};

export type SalesInvoiceSaved = {
  invoice: SalesInvoice;
  change: number;
  subtractedFromDebt: number;
  message: string;
  messageCode: string;
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

/** Giá bán theo bảng giá của HTX, quản lý vùng và Chủ HTX đọc được. */
export type ProductPrice = {
  id: string;
  name: string;
  unitPrice: number | null;
};

export type MyInvoiceRow = {
  id: string;
  code: string;
  invoicedAt: string;
  invoiceDate: string;
  zoneName: string;
  purchaseRequestCode: string | null;
  cageCount: number;
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
  cageKgs: number[];
};

export type MyInvoice = {
  id: string;
  code: string;
  invoicedAt: string;
  invoiceDate: string;
  zoneName: string;
  purchaseRequestCode: string | null;
  lines: MyInvoiceLine[];
  cageCount: number;
  totalKg: number;
  total: number;
  paymentTerm: SalesPaymentTerm;
  status: string;
  isPaid: boolean | null;
  covered: number;
  unpaidAmount: number;
  qrUrl: string | null;
};
