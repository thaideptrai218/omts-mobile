import type { AreaCheck, AreaDraft, BoundaryScanReading, CornerTableReading } from "@/features/farming/models/ZoneBoundary";

import { parseDms } from "@/features/farming/utils/vn2000";
import { areaDraft, cornerDraft, readNumber } from "@/features/farming/utils/zoneBoundary";

/** Kinh tuyến trục hợp lệ cho Việt Nam; ngoài khoảng này là đọc nhầm (ô nhập tay cũng chỉ nhận khoảng này). */
const MERIDIAN_MIN = 102;
const MERIDIAN_MAX = 110;

/** Chuỗi từ máy chủ, hoặc rỗng khi không phải chuỗi (không để kiểu lạ làm hỏng màn hình). */
const text = (value: unknown): string => (typeof value === "string" ? value.trim() : "");

/** Vĩ/kinh độ chép như giấy: bỏ chữ bán cầu ở cuối (N, S, E, W, B, Đ) rồi mới đọc độ-phút-giây hoặc số thập phân. */
function coordinate(value: unknown): number | null {
  const cleaned = text(value).replace(/\s*[NSEWBĐnsewbđ]$/u, "");
  if (!cleaned) return null;
  return parseDms(cleaned) ?? parseDms(cleaned.replace(/°\s*$/u, ""));
}

/**
 * Kết quả quét của máy chủ → dạng `CornerTableReading` mà màn hình đã dùng (đối chiếu từng điểm, bản đồ, lưu). Vĩ/kinh độ máy
 * chủ chép nguyên như giấy (độ-phút-giây hoặc thập phân) nên đọc bằng `parseDms`; chuỗi không đọc được thì bỏ, điểm đó chỉ còn X, Y.
 */
export function toCornerTableReading(scan: BoundaryScanReading): CornerTableReading {
  // Dữ liệu từ máy chủ là biên của hệ thống: thiếu trường nào cũng không được làm hỏng màn hình.
  const meridian = scan.centralMeridian;
  return {
    centralMeridian: typeof meridian === "number" && meridian >= MERIDIAN_MIN && meridian <= MERIDIAN_MAX ? meridian : null,
    areas: (scan.zones ?? []).map((zone, index) => ({
      name: text(zone.name) || `Khu ${index + 1}`,
      writtenAreaHa: typeof zone.writtenAreaHa === "number" ? zone.writtenAreaHa : null,
      corners: (zone.corners ?? []).map((corner) => ({
        label: text(corner.label),
        x: typeof corner.x === "number" ? corner.x : null,
        y: typeof corner.y === "number" ? corner.y : null,
        latitude: coordinate(corner.lat),
        longitude: coordinate(corner.lon),
      })),
    })),
  };
}

/**
 * Diện tích của khu theo công thức dây giày trên X, Y (mét) của các điểm có đủ cả hai, chia 10.000 ra ha, so với diện tích giấy
 * ghi: khớp khi lệch không quá 2% hoặc 0,05 ha (lấy số lớn hơn). Cùng quy tắc với máy chủ nhưng tính lại theo các điểm đang hiển
 * thị, nên đổi theo khi người dùng sửa điểm. Chỉ là cảnh báo, không bao giờ chặn lưu.
 */
export function areaCheck(area: AreaDraft): AreaCheck {
  const points = area.corners
    .map((corner) => ({ x: readNumber(corner.x), y: readNumber(corner.y) }))
    .filter((point): point is { x: number; y: number } => point.x !== null && point.y !== null);
  let twice = 0;
  for (let i = 0; i < points.length; i += 1) {
    const next = points[(i + 1) % points.length];
    twice += points[i].x * next.y - next.x * points[i].y;
  }
  const gridHa = points.length >= 3 ? Math.abs(twice) / 2 / 10000 : null;
  const writtenHa = area.writtenAreaHa;
  const matches = gridHa === null || writtenHa === null ? null : Math.abs(gridHa - writtenHa) <= Math.max(0.02 * writtenHa, 0.05);
  return { gridHa, writtenHa, matches };
}

/**
 * Đưa các khu vừa đọc vào danh sách đang sửa: khu trùng tên (không phân biệt hoa thường) bị thay điểm góc và diện tích giấy ghi,
 * khu mới được thêm vào cuối. Khu không đọc được điểm nào thì bỏ qua.
 */
export function mergeReading(current: AreaDraft[], reading: Pick<CornerTableReading, "areas">): AreaDraft[] {
  const next = [...current];
  for (const area of reading.areas.filter((item) => item.corners.length > 0)) {
    const corners = area.corners.map(cornerDraft);
    const same = next.findIndex((existing) => existing.name.trim().toLowerCase() === area.name.toLowerCase());
    const writtenAreaHa = area.writtenAreaHa ?? null;
    if (same >= 0) next[same] = { ...next[same], corners, writtenAreaHa };
    else next.push(areaDraft(area.name, corners, writtenAreaHa));
  }
  return next;
}
