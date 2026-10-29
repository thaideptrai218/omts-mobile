import { api } from "@/services/api/http";

/**
 * Vùng nuôi, bè, giấy tờ pháp lý và chỉ số nước (OMTS.Api: `api/zones`, `api/rafts`, `api/zone-licenses`,
 * `api/water-thresholds`, `api/water-measurements`). Tên trường theo JSON server trả.
 */

export type Paged<T> = { items: T[]; page: number; pageSize: number; total: number };

export type LicenseState = "Valid" | "ExpiringSoon" | "Expired" | "NotYetEffective" | "Superseded" | "Missing";

export type ZoneRef = { id: string; code: string | null; name: string | null };

export type ZoneListItem = {
  id: string;
  code: string | null;
  name: string | null;
  location: string | null;
  area: number | null;
  statusId: number;
  status: string | null;
  inUseRaftCount: number;
  licenseState: LicenseState;
};

export type ZoneView = ZoneListItem & {
  latitude: number | null;
  longitude: number | null;
  waterMeasurementPoint: string | null;
  rowVersion: string | null;
};

export type ZoneLookupItem = { id: string; code: string | null; name: string | null; statusId: number; status: string | null };

export type SaveZone = {
  code: string;
  name: string;
  location: string | null;
  latitude: number | null;
  longitude: number | null;
  area: number | null;
  waterMeasurementPoint: string | null;
  rowVersion?: string | null;
};

export const USAGE = { inUse: 101, discontinued: 102 } as const;

export function listZones(params: { search?: string; statusId?: number; page?: number; pageSize?: number }) {
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

// Bè

export type Lane = { id?: string; laneNumber: number; length: number | null; markerA: string | null; markerB: string | null };

export type RaftListItem = {
  id: string;
  zoneId: string;
  code: string | null;
  latitude: number | null;
  longitude: number | null;
  size: string | null;
  laneCount: number;
  statusId: number;
  status: string | null;
};

export type RaftView = {
  id: string;
  zone: ZoneRef;
  code: string | null;
  latitude: number | null;
  longitude: number | null;
  location: string | null;
  size: string | null;
  conditionNotes: string | null;
  photoUrl: string | null;
  statusId: number;
  status: string | null;
  layoutVersion: number;
  lanes: Lane[];
  layoutDrawing: unknown;
  layoutVersions: { versionNumber: number; laneCount: number; validFrom: string; validTo: string | null }[];
  materialCost: number | null;
  rowVersion: string | null;
};

export type SaveRaft = {
  code: string;
  latitude: number | null;
  longitude: number | null;
  location: string | null;
  size: string | null;
  conditionNotes: string | null;
  lanes: Lane[];
  layoutDrawing?: unknown;
  rowVersion?: string | null;
};

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

// Giấy tờ pháp lý

export type ZoneLicenseRow = {
  documentType: string | null;
  documentTypeName: string | null;
  state: LicenseState;
  documentId: string | null;
  documentNumber: string | null;
  effectiveDate: string | null;
  expiryDate: string | null;
  isReplaced: boolean;
};

export type ZoneLicenseView = {
  id: string;
  documentType: string | null;
  documentTypeName: string | null;
  documentNumber: string | null;
  effectiveDate: string | null;
  expiryDate: string | null;
  issuingAuthority: string | null;
  holder: string | null;
  legalScope: string | null;
  asOf: string;
  state: LicenseState;
  zones: ZoneRef[];
  replacesDocumentId: string | null;
  replacedByDocumentId: string | null;
  fileUrl: string | null;
};

export function zoneLicenses(zoneId: string) {
  return api<{ zoneId: string; asOf: string; licenses: ZoneLicenseRow[] }>(`/api/zones/${zoneId}/licenses`);
}

export function getLicense(id: string) {
  return api<ZoneLicenseView>(`/api/zone-licenses/${id}`);
}

// Chỉ số nước

export type WaterThresholds = { phMin: number | null; phMax: number | null; salinityMin: number | null; salinityMax: number | null };

export type ZoneWaterThresholds = { zoneId: string; zoneCode: string | null; zoneName: string | null; zoneStatus: string | null; thresholds: WaterThresholds };

export type AlertState = "None" | "Active" | "Corrected" | "Voided";

export type AccountRef = { id: string; name: string | null } | null;

export type WaterListItem = {
  id: string;
  measuredAt: string;
  ph: number | null;
  salinity: number | null;
  measurementPoint: string | null;
  status: string | null;
  statusCode: string | null;
  inputSource: "Ocr" | "Manual";
  alertState: AlertState;
  violatedValues: string | null;
  measuredBy: AccountRef;
  confirmedBy: AccountRef;
  recordVersion: number;
  hasPhoto: boolean;
};

export type WaterDetail = {
  id: string;
  zoneId: string;
  zoneCode: string | null;
  zoneName: string | null;
  measurementPoint: string | null;
  measuredAt: string;
  ph: number | null;
  salinity: number | null;
  status: string | null;
  statusCode: string | null;
  inputSource: "Ocr" | "Manual";
  photoUrl: string | null;
  thresholdsUsed: WaterThresholds | null;
  alertState: AlertState;
  thresholdExceeded: boolean;
  violatedValues: string | null;
  measuredBy: AccountRef;
  confirmedBy: AccountRef;
  confirmedAt: string | null;
  recordVersion: number;
  correctionReason: string | null;
  voidReason: string | null;
  isLatestVersion: boolean;
  versions: {
    id: string;
    recordVersion: number;
    statusCode: string | null;
    measuredAt: string;
    ph: number | null;
    salinity: number | null;
    alertState: AlertState;
    correctionReason: string | null;
    voidReason: string | null;
    createdAt: string;
  }[];
  currentEditors: { accountId: string; name: string | null; startedAt: string }[];
};

export type WaterValues = { measuredAt: string; ph: number | null; salinity: number | null };

export type WaterFilter = "All" | "Draft" | "Confirmed" | "Voided";

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
  return api<{ otherEditors: { name: string | null; startedAt: string }[]; notice: { code: string | null; text: string | null } | null }>(
    `/api/water-measurements/${id}/editing`,
    { method: "POST" },
  );
}

export function stopEditingWater(id: string) {
  return api<void>(`/api/water-measurements/${id}/editing`, { method: "DELETE" });
}

/** Mã thao tác ngẫu nhiên dạng UUID v4 (webview cũ có thể chưa có `crypto.randomUUID`). */
export function newOperationId() {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

function query(params: Record<string, string | number | boolean | undefined | null>) {
  const parts = Object.entries(params)
    .filter(([, v]) => v !== undefined && v !== null && v !== "")
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`);
  return parts.length ? `?${parts.join("&")}` : "";
}
