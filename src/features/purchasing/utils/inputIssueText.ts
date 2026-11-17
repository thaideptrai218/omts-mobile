import type { InputItem } from "@/features/purchasing/models/InputItem";
import type { InputSeedLots } from "@/features/purchasing/models/InputIssue";
import type { Label } from "@/models/UI";
import { ApiError } from "@/services/errors";
import { errorText } from "@/utils/errorText";
import { num } from "@/utils/format";
import { ISSUE_CANCELLED, ISSUE_COMPLETED, ISSUE_DRAFT } from "@/features/purchasing/services/inputIssueService";

/** Tên trạng thái theo bản web: Phiếu tạm, Hoàn thành, Đã hủy. */
const ISSUE_STATUS: Record<number, Label> = {
  [ISSUE_DRAFT]: { text: "Phiếu tạm", tone: "warning" },
  [ISSUE_COMPLETED]: { text: "Hoàn thành", tone: "success" },
  [ISSUE_CANCELLED]: { text: "Đã hủy", tone: "neutral" },
};

export function issueStatusLabel(statusId: number): Label {
  return ISSUE_STATUS[statusId] ?? { text: "Trạng thái khác", tone: "neutral" };
}

/** "KV01 · bè B03": nơi nhận vật tư của phiếu xuất dùng. */
export function issuePlace(zoneCode: string | null, raftCode: string | null) {
  return [zoneCode, raftCode ? `bè ${raftCode}` : null].filter(Boolean).join(" · ") || null;
}

/**
 * Lỗi khi lập phiếu. Thiếu hàng (MSG-INPUT-01) thì nói rõ vật tư nào, lô nào và kho sẽ còn bao nhiêu theo đơn vị gốc,
 * dựa vào `itemId`, `seedLotLineId`, `balanceAfter` backend gửi kèm.
 */
export function issueErrorText(err: unknown, items: InputItem[], lots: Record<string, InputSeedLots>) {
  if (!(err instanceof ApiError) || err.code !== "MSG-INPUT-01") return errorText(err);
  const item = items.find((x) => x.id === err.details.itemId);
  const lotId = err.details.seedLotLineId;
  const lot = item && lotId ? lots[item.id]?.lots.find((l) => l.seedLotLineId === lotId) : undefined;
  const balance = typeof err.details.balanceAfter === "number" ? err.details.balanceAfter : null;
  const what = item ? `${item.name}${lot ? ` lô ${lot.code}` : lotId ? "" : item.group === "Seed" ? " (phần chưa gắn lô)" : ""}` : "vật tư";
  return `Không đủ ${what} trong kho để xuất${balance !== null ? `: kho sẽ còn ${num(balance, item?.unit)}` : ""}. Hãy giảm số lượng${item?.group === "Seed" ? " hoặc chọn lô khác" : ""}.`;
}
