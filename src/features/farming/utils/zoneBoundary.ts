import type { AreaDraft, BoundaryPlacement, BoundaryPosition, CornerCheck, CornerDraft, CornerReading, ZoneBoundary } from "@/features/farming/models/ZoneBoundary";
import type { Coordinates } from "@/models/Coordinates";

import { dmsText, gridDistance, gridToVn2000, parseDms, vn2000ToGrid, vn2000ToWgs84, wgs84ToVn2000 } from "@/features/farming/utils/vn2000";

/** Vĩ/kinh độ và X, Y của một điểm được coi là khớp khi lệch không quá 3 m (số trên giấy làm tròn tới 0,01 giây, khoảng 0,3 m). */
export const MATCH_TOLERANCE_M = 3;

/** Điểm trên cạnh hoặc sát cạnh trong khoảng này vẫn tính là trong vùng (sai số GPS điện thoại vài mét). */
const EDGE_TOLERANCE_M = 1;

let nextKey = 0;
const key = () => `k${(nextKey += 1)}`;

const inVietnam = (point: Coordinates) => point.latitude >= 8 && point.latitude <= 24.5 && point.longitude >= 102 && point.longitude <= 110;

export function readNumber(text: string): number | null {
  const normalized = text.trim().replace(/\s/g, "").replace(",", ".");
  return /^\d+(?:\.\d+)?$/.test(normalized) ? Number(normalized) : null;
}

/** Ô trống cho điểm thêm tay. */
export function emptyCorner(label = ""): CornerDraft {
  return { key: key(), label, latitude: "", longitude: "", x: "", y: "" };
}

export function cornerDraft(reading: CornerReading): CornerDraft {
  return {
    key: key(),
    label: reading.label,
    latitude: reading.latitude === null ? "" : dmsText(reading.latitude),
    longitude: reading.longitude === null ? "" : dmsText(reading.longitude),
    x: reading.x === null ? "" : reading.x.toFixed(2),
    y: reading.y === null ? "" : reading.y.toFixed(2),
  };
}

export function areaDraft(name: string, corners: CornerDraft[], writtenAreaHa: number | null = null): AreaDraft {
  return { key: key(), name, corners, writtenAreaHa };
}

/** Đối chiếu một điểm: ưu tiên vĩ/kinh độ trên giấy, không có thì tính từ X, Y; rồi đổi sang WGS84 để vẽ. */
export function checkCorner(corner: CornerDraft, centralMeridian: number): CornerCheck {
  const latitude = parseDms(corner.latitude);
  const longitude = parseDms(corner.longitude);
  const x = readNumber(corner.x);
  const y = readNumber(corner.y);
  const geographic = latitude !== null && longitude !== null ? { latitude, longitude } : null;
  const projected = x !== null && y !== null ? { x, y } : null;
  const vn2000 = geographic ?? (projected ? gridToVn2000(projected.x, projected.y, centralMeridian) : null);
  if (!vn2000) return { state: "missing", position: null, gapM: null };
  if (!inVietnam(vn2000)) return { state: "outside", position: null, gapM: null };
  const position = vn2000ToWgs84(vn2000);
  if (!geographic) return { state: "gridOnly", position, gapM: null };
  if (!projected) return { state: "dmsOnly", position, gapM: null };
  const gapM = gridDistance(vn2000ToGrid(geographic, centralMeridian), projected);
  return { state: gapM <= MATCH_TOLERANCE_M ? "match" : "mismatch", position, gapM };
}

/** Các điểm WGS84 đã dùng được của một khu, theo thứ tự trên giấy. */
export function areaPositions(area: AreaDraft, centralMeridian: number): { label: string; position: Coordinates }[] {
  return area.corners.reduce<{ label: string; position: Coordinates }[]>((result, corner) => {
    const { position } = checkCorner(corner, centralMeridian);
    if (position) result.push({ label: corner.label.trim(), position });
    return result;
  }, []);
}

const round6 = (value: number) => Math.round(value * 1e6) / 1e6;

/** GeoJSON từ các khu có ít nhất 3 điểm dùng được; null khi chưa khu nào vẽ được. */
export function boundaryOf(areas: AreaDraft[], centralMeridian: number): ZoneBoundary | null {
  const features = areas.reduce<ZoneBoundary["features"]>((result, area) => {
    const corners = areaPositions(area, centralMeridian);
    if (corners.length < 3) return result;
    const ring: BoundaryPosition[] = corners.map(({ position }) => [round6(position.longitude), round6(position.latitude)]);
    ring.push(ring[0]);
    result.push({
      type: "Feature",
      properties: { name: area.name.trim() || null, corners: corners.map(({ label }, index) => label || `Điểm ${index + 1}`) },
      geometry: { type: "Polygon", coordinates: [ring] },
    });
    return result;
  }, []);
  return features.length > 0 ? { type: "FeatureCollection", features } : null;
}

/** Ranh giới đã lưu → các khu để sửa, đổi ngược về VN-2000 để số hiện ra giống trên giấy. */
export function draftsOf(boundary: ZoneBoundary | null | undefined, centralMeridian: number): AreaDraft[] {
  return (boundary?.features ?? []).map((feature, index) => {
    const ring = feature.geometry.coordinates[0] ?? [];
    const open = ring.length > 1 && ring[0][0] === ring[ring.length - 1][0] && ring[0][1] === ring[ring.length - 1][1] ? ring.slice(0, -1) : ring;
    const labels = feature.properties?.corners ?? [];
    return areaDraft(
      feature.properties?.name ?? `Khu ${index + 1}`,
      open.map(([longitude, latitude], corner) => {
        const vn2000 = wgs84ToVn2000({ latitude, longitude });
        const grid = vn2000ToGrid(vn2000, centralMeridian);
        return cornerDraft({ label: labels[corner] ?? "", latitude: vn2000.latitude, longitude: vn2000.longitude, x: grid.x, y: grid.y });
      }),
    );
  });
}

/** Chiếu phẳng quanh một điểm gốc, đơn vị mét; đủ chính xác cho vùng nuôi vài km. */
function planar(origin: Coordinates) {
  const scale = Math.cos((origin.latitude * Math.PI) / 180);
  return ([longitude, latitude]: BoundaryPosition) => ({ x: (longitude - origin.longitude) * 111320 * scale, y: (latitude - origin.latitude) * 110574 });
}

function segmentDistance(p: { x: number; y: number }, a: { x: number; y: number }, b: { x: number; y: number }): number {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const length = dx * dx + dy * dy;
  const t = length === 0 ? 0 : Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.y - a.y) * dy) / length));
  return Math.hypot(p.x - (a.x + t * dx), p.y - (a.y + t * dy));
}

function insideRing(point: Coordinates, ring: BoundaryPosition[]): boolean {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i, i += 1) {
    const [xi, yi] = ring[i];
    const [xj, yj] = ring[j];
    if (yi > point.latitude !== yj > point.latitude && point.longitude < ((xj - xi) * (point.latitude - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}

/** Điểm nằm trong khu nào của ranh giới không, và cách cạnh gần nhất bao xa. Null khi vùng chưa có ranh giới. */
export function placementOf(boundary: ZoneBoundary | null | undefined, point: Coordinates): BoundaryPlacement | null {
  const rings = (boundary?.features ?? []).map((feature) => feature.geometry.coordinates[0] ?? []).filter((ring) => ring.length >= 3);
  if (rings.length === 0) return null;
  const project = planar(point);
  let distanceM = Infinity;
  for (const ring of rings) {
    if (insideRing(point, ring)) return { inside: true, distanceM: 0 };
    const flat = ring.map(project);
    for (let i = 0; i < flat.length; i += 1) distanceM = Math.min(distanceM, segmentDistance({ x: 0, y: 0 }, flat[i], flat[(i + 1) % flat.length]));
  }
  return distanceM <= EDGE_TOLERANCE_M ? { inside: true, distanceM: 0 } : { inside: false, distanceM };
}

/** Diện tích (ha) bên trong các điểm theo thứ tự, công thức shoelace trên mặt phẳng chiếu. */
export function ringAreaHa(points: Coordinates[]): number {
  if (points.length < 3) return 0;
  const project = planar(points[0]);
  const flat = points.map((point) => project([point.longitude, point.latitude]));
  let twice = 0;
  for (let i = 0; i < flat.length; i += 1) {
    const next = flat[(i + 1) % flat.length];
    twice += flat[i].x * next.y - next.x * flat[i].y;
  }
  return Math.abs(twice) / 2 / 10000;
}

function crosses(a: { x: number; y: number }, b: { x: number; y: number }, c: { x: number; y: number }, d: { x: number; y: number }): boolean {
  const side = (p: { x: number; y: number }, q: { x: number; y: number }, r: { x: number; y: number }) => Math.sign((q.x - p.x) * (r.y - p.y) - (q.y - p.y) * (r.x - p.x));
  return side(a, b, c) * side(a, b, d) < 0 && side(c, d, a) * side(c, d, b) < 0;
}

/** Đường ranh giới tự cắt nhau: thường do sai thứ tự điểm hoặc một điểm đọc sai. */
export function selfIntersects(points: Coordinates[]): boolean {
  if (points.length < 4) return false;
  const project = planar(points[0]);
  const flat = points.map((point) => project([point.longitude, point.latitude]));
  const count = flat.length;
  for (let i = 0; i < count; i += 1) {
    for (let j = i + 2; j < count; j += 1) {
      if (i === 0 && j === count - 1) continue;
      if (crosses(flat[i], flat[(i + 1) % count], flat[j], flat[(j + 1) % count])) return true;
    }
  }
  return false;
}

const median = (values: number[]) => {
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2;
};

/**
 * Điểm chưa khớp X, Y mà nằm xa bất thường so với các điểm khác của khu (quá 4 lần khoảng cách trung vị và quá 800 m):
 * thường là một chữ số của độ hoặc phút bị đọc sai. Trả khoảng cách (m) tới tâm khu theo khóa của điểm.
 */
export function strayCorners(area: AreaDraft, centralMeridian: number): Map<string, number> {
  const placed = area.corners.reduce<{ key: string; position: Coordinates; matched: boolean }[]>((result, corner) => {
    const check = checkCorner(corner, centralMeridian);
    if (check.position) result.push({ key: corner.key, position: check.position, matched: check.state === "match" });
    return result;
  }, []);
  const stray = new Map<string, number>();
  if (placed.length < 3) return stray;
  const center = { latitude: median(placed.map((item) => item.position.latitude)), longitude: median(placed.map((item) => item.position.longitude)) };
  const project = planar(center);
  const distances = placed.map((item) => {
    const point = project([item.position.longitude, item.position.latitude]);
    return Math.hypot(point.x, point.y);
  });
  const typical = median(distances);
  placed.forEach((item, index) => {
    if (!item.matched && distances[index] > Math.max(800, 4 * typical)) stray.set(item.key, distances[index]);
  });
  return stray;
}
