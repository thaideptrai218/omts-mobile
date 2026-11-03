import type { RaftListItem, RaftView, SaveRaft } from "@/features/farming/models/Raft";
import type { WaterDetail, WaterEditingStatus, WaterFilter, WaterListItem, WaterThresholds, WaterValues, ZoneWaterThresholds } from "@/features/farming/models/WaterMeasurement";
import type { SaveZone, ZoneListItem, ZoneLookupItem, ZoneSearchParams, ZoneView } from "@/features/farming/models/Zone";
import type { ZoneLicenses, ZoneLicenseView } from "@/features/farming/models/ZoneLicense";
import type { Paged } from "@/models/Pagination";

import { api } from "@/services/httpClient";

export const USAGE = { inUse: 101, discontinued: 102 } as const;

export function listZones(params: ZoneSearchParams) {
  return api<Paged<ZoneListItem>>(`/api/zones${query(params)}`);
}

export function zoneLookup(includeDiscontinued = false) {
  return api<ZoneLookupItem[]>(`/api/zones/lookup${includeDiscontinued ? "?includeDiscontinued=true" : ""}`);
}

export function getZone(id: string) {
  return api<ZoneView>(`/api/zones/${id}`);
}

export function createZone(body: SaveZone) {
  return api<ZoneView>("/api/zones", { method: "POST", body });
}

export function updateZone(id: string, body: SaveZone) {
  return api<ZoneView>(`/api/zones/${id}`, { method: "PUT", body });
}

export function setZoneInUse(id: string, inUse: boolean, reason: string, rowVersion: string | null) {
  return api<ZoneView>(`/api/zones/${id}/${inUse ? "reactivate" : "discontinue"}`, { method: "POST", body: { reason: reason || null, rowVersion } });
}

export function listRafts(zoneId: string, statusId?: number) {
  return api<RaftListItem[]>(`/api/zones/${zoneId}/rafts${query({ statusId })}`);
}

export function getRaft(id: string) {
  return api<RaftView>(`/api/rafts/${id}`);
}

export function createRaft(zoneId: string, body: SaveRaft) {
  return api<RaftView>(`/api/zones/${zoneId}/rafts`, { method: "POST", body });
}

export function updateRaft(id: string, body: SaveRaft) {
  return api<RaftView>(`/api/rafts/${id}`, { method: "PUT", body });
}

export function setRaftInUse(id: string, inUse: boolean, reason: string, rowVersion: string | null) {
  return api<RaftView>(`/api/rafts/${id}/${inUse ? "reactivate" : "discontinue"}`, { method: "POST", body: { reason: reason || null, rowVersion } });
}

export function zoneLicenses(zoneId: string) {
  return api<ZoneLicenses>(`/api/zones/${zoneId}/licenses`);
}

export function getLicense(id: string) {
  return api<ZoneLicenseView>(`/api/zone-licenses/${id}`);
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

export function listWater(zoneId: string, filter: WaterFilter, page: number) {
  return api<Paged<WaterListItem>>(`/api/zones/${zoneId}/water-measurements${query({ status: filter, page, pageSize: 20 })}`);
}

export function getWater(id: string) {
  return api<WaterDetail>(`/api/water-measurements/${id}`);
}

/** Nhập tay một lần đo. `clientOperationId` chống lưu trùng khi bấm hai lần hoặc gửi lại sau mất mạng. */
export function recordWater(zoneId: string, values: WaterValues, confirm: boolean, clientOperationId: string) {
  return api<WaterDetail>(`/api/zones/${zoneId}/water-measurements`, { method: "POST", body: { ...values, confirm, clientOperationId } });
}

export function confirmWater(id: string, values: WaterValues) {
  return api<WaterDetail>(`/api/water-measurements/${id}/confirm`, { method: "POST", body: values });
}

export function correctWater(id: string, values: WaterValues, reason: string, recordVersion: number) {
  return api<WaterDetail>(`/api/water-measurements/${id}/corrections`, { method: "POST", body: { ...values, reason, recordVersion } });
}

export function voidWater(id: string, reason: string, recordVersion: number) {
  return api<WaterDetail>(`/api/water-measurements/${id}/void`, { method: "POST", body: { reason, recordVersion } });
}

/** Báo đang sửa (khóa mềm): server trả người khác đang sửa cùng bản ghi để hiện MSG58. */
export function startEditingWater(id: string) {
  return api<WaterEditingStatus>(
    `/api/water-measurements/${id}/editing`,
    { method: "POST" },
  );
}

export function stopEditingWater(id: string) {
  return api<void>(`/api/water-measurements/${id}/editing`, { method: "DELETE" });
}

function query(params: Record<string, string | number | boolean | undefined | null>) {
  const parts = Object.entries(params)
    .filter(([, v]) => v !== undefined && v !== null && v !== "")
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`);
  return parts.length ? `?${parts.join("&")}` : "";
}
