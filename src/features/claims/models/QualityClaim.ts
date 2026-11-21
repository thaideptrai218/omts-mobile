import type { Paged } from "@/models/Pagination";

/**
 * Phương án Chủ HTX đề xuất khi chấp nhận khiếu nại (BR-CLAIM-02): trả lại toàn bộ hàng (làm ở CLAIM-03) hoặc giảm giá
 * cả hóa đơn (làm ở SALE-07). Chấp nhận chỉ ghi lại đề xuất, không đổi hóa đơn hay công nợ.
 */
export type QualityClaimOffer = "ReturnAllGoods" | "PriceCutWholeInvoice";

/** Bộ lọc trạng thái của danh sách khiếu nại (SCR-CLAIM-02). */
export type QualityClaimStatusFilter = "all" | "awaiting" | "accepted" | "rejected";

export type QualityClaimInvoiceRef = {
  id: string;
  code: string;
};

/** Hồ sơ thương lái của khiếu nại; chỉ nhân viên HTX nhận được. */
export type QualityClaimCustomer = {
  id: string;
  name: string;
  phoneNumber: string | null;
};

/** Một dòng của danh sách. `status` là tên tiếng Anh của server, không hiện: nhãn tiếng Việt lấy theo `statusId`. */
export type QualityClaimRow = {
  id: string;
  code: string;
  sentAt: string;
  statusId: number;
  status: string;
  description: string;
  photoCount: number;
  offer: QualityClaimOffer | null;
  invoice: QualityClaimInvoiceRef;
  /** Null trong danh sách của thương lái. */
  customer: QualityClaimCustomer | null;
};

/** Một trang khiếu nại; khi rỗng `messageCode` là MSG-GEN-11 (chưa có gì) hoặc MSG-GEN-10 (không có theo bộ lọc). */
export type QualityClaimsPage = Paged<QualityClaimRow> & {
  message: string | null;
  messageCode: string | null;
};

/** Ảnh riêng tư của khiếu nại (BR-CLAIM-01): link chỉ dùng được một giờ. */
export type QualityClaimPhoto = {
  sortOrder: number;
  url: string;
};

/** Phản hồi của Chủ HTX: lời nhắn không bắt buộc khi chấp nhận, là lý do khi từ chối. */
export type QualityClaimResponse = {
  note: string | null;
  respondedAt: string;
};

/** Giá và thành tiền chỉ có ở bản của nhân viên; thương lái nhận null. */
export type QualityClaimInvoiceLine = {
  productName: string;
  lotCode: string;
  kg: number;
  unitPrice: number | null;
  amount: number | null;
};

export type QualityClaimPriceCut = {
  cutDate: string;
  amount: number;
  reason: string;
};

/** Hóa đơn của khiếu nại như CLAIM-02 bước 1 hiện: dòng hàng, lô, kg, tiền, trạng thái và các lần giảm giá. */
export type QualityClaimInvoice = {
  id: string;
  code: string;
  invoiceDate: string;
  zoneId: string;
  zoneName: string;
  statusId: number;
  status: string;
  subtotal: number;
  discount: number;
  otherCharges: number;
  priceCutTotal: number;
  total: number;
  lines: QualityClaimInvoiceLine[];
  priceCuts: QualityClaimPriceCut[];
};

/** Một lần gửi phản hồi cho thương lái qua SMS hoặc Zalo OA, kèm trạng thái giao (BR-CLAIM-02). */
export type QualityClaimSending = {
  channel: string;
  phoneNumber: string | null;
  deliveryStatusId: number | null;
  deliveryStatus: string | null;
  deliveryStatusAt: string | null;
};

/** Phần chung mà nhân viên và thương lái cùng thấy. */
type QualityClaimBase = {
  id: string;
  code: string;
  sentAt: string;
  statusId: number;
  status: string;
  description: string;
  photos: QualityClaimPhoto[];
  /** Chỉ có khi đã chấp nhận. */
  offer: QualityClaimOffer | null;
  /** Null khi chưa phản hồi. */
  response: QualityClaimResponse | null;
};

/** Khiếu nại như nhân viên HTX đọc (SCR-CLAIM-02). `rowVersion` gửi lại khi phản hồi. */
export type QualityClaimView = QualityClaimBase & {
  customer: QualityClaimCustomer;
  invoice: QualityClaimInvoice;
  sendings: QualityClaimSending[];
  rowVersion: string;
  /** MSG-GEN-05 trong câu trả lời của lần phản hồi; null khi chỉ đọc. */
  message: string | null;
  messageCode: string | null;
};

/** Khiếu nại như thương lái của nó đọc: không có hồ sơ, vùng, giá, lần gửi tin hay phiên bản bản ghi. */
export type TraderQualityClaimView = QualityClaimBase & {
  invoice: QualityClaimInvoiceRef;
  invoiceDate: string;
  invoiceTotal: number;
  lines: QualityClaimInvoiceLine[];
};

/** Khiếu nại vừa gửi kèm MSG-GEN-05 (CLAIM-01 bước 5). */
export type QualityClaimSaved = {
  claim: TraderQualityClaimView;
  message: string;
  messageCode: string;
};

/** Phiếu khiếu nại đang soạn: mô tả và ảnh (1 đến 10, JPEG hoặc PNG, tối đa 10 MB mỗi ảnh). */
export type QualityClaimDraft = {
  description: string;
  photos: Blob[];
};

/** CLAIM-02.0: chọn phương án, lời nhắn không bắt buộc. */
export type AcceptQualityClaim = {
  offer: QualityClaimOffer;
  note: string | null;
  rowVersion: string;
};

/** CLAIM-02.1: lời nhắn là lý do, bắt buộc. */
export type RejectQualityClaim = {
  note: string;
  rowVersion: string;
};
