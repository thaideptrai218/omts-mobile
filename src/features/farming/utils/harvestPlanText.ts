import type { HarvestPlanExecutor, HarvestPlanLine, HarvestPlanProgress } from "@/features/farming/models/HarvestPlan";
import type { Label } from "@/models/UI";

import { PLAN_STATUS } from "@/features/farming/services/harvestPlanService";

/** Trạng thái kế hoạch theo mã (backend chỉ trả tên tiếng Anh). */
const STATUS: Record<number, Label> = {
  [PLAN_STATUS.draft]: { text: "Nháp", tone: "neutral" },
  [PLAN_STATUS.assigned]: { text: "Đã giao, chờ nhận", tone: "warning" },
  [PLAN_STATUS.received]: { text: "Đã nhận, chờ thu", tone: "warning" },
  [PLAN_STATUS.harvesting]: { text: "Đang thu", tone: "warning" },
  [PLAN_STATUS.handedOver]: { text: "Đã bàn giao, chờ hoàn thành", tone: "warning" },
  [PLAN_STATUS.completed]: { text: "Hoàn thành", tone: "success" },
  [PLAN_STATUS.cancelled]: { text: "Đã hủy", tone: "neutral" },
};

export function planStatusLabel(statusId: number): Label {
  return STATUS[statusId] ?? { text: "Trạng thái khác", tone: "neutral" };
}

export const executorText = (executor: HarvestPlanExecutor) => (executor === "Owner" ? "Chủ HTX tự thu" : "Quản lý vùng thu");

/** "1/2 bè đã xong" cùng số luống đã thu và không thu. */
export function progressText(p: HarvestPlanProgress): string {
  const parts = [`${p.linesDone}/${p.lines} bè đã xong`, `${p.lanesHarvested}/${p.lanes} luống đã thu`];
  if (p.lanesSkipped > 0) parts.push(`${p.lanesSkipped} luống không thu`);
  return parts.join(" · ");
}

/** Danh sách số luống, ví dụ "1, 3". */
const lanes = (numbers: number[]) => numbers.join(", ");

/** Các luống của bè theo trạng thái: chờ thu, đã thu, không thu. */
export function laneSummary(line: HarvestPlanLine): string[] {
  const planned = line.lanes.filter((l) => l.state === "Planned").map((l) => l.laneNumber);
  const harvested = line.lanes.filter((l) => l.state === "Harvested").map((l) => l.laneNumber);
  const skipped = line.lanes.filter((l) => l.state === "Skipped").map((l) => l.laneNumber);
  return [
    planned.length ? `Luống chờ thu: ${lanes(planned)}` : "",
    harvested.length ? `Luống đã thu: ${lanes(harvested)}` : "",
    skipped.length ? `Luống không thu: ${lanes(skipped)}` : "",
  ].filter(Boolean);
}

/** Trạng thái một bè trong kế hoạch. */
export function lineLabel(line: HarvestPlanLine): Label {
  if (line.state === "Harvested") return { text: "Đã thu, có lô", tone: "success" };
  if (line.state === "Skipped") return { text: "Không thu bè này", tone: "neutral" };
  return { text: "Chờ thu", tone: "warning" };
}
