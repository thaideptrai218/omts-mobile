import type { RaftListItem, RaftSaved, RaftView, SaveRaft } from "@/features/farming/models/Raft";
import type {
  CorrectWater,
  RecordWater,
  WaterChartData,
  WaterChartResponse,
  WaterDateRange,
  WaterDetail,
  WaterFilter,
  WaterHistoryPage,
  WaterRange,
  WaterCrop,
  WaterRecognition,
  WaterThresholds,
  WaterZoneOverviewItem,
  ZoneWaterThresholds,
} from "@/features/farming/models/WaterMeasurement";
import type { SaveZone, ZoneListItem, ZoneLookupItem, ZoneSaved, ZoneSearchParams, ZoneView } from "@/features/farming/models/Zone";
import type { SaveZoneBoundary } from "@/features/farming/models/ZoneBoundary";
import type { SaveLicense, ZoneLicenses, ZoneLicenseView } from "@/features/farming/models/ZoneLicense";
import type { Paged } from "@/models/Pagination";

import { api } from "@/services/httpClient";
import { todayIso } from "@/utils/format";
import { appendPhoto } from "@/utils/imageFile";
import { groupWaterChart } from "@/features/farming/utils/waterChart";

export const USAGE = { inUse: 101, discontinued: 102 } as const;

export function listZones(params: ZoneSearchParams) {
  return api<Paged<ZoneListItem>>(`/api/zones${query(params)}`);
}

/** Vùng đang dùng, để chọn ở mọi màn ngoài danh sách vùng: vùng ngừng dùng chỉ hiện ở màn Vùng nuôi. */
export function zoneLookup() {
  return api<ZoneLookupItem[]>("/api/zones/lookup");
}

export function getZone(id: string) {
  return api<ZoneView>(`/api/zones/${id}`);
}

export function createZone(body: SaveZone) {
  return api<ZoneSaved>("/api/zones", { method: "POST", body });
}

export function updateZone(id: string, body: SaveZone) {
  return api<ZoneSaved>(`/api/zones/${id}`, { method: "PUT", body });
}

export function setZoneInUse(id: string, inUse: boolean, reason: string, rowVersion: string | null) {
  return api<ZoneView>(`/api/zones/${id}/${inUse ? "reactivate" : "discontinue"}`, { method: "POST", body: { reason: reason || null, rowVersion } });
}

/**
 * Lưu ranh giới vùng (GeoJSON WGS84) đọc từ bảng tọa độ góc của sơ đồ cấp phép; `boundary: null` xóa ranh giới. Bè đang dùng
 * nằm ngoài ranh giới mới được báo trong `warnings` (RAFTS_OUTSIDE_ZONE_BOUNDARY), không chặn lưu.
 */
export function saveZoneBoundary(id: string, body: SaveZoneBoundary) {
  return api<ZoneSaved>(`/api/zones/${id}/boundary`, { method: "PUT", body });
}

export function listRafts(zoneId: string, statusId?: number) {
  return api<RaftListItem[]>(`/api/zones/${zoneId}/rafts${query({ statusId })}`);
}

export function getRaft(id: string) {
  return api<RaftView>(`/api/rafts/${id}`);
}

export function createRaft(zoneId: string, body: SaveRaft) {
  return api<RaftSaved>(`/api/zones/${zoneId}/rafts`, { method: "POST", body });
}

export function updateRaft(id: string, body: SaveRaft) {
  return api<RaftSaved>(`/api/rafts/${id}`, { method: "PUT", body });
}

/** Thêm một ảnh bè (tối đa ba ảnh, chỉ Chủ HTX). Mỗi lần gửi một ảnh, trường `file`. */
export function addRaftPhoto(id: string, photo: Blob) {
  const form = new FormData();
  appendPhoto(form, "file", photo);
  return api<RaftSaved>(`/api/rafts/${id}/photos`, { method: "POST", form });
}

/** Xóa một ảnh bè (chỉ Chủ HTX). */
export function removeRaftPhoto(id: string, photoId: string) {
  return api<RaftSaved>(`/api/rafts/${id}/photos/${photoId}`, { method: "DELETE" });
}

export function setRaftInUse(id: string, inUse: boolean, reason: string, rowVersion: string | null) {
  return api<RaftView>(`/api/rafts/${id}/${inUse ? "resume" : "discontinue"}`, { method: "POST", body: { reason: reason || null, rowVersion } });
}

export function zoneLicenses(zoneId: string) {
  return api<ZoneLicenses>(`/api/zones/${zoneId}/licenses`);
}

export function getLicense(id: string) {
  return api<ZoneLicenseView>(`/api/zone-licenses/${id}`);
}

export function createLicense(values: SaveLicense, file: Blob | null) {
  return api<ZoneLicenseView>("/api/zone-licenses", { method: "POST", form: licenseForm(values, file) });
}

export function updateLicense(id: string, values: SaveLicense, file: Blob | null) {
  return api<ZoneLicenseView>(`/api/zone-licenses/${id}`, { method: "PUT", form: licenseForm(values, file) });
}

export function replaceLicense(id: string, values: SaveLicense, file: Blob | null) {
  return api<ZoneLicenseView>(`/api/zone-licenses/${id}/replace`, { method: "POST", form: licenseForm(values, file) });
}

/** Mỗi trường một ô form, trường bỏ trống thì không gửi; giấy tờ gắn một vùng (`zoneId`). */
function licenseForm(fields: SaveLicense, file: Blob | null) {
  const form = new FormData();
  Object.entries(fields).forEach(([name, value]) => {
    if (value) form.append(name, value);
  });
  if (file) appendPhoto(form, "file", file);
  return form;
}

export function cooperativeThresholds() {
  return api<ZoneWaterThresholds[]>("/api/water-thresholds");
}

export function zoneThresholds(zoneId: string) {
  return api<ZoneWaterThresholds>(`/api/zones/${zoneId}/water-thresholds`);
}

export function setZoneThresholds(zoneId: string, body: WaterThresholds) {
  return api<ZoneWaterThresholds>(`/api/zones/${zoneId}/water-thresholds`, { method: "PUT", body });
}

/** Lịch sử số đo của vùng, mới nhất trước. Không truyền khoảng ngày thì backend trả 3 tháng gần nhất. */
export function listWater(zoneId: string, filter: WaterFilter, page: number, range: WaterDateRange | null = null) {
  return api<WaterHistoryPage>(`/api/zones/${zoneId}/water-measurements${query({ status: filter, from: range?.from, to: range?.to, page, pageSize: 20 })}`);
}

/**
 * Biểu đồ của vùng: backend trả từng lần đo đang hiệu lực, app gom theo ngày (30 ngày gần nhất) hoặc theo tháng (12 tháng
 * gần nhất, tính cả tháng này).
 */
export async function waterChart(zoneId: string, range: WaterRange): Promise<WaterChartData> {
  const to = todayIso();
  const [y, m] = to.split("-").map(Number);
  const from =
    range === "days"
      ? new Date(Date.parse(to) - 29 * 86400000).toISOString().slice(0, 10)
      : new Date(Date.UTC(y, m - 12, 1)).toISOString().slice(0, 10);
  const data = await api<WaterChartResponse>(`/api/zones/${zoneId}/water-measurements/chart${query({ from, to })}`);
  return groupWaterChart(data, range);
}

export function getWater(id: string) {
  return api<WaterDetail>(`/api/water-measurements/${id}`);
}

/**
 * Gửi ảnh máy đo: backend lưu cả ảnh và đọc số gợi ý (chỉ trong khung màn hình nếu người đo đã chọn), chưa lưu số đo nào.
 * Đọc không được vẫn trả `photoKey` để nhập tay.
 */
export function recognizeWater(zoneId: string, photo: Blob, crop: WaterCrop | null) {
  const form = new FormData();
  appendPhoto(form, "photo", photo);
  // Dạng "trái,trên,phải,dưới" với dấu chấm thập phân, như backend đọc.
  if (crop) form.append("crop", [crop.left, crop.top, crop.right, crop.bottom].map((v) => v.toFixed(4)).join(","));
  return api<WaterRecognition>(`/api/zones/${zoneId}/water-measurements/recognize`, { method: "POST", form });
}

/** Ghi lần đo người đo đã kiểm tra. Gửi lại cùng `clientOperationId` thì backend trả bản đã lưu, không ghi trùng. */
export function recordWater(zoneId: string, body: RecordWater) {
  return api<WaterDetail>(`/api/zones/${zoneId}/water-measurements`, { method: "POST", body });
}

/** Sửa tại chỗ một lần đo đang hiệu lực, kèm lý do; ngưỡng đã lưu theo lần đo không đổi. */
export function correctWater(id: string, body: CorrectWater) {
  return api<WaterDetail>(`/api/water-measurements/${id}/corrections`, { method: "POST", body });
}

/** Hủy một lần đo đang hiệu lực, kèm lý do. Không hoàn tác được. */
export function voidWater(id: string, reason: string) {
  return api<WaterDetail>(`/api/water-measurements/${id}/void`, { method: "POST", body: { reason } });
}

/** Tổng quan nước theo vùng: lần đo mới nhất và cảnh báo. Chỉ Chủ HTX và Quản lý vùng; người khác nhận 403. */
export function waterOverview(inUseOnly = false) {
  return api<WaterZoneOverviewItem[]>(`/api/water-measurements/zones${inUseOnly ? "?inUseOnly=true" : ""}`);
}

function query(params: Record<string, string | number | boolean | undefined | null>) {
  const parts = Object.entries(params)
    .filter(([, v]) => v !== undefined && v !== null && v !== "")
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`);
  return parts.length ? `?${parts.join("&")}` : "";
}
