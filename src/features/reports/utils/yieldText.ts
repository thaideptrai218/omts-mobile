import type { HarvestYieldGroup, HarvestYieldGrouping, HarvestYieldLot, YieldPeriod, YieldRange } from "@/features/reports/models/HarvestYield";
import type { Label } from "@/models/UI";
import { date, todayIso } from "@/utils/format";

/** Mã trạng thái lô thu hoạch trong danh mục Status của backend. */
const LOT_STATUS = { open: 2901, reopened: 2902, closed: 2903 } as const;

export const GROUPINGS: [HarvestYieldGrouping, string][] = [
  ["Raft", "Theo bè"],
  ["Zone", "Theo vùng"],
  ["Cycle", "Theo chu kỳ"],
];

export const PERIODS: [YieldPeriod, string][] = [
  ["thisMonth", "Tháng này"],
  ["lastMonth", "Tháng trước"],
  ["custom", "Chọn ngày"],
];

/** MSG-HARVEST-04, viết lại bằng tiếng Việt. */
export const NOT_FINAL_TEXT = "Một số lô vẫn đang bán nên số liệu của các lô đó còn có thể thay đổi.";

/** Tiêu đề nhóm bằng tiếng Việt; `label` của server dành cho tệp Excel. */
export function groupTitle(group: HarvestYieldGroup, groupBy: HarvestYieldGrouping): string {
  if (groupBy === "Zone") return group.zoneName || group.zoneCode;
  if (groupBy === "Cycle") return `Bè ${group.raftCode ?? ""} · chu kỳ từ ${date(group.cycleStartDate)}`;
  return `Bè ${group.raftCode ?? group.label}`;
}

/** Chu kỳ còn mở thì còn có thể có thêm lô. */
export function cycleText(group: HarvestYieldGroup): string | null {
  if (!group.cycleId) return null;
  return group.cycleCloseDate ? `Đã đóng ngày ${date(group.cycleCloseDate)}` : "Đang nuôi, còn có thể có thêm lô";
}

export function lotStatus(lot: HarvestYieldLot): Label {
  switch (lot.statusId) {
    case LOT_STATUS.open: return { text: "Đang bán", tone: "success" };
    case LOT_STATUS.reopened: return { text: "Mở lại", tone: "warning" };
    case LOT_STATUS.closed: return { text: "Đã đóng", tone: "neutral" };
    default: return { text: lot.notFinal ? "Đang bán" : "Đã đóng", tone: "neutral" };
  }
}

/** Khoảng ngày gửi lên theo lựa chọn nhanh; "Tháng này" để server tự lấy mặc định. */
export function periodRange(period: YieldPeriod, custom: YieldRange): YieldRange {
  if (period === "custom") return custom;
  if (period === "thisMonth") return { from: null, to: null };
  const [year, month] = todayIso().split("-").map(Number);
  // Tháng trước theo giờ HTX: ngày 1 của tháng trước tới ngày 0 (ngày cuối tháng trước) của tháng này.
  const from = new Date(Date.UTC(year, month - 2, 1)).toISOString().slice(0, 10);
  const to = new Date(Date.UTC(year, month - 1, 0)).toISOString().slice(0, 10);
  return { from, to };
}
