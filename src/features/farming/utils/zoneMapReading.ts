import type { CornerReading, LicenseMapReading } from "@/features/farming/models/ZoneBoundary";
import type { ZoneMapScanCorner, ZoneMapScanReading } from "@/features/farming/models/ZoneMapScan";

import { parseDms } from "@/features/farming/utils/vn2000";

const round2 = (value: number) => Math.round(value * 100) / 100;

/** Vĩ/kinh độ chép nguyên văn từ bảng ("21°07'06.66"" hoặc số thập phân); không hiểu được thì bỏ trống, X, Y vẫn đủ để tính. */
const angle = (text: string | null) => (text ? parseDms(text) : null);

const cornerOf = (corner: ZoneMapScanCorner): CornerReading => ({
  label: corner.label?.trim() ?? "",
  latitude: angle(corner.lat),
  longitude: angle(corner.lon),
  x: corner.x,
  y: corner.y,
});

/** Kết quả máy chủ → dạng dùng chung với bảng đọc trên điện thoại, để đưa vào cùng bước đối chiếu điểm góc. */
export function licenseMapReading(scan: ZoneMapScanReading): LicenseMapReading {
  return {
    centralMeridian: scan.centralMeridian,
    location: scan.location?.trim() || null,
    writtenTotalAreaHa: scan.writtenTotalAreaHa,
    areas: scan.zones.map((zone, index) => ({
      name: zone.name?.trim() || `Khu ${index + 1}`,
      writtenAreaHa: zone.writtenAreaHa,
      corners: zone.corners.map(cornerOf),
    })),
  };
}

/** Diện tích gợi ý cho vùng: dòng "Diện tích đề nghị", không có thì tổng diện tích ghi của từng khu; null khi giấy không ghi. */
export function suggestedAreaHa(reading: LicenseMapReading): number | null {
  if (reading.writtenTotalAreaHa !== null && reading.writtenTotalAreaHa > 0) return round2(reading.writtenTotalAreaHa);
  const written = reading.areas.map((area) => area.writtenAreaHa ?? null).filter((value): value is number => value !== null && value > 0);
  return written.length > 0 ? round2(written.reduce((sum, value) => sum + value, 0)) : null;
}
