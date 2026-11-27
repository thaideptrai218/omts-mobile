import type { Label } from "@/models/UI";
import { statusLabel } from "@/utils/labels";

/**
 * Trạng thái lô thu hoạch theo mã trong danh mục Status của backend (BR-HARVEST-04): lô Open và Reopened còn bán được. Chữ giống
 * báo cáo sản lượng. Trường `status` của backend là tên tiếng Anh ("Open", "Reopened", "Closed"), không hiện thẳng lên màn.
 */
const LOT_STATUS: Record<number, Label> = {
  2901: { text: "Đang bán", tone: "success" },
  2902: { text: "Mở lại", tone: "warning" },
  2903: { text: "Đã đóng", tone: "neutral" },
};

/** Chữ tiếng Việt cho trạng thái lô; mã lạ thì dịch theo tên trạng thái qua bảng chung. */
export function lotStatusLabel(statusId: number, status: string): Label {
  return LOT_STATUS[statusId] ?? statusLabel(status);
}
