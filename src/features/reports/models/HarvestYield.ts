/** Báo cáo sản lượng nuôi (HARVEST-04, SCR-HARVEST-03), theo `HarvestYieldDtos.cs` của backend. Số liệu tính khi xem, không lưu (BR-HARVEST-07). */

/** Gom theo bè, theo vùng hoặc theo chu kỳ nuôi. */
export type HarvestYieldGrouping = "Raft" | "Zone" | "Cycle";

/** Bộ lọc gửi lên: không có ngày thì server lấy tháng hiện tại; không chọn vùng là mọi vùng người xem được xem. */
export type HarvestYieldQuery = {
  from: string | null;
  to: string | null;
  zoneId: string | null;
  groupBy: HarvestYieldGrouping;
};

/** Một lô của nhóm, số liệu tính lúc xem. */
export type HarvestYieldLot = {
  id: string;
  lotCode: string;
  harvestDate: string;
  /** Ngày thu trong khoảng đã chọn; false chỉ khi gom theo chu kỳ (lô khác của chu kỳ có lô trong khoảng). */
  inPeriod: boolean;
  raftId: string;
  raftCode: string;
  zoneId: string;
  zoneCode: string;
  cycleId: string;
  statusId: number;
  status: string;
  estimatedKg: number;
  invoicedKg: number;
  returnedKg: number;
  /** Kg trên hóa đơn trừ kg trả lại. */
  soldKg: number;
  /** Kg còn lại khi đóng lô cộng kg hủy: phần hao hụt. */
  lostKg: number;
  /** Ước tính trừ đã bán trừ hao hụt; âm khi bán nhiều hơn ước tính. */
  differenceKg: number;
  /** Lô còn đang bán (mở hoặc mở lại) nên số liệu còn đổi. */
  notFinal: boolean;
};

/** Một bè, một vùng hoặc một chu kỳ: mỗi số là tổng của các lô trong nhóm. */
export type HarvestYieldGroup = {
  key: string;
  /** Chữ backend dùng cho tệp Excel (tiếng Anh với chu kỳ); màn hình tự dựng tiêu đề tiếng Việt. */
  label: string;
  zoneId: string;
  zoneCode: string;
  zoneName: string;
  raftId: string | null;
  raftCode: string | null;
  cycleId: string | null;
  cycleStartDate: string | null;
  cycleCloseDate: string | null;
  cycleStatus: string | null;
  lotCount: number;
  estimatedKg: number;
  soldKg: number;
  lostKg: number;
  differenceKg: number;
  notFinal: boolean;
  /** Lô thu sớm nhất trước. */
  lots: HarvestYieldLot[];
};

export type HarvestYieldTotals = {
  lotCount: number;
  estimatedKg: number;
  soldKg: number;
  lostKg: number;
  differenceKg: number;
  notFinal: boolean;
};

export type HarvestYieldReport = {
  /** Khoảng ngày đã áp dụng, kể cả khi server tự lấy mặc định. */
  from: string;
  to: string;
  groupBy: HarvestYieldGrouping;
  /** Theo mã vùng, rồi mã bè, rồi ngày bắt đầu chu kỳ. */
  groups: HarvestYieldGroup[];
  totals: HarvestYieldTotals;
  /** MSG-HARVEST-04 khi còn lô đang bán. */
  notFinalNotice: string | null;
  notFinalNoticeCode: string | null;
  /** MSG-GEN-10 khi không có lô nào. */
  message: string | null;
  messageCode: string | null;
};

/** Khoảng ngày chọn nhanh trên màn báo cáo. */
export type YieldPeriod = "thisMonth" | "lastMonth" | "custom";

/** Khoảng ngày tự chọn; null là chưa chọn. */
export type YieldRange = { from: string | null; to: string | null };
