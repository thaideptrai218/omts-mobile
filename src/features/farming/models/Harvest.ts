import type { OriginState } from "@/models/OriginState";

/** Trạng thái của một luống hôm nay (BR-FARM-03). */
export type LaneState = "NotSeeded" | "Growing" | "BeingHarvested" | "Harvested";

export type HarvestLane = {
  id: string;
  laneNumber: number;
  statusId: number;
  status: string;
  state: LaneState;
  /** Luống chọn được cho lô mới ngay bây giờ. */
  canHarvest: boolean;
};

export type HarvestCycle = {
  id: string;
  startDate: string;
  closeDate: string | null;
  statusId: number;
  status: string;
};

export type HarvestLotItem = {
  id: string;
  lotCode: string;
  harvestedAt: string;
  harvestDate: string;
  laneNumbers: number[];
  finishedLaneNumbers: number[];
  cageCount: number;
  kgPerCage: number;
  estimatedKg: number;
  invoicedKg: number;
  remainingKg: number;
  statusId: number;
  status: string;
  originState: OriginState;
  /** Đơn mà lần thu này thu cho; lô ghi trước ngày 11/11/2026 không có. */
  purchaseRequestId: string | null;
  purchaseRequestCode: string | null;
};

/** Đơn đã nhận mà lô mới ghi cho được (chốt 11/11/2026): Chủ HTX chưa đánh dấu thu xong. */
export type HarvestOrderOption = {
  id: string;
  code: string;
  customerName: string;
  productName: string;
  acceptedCages: number;
  /** Lồng của các lô đã ghi cho đơn, ở mọi bè. */
  harvestedCages: number;
  pickupDate: string;
  workDate: string | null;
  /** Kế hoạch ngày làm của đơn đưa người ra bè này: chọn sẵn. */
  plannedOnRaft: boolean;
};

/** Màn thu hoạch của một bè: chu kỳ đang mở, các luống và các lô của chu kỳ. */
export type HarvestScreen = {
  raftId: string;
  raftCode: string;
  cycle: HarvestCycle | null;
  averageKgPerCage: number;
  canRecordHarvest: boolean;
  lanes: HarvestLane[];
  lots: HarvestLotItem[];
  /** Các đơn chọn được cho lô mới; rỗng khi người dùng không ghi được lô. */
  orders: HarvestOrderOption[];
};

/** Phiếu ghi thu hoạch đang nhập: số gõ dạng chữ, kiểm tra trước khi gửi. */
export type HarvestDraft = {
  /** Đơn mà lần thu này thu cho (bắt buộc). */
  purchaseRequestId: string;
  laneNumbers: number[];
  finishedLaneNumbers: number[];
  cages: string;
  estimatedKg: string;
};

export type HarvestLotSaved = {
  lot: { id: string; lotCode: string; cageCount: number; estimatedKg: number };
  everySeededLaneHarvested: boolean;
  message: string;
  messageCode: string;
};

/** Lô đang bán, chọn được khi cân và lập hóa đơn. */
export type HarvestLotForSale = {
  id: string;
  lotCode: string;
  raftId: string;
  raftCode: string;
  zoneId: string;
  zoneCode: string;
  zoneName: string;
  harvestDate: string;
  remainingKg: number;
  statusId: number;
  status: string;
  originState: OriginState;
  withdrawnAt: string | null;
};

export type HarvestLotsForSale = {
  lots: HarvestLotForSale[];
  message: string | null;
  messageCode: string | null;
};
