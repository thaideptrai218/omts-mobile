import type { CycleListItem } from "@/features/farming/models/Cycle";

import { Badge } from "@/components/Badge/Badge";
import { CYCLE_STATUS } from "@/features/farming/services/cultivationService";

/** Nhãn của một chu kỳ: đang nuôi, đã đóng hoặc đã đóng sớm (BR-CYCLE-07). Có chữ, không chỉ dựa vào màu. */
export function CycleBadge({ cycle }: { cycle: Pick<CycleListItem, "statusId" | "closedEarly"> }) {
  if (cycle.statusId === CYCLE_STATUS.open) return <Badge text="Đang nuôi" tone="success" />;
  return <Badge text={cycle.closedEarly ? "Đã đóng sớm" : "Đã đóng"} tone={cycle.closedEarly ? "warning" : "neutral"} />;
}
