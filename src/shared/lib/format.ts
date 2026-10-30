/** Định dạng số, tiền, ngày giờ theo kiểu Việt Nam, múi giờ của HTX. Dùng chung cho mọi màn quản lý. */

const TZ = "Asia/Ho_Chi_Minh";

const moneyFormat = new Intl.NumberFormat("vi-VN", { maximumFractionDigits: 0 });
const numberFormat = new Intl.NumberFormat("vi-VN", { maximumFractionDigits: 3 });

/** 1250000 → "1.250.000 đ". */
export function money(value: number | null | undefined) {
  return value === null || value === undefined ? "—" : `${moneyFormat.format(value)} đ`;
}

/** Số tiền gọn cho ô thống kê: 1250000 → "1,25 triệu", 1240000000 → "1,24 tỷ". */
export function shortMoney(value: number) {
  const abs = Math.abs(value);
  const fmt = (n: number) => new Intl.NumberFormat("vi-VN", { maximumFractionDigits: 2 }).format(n);
  if (abs >= 1e9) return `${fmt(value / 1e9)} tỷ`;
  if (abs >= 1e6) return `${fmt(value / 1e6)} triệu`;
  return money(value);
}

export function num(value: number | null | undefined, unit?: string) {
  if (value === null || value === undefined) return "—";
  return unit ? `${numberFormat.format(value)} ${unit}` : numberFormat.format(value);
}

/** "2026-10-25" hoặc ISO có giờ → "25/10/2026". Ngày không kèm giờ đọc như ngày lịch, không đổi múi giờ. */
export function date(value: string | null | undefined) {
  if (!value) return "—";
  const plain = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (plain) return `${plain[3]}/${plain[2]}/${plain[1]}`;
  return new Date(value).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric", timeZone: TZ });
}

/** ISO → "06:40 27/10/2026". */
export function dateTime(value: string | null | undefined) {
  if (!value) return "—";
  const d = new Date(value);
  const time = d.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit", hour12: false, timeZone: TZ });
  return `${time} ${date(value)}`;
}

/** Ngày hôm nay theo giờ HTX, dạng "2026-10-28" để gửi API. */
export function todayIso() {
  const parts = new Intl.DateTimeFormat("en-CA", { year: "numeric", month: "2-digit", day: "2-digit", timeZone: TZ }).format(new Date());
  return parts;
}

/** Giá trị cho `<input type="datetime-local">` từ ISO (giờ HTX), và ngược lại thành ISO có múi +07:00. */
export function toLocalInput(value: string | Date = new Date()) {
  const d = new Date(new Date(value).getTime() + 7 * 3600_000);
  return d.toISOString().slice(0, 16);
}

export function fromLocalInput(value: string) {
  return `${value}:00+07:00`;
}

/** Chuỗi người dùng gõ ("1.250.000", "7,8") → số; rỗng hoặc sai → null. */
export function parseNumber(text: string): number | null {
  const cleaned = text.trim().replace(/\s/g, "");
  if (!cleaned) return null;
  // Dấu chấm là phân cách nghìn khi đứng trước đúng 3 chữ số; dấu phẩy là phần thập phân.
  const normalized = cleaned.replace(/\.(?=\d{3}(\D|$))/g, "").replace(",", ".");
  const n = Number(normalized);
  return Number.isFinite(n) ? n : null;
}
