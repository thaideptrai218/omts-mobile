import type { StatementPeriod, StatementPeriodChoice } from "@/models/Period";
import { todayIso } from "@/utils/format";

/** Kỳ sao kê dài nhất backend nhận (PurchasePeriod.MaxYears), dùng cho công nợ thương lái và nhà cung cấp. */
export const MAX_PERIOD_YEARS = 5;

export const PERIOD_CHOICES: [StatementPeriodChoice, string][] = [
  ["month", "Tháng này"],
  ["lastMonth", "Tháng trước"],
  ["threeMonths", "3 tháng"],
  ["year", "Năm nay"],
  ["custom", "Chọn ngày"],
];

/** Ngày lịch "YYYY-MM-DD"; tháng tính từ 1, tháng hoặc ngày tràn thì tự sang tháng/năm kế bên. */
function isoDate(year: number, month: number, day: number) {
  return new Date(Date.UTC(year, month - 1, day)).toISOString().slice(0, 10);
}

/** Kỳ sao kê của một lựa chọn nhanh, theo ngày hôm nay của HTX. */
export function periodOf(choice: Exclude<StatementPeriodChoice, "custom">): Required<StatementPeriod> {
  const [year, month] = todayIso().split("-").map(Number);
  switch (choice) {
    case "lastMonth":
      return { from: isoDate(year, month - 1, 1), to: isoDate(year, month, 0) };
    case "threeMonths":
      return { from: isoDate(year, month - 2, 1), to: isoDate(year, month + 1, 0) };
    case "year":
      return { from: isoDate(year, 1, 1), to: isoDate(year, 12, 31) };
    default:
      return { from: isoDate(year, month, 1), to: isoDate(year, month + 1, 0) };
  }
}

/** Lỗi của kỳ tự chọn (thiếu ngày, ngược thứ tự, quá dài), hoặc chuỗi rỗng khi hợp lệ. */
export function customPeriodError(from: string, to: string, missing: (field: string) => string): string {
  if (!from || !to) return missing(!from ? "Từ ngày" : "Đến ngày");
  if (from > to) return "Từ ngày phải trước hoặc bằng đến ngày.";
  if (to > `${Number(from.slice(0, 4)) + MAX_PERIOD_YEARS}${from.slice(4)}`) return `Mỗi lần xem sao kê tối đa ${MAX_PERIOD_YEARS} năm.`;
  return "";
}
