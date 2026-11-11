import type { EmployeeRequest, EmployeeRequestType } from "@/features/workforce/models/EmployeeRequest";
import type { Label } from "@/models/UI";
import { date } from "@/utils/format";

/** Mã trạng thái của yêu cầu nhân viên trong danh mục Status (nhóm EmployeeRequest, SCR-LABOR-03). */
export const REQUEST_STATUS = { awaiting: 3801, approved: 3802, rejected: 3803, cancelled: 3804 } as const;

export const REQUEST_TYPE_TEXT: Record<EmployeeRequestType, string> = {
  Leave: "Nghỉ phép",
  MissedCheckIn: "Quên giờ vào",
  MissedCheckOut: "Quên giờ ra",
};

/** Nhãn trạng thái của yêu cầu: luôn có chữ, không chỉ dựa vào màu. */
export function requestStatus(r: Pick<EmployeeRequest, "statusId" | "status">): Label {
  switch (r.statusId) {
    case REQUEST_STATUS.awaiting: return { text: "Chờ duyệt", tone: "warning" };
    case REQUEST_STATUS.approved: return { text: "Đã duyệt", tone: "success" };
    case REQUEST_STATUS.rejected: return { text: "Từ chối", tone: "danger" };
    case REQUEST_STATUS.cancelled: return { text: "Đã hủy", tone: "neutral" };
    default: return { text: r.status, tone: "neutral" };
  }
}

/** "01/10/2026 – 03/10/2026" với nghỉ phép; "01/10/2026, lúc 07:30" với quên giờ vào hoặc ra. */
export function requestDays(r: Pick<EmployeeRequest, "type" | "from" | "to" | "requestedTime">) {
  if (r.type !== "Leave") return `${date(r.from)}, lúc ${r.requestedTime?.slice(0, 5) ?? "—"}`;
  return r.from === r.to ? date(r.from) : `${date(r.from)} – ${date(r.to)}`;
}

/** Giờ HTX "07:30" của một thời điểm ISO; "—" khi chưa có. */
export function clock(value: string | null | undefined) {
  if (!value) return "—";
  return new Date(value).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit", hour12: false, timeZone: "Asia/Ho_Chi_Minh" });
}

/** Nhãn chấm công trong ngày: chưa vào, đang làm, đã ra ca, hoặc ra ca mà thiếu giờ vào (BR-LABOR-06). */
export function attendanceStatus(a: { checkedInAt: string | null; checkedOutAt: string | null }): Label {
  if (a.checkedOutAt) return a.checkedInAt ? { text: "Đã ra ca", tone: "success" } : { text: "Thiếu giờ vào", tone: "warning" };
  return a.checkedInAt ? { text: "Đang làm", tone: "success" } : { text: "Chưa vào ca", tone: "neutral" };
}
