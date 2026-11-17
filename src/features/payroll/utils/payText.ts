import type { PayrollPeriodType, PayrollScope, PayrollSheetStatus } from "@/features/payroll/models/Payroll";
import type { WagePaymentKind, WagePaymentMethod, WagePaymentStatus } from "@/features/payroll/models/PayrollPayment";
import type { PayPeriod } from "@/features/payroll/models/PayrollSettings";
import type { PayRate } from "@/features/workforce/models/Job";
import type { Label } from "@/models/UI";
import { date, num, todayIso } from "@/utils/format";

/** Mã trạng thái của loại việc trong danh mục Status (nhóm Usage). */
export const JOB_IN_USE = 101;
export const JOB_DISCONTINUED = 102;

/** Nhãn trạng thái bảng lương: luôn có chữ, không chỉ dựa vào màu. */
export function sheetStatus(status: PayrollSheetStatus): Label {
  switch (status) {
    case "Creating": return { text: "Đang lập", tone: "warning" };
    case "Provisional": return { text: "Tạm tính", tone: "warning" };
    case "Finalized": return { text: "Đã chốt", tone: "success" };
    case "Cancelled": return { text: "Đã hủy", tone: "neutral" };
    default: return { text: String(status), tone: "neutral" };
  }
}

export const PERIOD_TYPE_TEXT: Record<PayrollPeriodType, string> = { Monthly: "Trọn tháng", Custom: "Khoảng ngày" };

export const SCOPE_TEXT: Record<PayrollScope, string> = { All: "Mọi nhân viên có giờ công", Selected: "Nhân viên được chọn" };

export const METHOD_TEXT: Record<WagePaymentMethod, string> = { Cash: "Tiền mặt", BankTransfer: "Chuyển khoản", Other: "Khác" };

/** Hai hình thức server nhận khi ghi trả lương. */
export const PAY_METHODS: WagePaymentMethod[] = ["Cash", "BankTransfer"];

export const KIND_TEXT: Record<WagePaymentKind, string> = { Wage: "Trả lương", Advance: "Tạm ứng" };

export function paymentStatus(status: WagePaymentStatus): Label | null {
  return status === "Cancelled" ? { text: "Đã hủy", tone: "neutral" } : null;
}

export function jobStatus(statusId: number): Label {
  return statusId === JOB_IN_USE ? { text: "Đang dùng", tone: "success" } : { text: "Ngừng dùng", tone: "neutral" };
}

/** "01/10/2026 – 31/10/2026". */
export function periodText(from: string, to: string) {
  return from === to ? date(from) : `${date(from)} – ${date(to)}`;
}

/** Kỳ lương như trong MSG-LABOR-36: "11/2026 (26/10/2026 đến 25/11/2026)". */
export function payPeriodText(period: PayPeriod) {
  return `${period.name} (${date(period.start)} đến ${date(period.end)})`;
}

/** "YYYY-MM" → "10/2026". */
export function monthText(month: string | null) {
  if (!month) return "";
  const [y, m] = month.split("-");
  return m ? `${m}/${y}` : month;
}

export function hoursText(hours: number) {
  return num(hours, "giờ");
}

/** Mọi mức tiền công của loại việc, ngày mới nhất trước, kèm nhãn đang áp dụng, sắp áp dụng hay đã thay. */
export function rateHistory(current: PayRate | null, others: PayRate[]): { rate: PayRate; label: Label }[] {
  const today = todayIso();
  return [...(current ? [current] : []), ...others]
    .sort((a, b) => b.effectiveFrom.localeCompare(a.effectiveFrom))
    .map((rate) => ({
      rate,
      label: rate === current ? { text: "Đang áp dụng", tone: "success" }
        : rate.effectiveFrom > today ? { text: "Sắp áp dụng", tone: "warning" }
        : { text: "Đã thay", tone: "neutral" },
    }));
}

/** Giá sắp áp dụng gần nhất (ngày sau hôm nay), nếu có. */
export function nextRate(others: PayRate[]): PayRate | null {
  const today = todayIso();
  return others.filter((r) => r.effectiveFrom > today).sort((a, b) => a.effectiveFrom.localeCompare(b.effectiveFrom))[0] ?? null;
}

/** Ngày đầu và ngày cuối của tháng "YYYY-MM". */
export function monthRange(month: string): { from: string; to: string } {
  const [y, m] = month.split("-").map(Number);
  const last = new Date(y, m, 0).getDate();
  return { from: `${month}-01`, to: `${month}-${String(last).padStart(2, "0")}` };
}

/** Khoảng ngày là trọn một tháng dương lịch thì gửi Monthly, ngược lại Custom (`PayrollRules.IsValidPeriod`). */
export function periodTypeOf(from: string, to: string): PayrollPeriodType {
  return from.endsWith("-01") && monthRange(from.slice(0, 7)).to === to ? "Monthly" : "Custom";
}

/**
 * Thời điểm trả nhập ở ô `datetime-local` (giờ HTX): trống hoặc sau hiện tại thì trả câu lỗi. Server cho đồng hồ máy nhanh
 * tối đa 5 phút, app không cho chọn giờ sau hiện tại.
 */
export function paidAtProblem(value: string, nowInput: string) {
  if (!value) return "Chọn ngày giờ trả.";
  return value > nowInput ? "Ngày giờ trả không được sau thời điểm hiện tại." : "";
}

/** Số tiền nhập: số nguyên từ 1 đồng đến `max` (nếu có); trả về null khi sai. */
export function wholeAmount(value: number | null, max?: number) {
  return value !== null && Number.isInteger(value) && value >= 1 && (max === undefined || value <= max) ? value : null;
}

/** Số ngày từ `from` đến `to`, tính cả hai đầu. */
export function daySpan(from: string, to: string) {
  return Math.round((Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / 86_400_000) + 1;
}
