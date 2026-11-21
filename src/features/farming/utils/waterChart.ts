import type { WaterChartData, WaterChartPeriod, WaterChartPoint, WaterChartResponse, WaterIndicatorStats, WaterRange } from "@/features/farming/models/WaterMeasurement";

const TZ_OFFSET_MS = 7 * 3600_000;

/** Ngày "YYYY-MM-DD" theo giờ Việt Nam của một thời điểm ISO. */
const localDay = (iso: string) => new Date(new Date(iso).getTime() + TZ_OFFSET_MS).toISOString().slice(0, 10);

function stats(values: number[]): WaterIndicatorStats {
  if (values.length === 0) return { average: null, minimum: null, maximum: null, count: 0 };
  const sum = values.reduce((t, v) => t + v, 0);
  return { average: Math.round((sum / values.length) * 100) / 100, minimum: Math.min(...values), maximum: Math.max(...values), count: values.length };
}

/** Mọi kỳ từ `from` tới `to`: từng ngày "YYYY-MM-DD" hoặc từng tháng "YYYY-MM", kể cả kỳ không có số đo. */
function periodKeys(from: string, to: string, range: WaterRange): string[] {
  const keys: string[] = [];
  if (range === "days") {
    for (let t = Date.parse(from); t <= Date.parse(to); t += 86400000) keys.push(new Date(t).toISOString().slice(0, 10));
    return keys;
  }
  const [toYear, toMonth] = to.split("-").map(Number);
  let [year, month] = from.split("-").map(Number);
  while (year < toYear || (year === toYear && month <= toMonth)) {
    keys.push(`${year}-${String(month).padStart(2, "0")}`);
    month += 1;
    if (month > 12) {
      month = 1;
      year += 1;
    }
  }
  return keys;
}

/**
 * Gom các lần đo thô của backend thành từng ngày hoặc từng tháng (trung bình, thấp nhất, cao nhất). Backend chỉ trả lần đo
 * đang hiệu lực, cũ nhất trước; kỳ không có lần đo nào đánh dấu `missing` để biểu đồ đứt đoạn.
 */
export function groupWaterChart(data: WaterChartResponse, range: WaterRange): WaterChartData {
  const keyOf = (p: WaterChartPoint) => (range === "days" ? localDay(p.measuredAt) : localDay(p.measuredAt).slice(0, 7));
  const groups = new Map<string, WaterChartPoint[]>();
  for (const point of data.points) {
    const key = keyOf(point);
    groups.set(key, [...(groups.get(key) ?? []), point]);
  }
  const periods: WaterChartPeriod[] = periodKeys(data.from, data.to, range).map((period) => {
    const points = groups.get(period) ?? [];
    return {
      period,
      ph: stats(points.map((p) => p.ph)),
      salinity: stats(points.map((p) => p.salinity)),
      temperature: stats(points.map((p) => p.temperature)),
      missing: points.length === 0,
    };
  });
  return { from: data.from, to: data.to, groupBy: range === "days" ? "Day" : "Month", thresholds: data.thresholds, periods };
}
