/** Chu kỳ nuôi của một bè (CYCLE-01, CYCLE-05, CYCLE-06), theo `CultivationCycleDtos.cs` và `CycleCloseDtos.cs` của backend. */

/** Một chu kỳ trong danh sách của bè, mới nhất trước (CYCLE-05.1). */
export type CycleListItem = {
  id: string;
  startDate: string;
  closeDate: string | null;
  statusId: number;
  status: string;
  rowVersion: string;
  /** Chu kỳ đã đóng sớm (BR-CYCLE-07). */
  closedEarly: boolean;
};

/** Một bè trên màn Chu kỳ nuôi của vùng (SCR-CYCLE-01): các nút chỉ bật khi backend sẽ nhận. */
export type ZoneCycleItem = {
  raftId: string;
  raftCode: string;
  raftStatusId: number;
  raftStatus: string;
  /** Số luống đang dùng. */
  laneCount: number;
  /** Chu kỳ đang mở, không có thì chu kỳ đóng gần nhất, không có nữa thì null. */
  cycle: CycleListItem | null;
  lastCloseDate: string | null;
  canStart: boolean;
  canEdit: boolean;
  canCancel: boolean;
  canClose: boolean;
};

export type CycleView = {
  id: string;
  raftId: string;
  raftCode: string;
  startDate: string;
  closeDate: string | null;
  expectedSeedQuantity: number | null;
  expectedHarvestDate: string | null;
  targetYieldKg: number | null;
  /** Ngày đánh dấu thả giống xong. */
  seedingCompletedOn: string | null;
  assessment: string | null;
  closedEarly: boolean;
  /** Tính cả ngày đầu và ngày cuối. */
  daysOfFarming: number;
  statusId: number;
  status: string;
  /** Chu kỳ đang mở trên bè và vùng đang dùng. */
  canEdit: boolean;
  /** Sửa được và chưa có bản ghi nào: hủy được vì bắt đầu nhầm. */
  canCancel: boolean;
  rowVersion: string;
};

export type LaneView = { id: string; laneNumber: number; statusId: number; status: string };

export type CycleSaved = { cycle: CycleView; message: string; messageCode: string };

export type CycleStarted = { cycle: CycleView; previousCloseDate: string | null; lanes: LaneView[]; message: string; messageCode: string };

/** Lý do đóng sớm (BR-CYCLE-07): chưa có phiên thả giống, hoặc còn luống đã thả mà chưa thu hết. */
export type EarlyCloseReason = "NoSeedingSession" | "LanesNotHarvested";

/** Tổng kết chu kỳ (BR-CYCLE-06), tính lại mỗi lần xem; chu kỳ đang mở thì tính như thể đóng hôm nay. */
export type CycleSummary = {
  cycleId: string;
  raftCode: string;
  startDate: string;
  closeDate: string | null;
  asOf: string;
  seedingSessionCount: number;
  seedHung: number;
  seedUnit: string | null;
  harvestLotCount: number;
  /** Tổng kg ước tính của các lô, không phải kg cân tại cảng. */
  kgHarvested: number;
  lastHarvestDate: string | null;
  daysOfFarming: number;
  expectedSeedQuantity: number | null;
  expectedHarvestDate: string | null;
  targetYieldKg: number | null;
  closedEarly: boolean;
  earlyReason: EarlyCloseReason | null;
  notHarvestedLanes: number[];
  assessment: string | null;
};

/** Những gì cần xem trước khi đóng chu kỳ (CYCLE-06 bước 1, 2, 4). Câu hỏi của server bằng tiếng Anh nên app không hiện. */
export type CycleClosePreview = {
  summary: CycleSummary;
  isEarly: boolean;
  /** Đóng sớm và người đóng không phải Chủ HTX: phải xác nhận Chủ HTX đã đồng ý. */
  needsOwnerApproval: boolean;
  earlyCloseMessage: string | null;
  earlyCloseMessageCode: string | null;
  confirmMessage: string;
  confirmMessageCode: string;
  cycleRowVersion: string;
};

export type CycleClosed = { cycle: CycleView; summary: CycleSummary };

/** Phiếu bắt đầu hoặc sửa chu kỳ: chữ người dùng gõ, đổi sang số khi gửi. */
export type CycleDraft = {
  startDate: string;
  expectedSeedQuantity: string;
  expectedHarvestDate: string;
  targetYieldKg: string;
};
