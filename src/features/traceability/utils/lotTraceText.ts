import type { LotPublishBlock, OriginGap, WithdrawalNotice } from "@/features/traceability/models/LotTracing";
import type { OriginState } from "@/models/OriginState";
import type { Label } from "@/models/UI";

export const ORIGIN_STATE: Record<OriginState, Label> = {
  NotPublished: { text: "Chưa công bố", tone: "neutral" },
  Published: { text: "Đã công bố", tone: "success" },
  Withdrawn: { text: "Đã thu hồi", tone: "danger" },
};

/** Một mục còn thiếu của thông tin nguồn gốc (MSG-TRACE-01, MSG-TRACE-02), viết bằng tiếng Việt. */
export function gapText(gap: OriginGap): string {
  switch (gap.kind) {
    case "NoSeedingSession":
      return `Luống ${gap.laneNumber ?? "?"} chưa có phiên thả giống trong chu kỳ này.`;
    case "SeedLotNotOnCompletedReceipt":
      return `Luống ${gap.laneNumber ?? "?"}: lô giống ${gap.seedLotCodes.join(", ")} chưa nằm trên phiếu nhập đã hoàn tất.`;
    default:
      return `Bạn chưa được công bố nguồn gốc ở vùng ${gap.zoneCode ?? "của lô"}.`;
  }
}

/** Vì sao không có nút công bố. */
export const PUBLISH_BLOCK_TEXT: Record<LotPublishBlock, string> = {
  NoRight: "Bạn không có quyền công bố nguồn gốc ở vùng của lô này.",
  AlreadyPublished: "Lô đã được công bố nguồn gốc.",
  NotOnSalesInvoice: "Lô chưa có trên hóa đơn bán nào nên chưa công bố được.",
  OwnerOnly: "Lô đang bị thu hồi: chỉ Chủ HTX công bố lại được.",
};

/** Tình trạng gửi tin thu hồi cho một thương lái. */
export function noticeLabel(n: WithdrawalNotice): Label {
  if (n.toCall) return { text: "Cần gọi điện", tone: "danger" };
  if (/sending/i.test(n.deliveryStatus)) return { text: "Đang gửi", tone: "warning" };
  return { text: "Đã nhắn tin", tone: "success" };
}
