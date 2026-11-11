import type { PurchaseStaffing } from "@/features/sales/models/PurchaseStaffing";

/** Khóa lọc danh sách yêu cầu mua của nhân viên: tất cả hoặc một trạng thái (service đổi sang `statusId`). */
export type PurchaseFilter = "all" | "awaitingResponse" | "awaitingStaff" | "accepted" | "declined" | "cancelled";

/** Phản hồi của Chủ HTX (SALE-10.1): khi từ chối thì số lồng, ngày nhận và cho trả sau để trống. */
export type PurchaseRequestResponse = {
  acceptedCages: number | null;
  pickupDate: string | null;
  payLaterAgreed: boolean | null;
  note: string | null;
  respondedAt: string;
};

/** Hồ sơ thương lái của yêu cầu, để Chủ HTX quyết định (SCR-SALE-02). Công nợ là 0 khi chưa có hóa đơn. */
export type PurchaseRequestCustomer = {
  id: string;
  name: string;
  phoneNumber: string | null;
  currentDebt: number;
};

/** Một lần gửi phản hồi qua SMS hoặc Zalo OA, kèm trạng thái giao (BR-SALE-09). */
export type PurchaseRequestSending = {
  channel: string;
  phoneNumber: string | null;
  deliveryStatusId: number | null;
  deliveryStatus: string | null;
  deliveryStatusAt: string | null;
};

/**
 * Phần chung của yêu cầu mua mà nhân viên và thương lái cùng thấy. `status` là tên tiếng Anh của server, không hiện cho người dùng:
 * nhãn tiếng Việt lấy theo `statusId` và `fulfilled`.
 */
type PurchaseRequestBase = {
  id: string;
  code: string;
  productId: string;
  productName: string;
  requestedCages: number;
  /** Ngày nhận thương lái đề nghị. */
  pickupDate: string;
  note: string | null;
  sentAt: string;
  statusId: number;
  status: string;
  /** Đã có hóa đơn nhận đủ đơn (BR-SALE-01); `statusId` vẫn là Đã chấp nhận. */
  fulfilled: boolean;
  /** Phản hồi của Chủ HTX; null khi chưa phản hồi. */
  response: PurchaseRequestResponse | null;
  cancelReason: string | null;
  cancelledAt: string | null;
  rowVersion: string;
  /** Lúc Chủ HTX đánh dấu đã thu xong (chốt 11/11/2026); thương lái cũng thấy. */
  harvestCompletedAt: string | null;
};

/** Yêu cầu mua như nhân viên thấy (SCR-SALE-02). */
export type PurchaseRequest = PurchaseRequestBase & {
  customer: PurchaseRequestCustomer;
  sendings: PurchaseRequestSending[];
  /** Kế hoạch nhân lực Chủ HTX gửi trước khi nhận đơn; null khi chưa gửi. */
  staffing: PurchaseStaffing | null;
  /** Các lô và nút thu xong, chỉ có ở màn chi tiết của đơn đã chấp nhận. */
  harvest: PurchaseHarvest | null;
};

/** Yêu cầu mua như chính thương lái thấy (SCR-SALE-01): không có dữ liệu của khách khác hay trường nội bộ. */
export type TraderPurchaseRequest = PurchaseRequestBase & {
  canCancel: boolean;
};

/** Mua hàng của tôi (SALE-10), phần yêu cầu mua. `messageCode` là MSG-GEN-11 khi hồ sơ chưa có yêu cầu nào. */
export type MyPurchases = {
  requests: TraderPurchaseRequest[];
  page: number;
  pageSize: number;
  total: number;
  message: string | null;
  messageCode: string | null;
};

/** Yêu cầu vừa gửi kèm MSG-GEN-05. `replayed` khi lần gửi lại trả về yêu cầu đã lưu trước đó. */
export type PurchaseRequestSaved = {
  request: TraderPurchaseRequest;
  message: string;
  messageCode: string;
  replayed: boolean;
};

/** Một lô thu hoạch đã ghi cho đơn: bè nào, bao nhiêu lồng, ai ghi, lúc nào. */
export type PurchaseHarvestLot = {
  id: string;
  lotCode: string;
  zoneCode: string;
  raftCode: string;
  cageCount: number;
  estimatedKg: number;
  harvestedAt: string;
  recordedByName: string | null;
};

/** Thu hoạch của một đơn, ở màn chi tiết của nhân viên (chốt 11/11/2026). */
export type PurchaseHarvest = {
  /** Tổng lồng của các lô, để so với số lồng đã nhận đơn; thiếu hay dư vẫn đánh dấu được. */
  harvestedCages: number;
  /** Lô thu sớm nhất trước. */
  lots: PurchaseHarvestLot[];
  completedAt: string | null;
  completedByName: string | null;
  /** Hiện nút "Đã thu xong": Chủ HTX, đơn đã nhận, chưa đánh dấu, có ít nhất một lô. */
  canMarkDone: boolean;
  /** Chủ HTX bỏ đánh dấu được khi đơn chưa cân lần nào. */
  canUnmarkDone: boolean;
};

export type PurchaseDraft = {
  productId: string;
  cages: string;
  pickupDate: string;
  note: string;
  clientOperationId: string;
};

/** Chủ HTX nhận đơn (SALE-03.0): số lồng và ngày nhận phải đúng như kế hoạch nhân lực đã đủ người đồng ý. */
export type AcceptPurchaseRequest = {
  acceptedCages: number;
  pickupDate: string;
  payLaterAgreed: boolean;
  note: string;
};
