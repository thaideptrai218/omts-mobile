import type { OriginState } from "@/models/OriginState";

/* Truy vết lô hàu (TRACE-02), công bố (TRACE-01.2) và thu hồi (TRACE-04) thông tin nguồn gốc, theo `api/harvest-lots` của backend. */

export type LotTraceSearchParams = {
  lotCode?: string | null;
  invoiceCode?: string | null;
};

/** Một lô tìm được, trong vùng người dùng được truy vết. */
export type LotTraceSearchItem = {
  id: string;
  lotCode: string;
  harvestedAt: string;
  harvestDate: string;
  raftId: string;
  raftCode: string;
  zoneId: string;
  zoneCode: string;
  statusId: number;
  status: string;
  originState: OriginState;
};

/** Thu hoạch mới nhất trước, tối đa 50. `message` là MSG-GEN-10 khi không có lô nào. */
export type LotTraceSearchResult = {
  lots: LotTraceSearchItem[];
  message: string | null;
  messageCode: string | null;
};

/** Một lần sửa dữ liệu truy xuất (TRACE-03) trên bản ghi: ngày, người sửa, lý do. */
export type TraceCorrectionMark = {
  correctedAt: string;
  actorAccountId: string | null;
  actorName: string | null;
  reason: string | null;
};

export type TraceSeedLot = {
  id: string;
  code: string;
  receiptId: string;
  receiptCode: string;
  receivedDate: string;
  itemId: string | null;
  itemCode: string | null;
  itemName: string | null;
  unit: string;
  supplierId: string;
  supplierName: string;
};

/** Một phiên thả giống trên luống, với lô giống, phiếu nhập và nhà cung cấp. */
export type TraceSeeding = {
  seedingRecordId: string;
  seedingDate: string;
  quantity: number;
  seedLot: TraceSeedLot;
  receiptStatusId: number;
  receiptStatus: string;
  /** Lô giống nằm trên phiếu nhập đã hoàn tất (BR-TRACE-01). */
  onCompletedReceipt: boolean;
  corrections: TraceCorrectionMark[];
};

/** Một luống của lô và các phiên thả giống trên luống, sớm nhất trước. Không có phiên nào là luống thiếu giống. */
export type TraceLane = {
  laneNumber: number;
  isFinished: boolean;
  seedings: TraceSeeding[];
};

/** Dòng hóa đơn của lô; đơn giá và thành tiền null khi người xem không được xem hóa đơn của vùng đó. */
export type TraceInvoiceLine = {
  lineNumber: number;
  productName: string;
  kg: number;
  unitPrice: number | null;
  amount: number | null;
};

export type TraceSalesReturn = {
  id: string;
  code: string;
  returnDate: string;
  kg: number;
  outcome: string;
};

/** Hóa đơn bán có lô này, chưa hủy, cùng thương lái và các dòng của lô. */
export type TraceInvoice = {
  invoiceId: string;
  invoiceCode: string;
  invoicedAt: string;
  invoiceDate: string;
  zoneId: string;
  zoneCode: string;
  customerId: string | null;
  customerName: string | null;
  customerPhone: string | null;
  walkIn: boolean;
  kg: number;
  lines: TraceInvoiceLine[];
  returns: TraceSalesReturn[];
};

export type OriginGapKind = "NoSeedingSession" | "SeedLotNotOnCompletedReceipt" | "NotPublisherOfZone";

/** Thông tin nguồn gốc còn thiếu (MSG-TRACE-01, MSG-TRACE-02). */
export type OriginGap = {
  kind: OriginGapKind;
  laneNumber: number | null;
  seedLotCodes: string[];
  zoneCode: string | null;
};

/** Màn truy vết một lô (SCR-TRACE-01): truy ngược về bè, vùng, chu kỳ, luống, lô giống, nhà cung cấp; truy xuôi tới hóa đơn, thương lái. */
export type LotTrace = {
  lotId: string;
  lotCode: string;
  harvestedAt: string;
  harvestDate: string;
  cageCount: number;
  estimatedKg: number;
  statusId: number;
  status: string;
  originState: OriginState;
  publishedAt: string | null;
  withdrawnAt: string | null;
  corrections: TraceCorrectionMark[];
  raftId: string;
  raftCode: string;
  zoneId: string;
  zoneCode: string;
  zoneName: string;
  cycleId: string;
  cycleStartDate: string;
  cycleCloseDate: string | null;
  cycleStatusId: number;
  cycleStatus: string;
  lanes: TraceLane[];
  missing: OriginGap[];
  message: string | null;
  messageCode: string | null;
  /** Hóa đơn cũ nhất trước. */
  invoices: TraceInvoice[];
  invoicedKg: number;
  canPublish: boolean;
  canCorrect: boolean;
  canExport: boolean;
  canWithdraw: boolean;
};

export type LotPublishBlock = "NoRight" | "AlreadyPublished" | "NotOnSalesInvoice" | "OwnerOnly";

/** Kiểm tra trước khi công bố: có được công bố không (`block`), lô đủ thông tin chưa (`missing`). Không thay đổi gì. */
export type LotPublishCheck = {
  lotId: string;
  lotCode: string;
  originState: OriginState;
  publishedAt: string | null;
  withdrawnAt: string | null;
  onSalesInvoice: boolean;
  canPublish: boolean;
  block: LotPublishBlock | null;
  /** Lô đang bị thu hồi: Chủ HTX công bố lại. */
  republish: boolean;
  ready: boolean;
  missing: OriginGap[];
  message: string | null;
  messageCode: string | null;
};

/** Lô sau khi công bố; chỉ đọc các trường cần cho màn. */
export type PublishedLot = {
  id: string;
  lotCode: string;
  originState: OriginState;
};

export type LotPublished = {
  lot: PublishedLot;
  republished: boolean;
  message: string;
  messageCode: string;
};

export type NotificationChannel = "InApp" | "Sms" | "ZaloOa";

/** Thông báo thu hồi gửi một thương lái. `toCall`: tin nhắn không gửi được, Chủ HTX cần gọi điện (BR-TRACE-07). */
export type WithdrawalNotice = {
  customerId: string;
  customerName: string;
  phoneNumber: string | null;
  traderAccountId: string | null;
  invoiceCodes: string[];
  channel: NotificationChannel;
  deliveryStatusId: number;
  deliveryStatus: string;
  notifiedInApp: boolean;
  toCall: boolean;
};

/** Thương lái sẽ nhận thông báo nếu thu hồi bây giờ. `notice` là MSG-TRACE-06 khi không còn hóa đơn nào bán lô này. */
export type WithdrawalTrader = {
  customerId: string;
  customerName: string;
  phoneNumber: string | null;
  traderAccountId: string | null;
  invoiceCodes: string[];
};

export type LotWithdrawalPreview = {
  lotId: string;
  lotCode: string;
  originState: OriginState;
  publishedAt: string | null;
  traders: WithdrawalTrader[];
  walkInInvoiceCodes: string[];
  message: string;
  messageCode: string;
  notice: string | null;
  noticeCode: string | null;
};

export type WithdrawLot = {
  reason: string;
};

export type LotWithdrawn = {
  lot: PublishedLot;
  notices: WithdrawalNotice[];
  walkInInvoiceCodes: string[];
  message: string;
  messageCode: string;
  notice: string | null;
  noticeCode: string | null;
};

/** Thông báo của lần thu hồi gần nhất, đọc lại để không mất danh sách thương lái cần gọi. */
export type LotWithdrawalNotices = {
  lotId: string;
  lotCode: string;
  originState: OriginState;
  withdrawnAt: string | null;
  notices: WithdrawalNotice[];
  walkInInvoiceCodes: string[];
};
