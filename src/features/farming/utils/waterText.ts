import type { OcrOutcome, WaterIndicator, WaterThresholds, WaterValueOutside } from "@/features/farming/models/WaterMeasurement";
import { num } from "@/utils/format";

export const INDICATOR_NAME: Record<WaterIndicator, string> = {
  PH: "độ pH",
  SALINITY: "độ mặn",
  TEMPERATURE: "nhiệt độ",
};

const UNIT: Record<WaterIndicator, string | undefined> = { PH: undefined, SALINITY: "‰", TEMPERATURE: "°C" };

/** "Độ mặn 35 ‰ cao hơn ngưỡng 30 ‰". */
export function outsideText(v: WaterValueOutside): string {
  const name = INDICATOR_NAME[v.indicator] ?? v.indicator;
  const unit = UNIT[v.indicator];
  const limit = v.direction === "High" ? v.max : v.min;
  return `${name[0].toUpperCase()}${name.slice(1)} ${num(v.value, unit)} ${v.direction === "High" ? "cao hơn" : "thấp hơn"} ngưỡng ${num(limit, unit)}`;
}

/** "pH 6,5 – 8,5" hoặc "chưa đặt". */
export function rangeText(min: number | null | undefined, max: number | null | undefined, unit?: string): string {
  if ((min ?? null) === null && (max ?? null) === null) return "Chưa đặt";
  return `${num(min ?? null)} – ${num(max ?? null, unit)}`;
}

/** Các chỉ số nằm ngoài ngưỡng của vùng, app tự kiểm tra lại sau khi người đo sửa số (WATER-01, MSG-WATER-02). */
export function valuesOutside(t: WaterThresholds | null | undefined, values: { ph: number | null; salinity: number | null; temperature: number | null }): string[] {
  if (!t) return [];
  const check = (value: number | null, min: number | null | undefined, max: number | null | undefined, name: string) =>
    value !== null && ((min !== null && min !== undefined && value < min) || (max !== null && max !== undefined && value > max)) ? [name] : [];
  return [
    ...check(values.ph, t.phMin, t.phMax, "độ pH"),
    ...check(values.salinity, t.salinityMin, t.salinityMax, "độ mặn"),
    ...check(values.temperature, t.temperatureMin, t.temperatureMax, "nhiệt độ"),
  ];
}

/** Câu đầu sheet ghi số đo sau khi đọc ảnh: số là do máy đọc nên người đo phải đối chiếu. */
export function ocrNotice(ocr: OcrOutcome): string {
  if (ocr.status === "Failed") return "Chưa đọc được số từ ảnh. Nhìn máy đo rồi nhập cả ba số vào đây.";
  const unread = ocr.unread.map((u) => INDICATOR_NAME[u] ?? u);
  const uncertain = [ocr.ph?.uncertain && "độ pH", ocr.salinity?.uncertain && "độ mặn", ocr.temperature?.uncertain && "nhiệt độ"].filter(Boolean);
  return [
    "Đây là số máy chủ đọc từ ảnh (bằng Google Gemini), hãy đối chiếu với máy đo trước khi lưu.",
    unread.length > 0 && `Chưa đọc được ${unread.join(", ")}: nhập tay.`,
    uncertain.length > 0 && `Kiểm tra kỹ ${uncertain.join(", ")}: đọc chưa chắc chắn.`,
  ]
    .filter(Boolean)
    .join(" ");
}
