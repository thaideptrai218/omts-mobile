import type { LicenseState } from "@/features/farming/models/ZoneLicense";

export type ZoneRef = {
  id: string;
  code: string | null;
  name: string | null;
};

export type ZoneListItem = {
  id: string;
  code: string | null;
  name: string | null;
  location: string | null;
  area: number | null;
  statusId: number;
  status: string | null;
  inUseRaftCount: number;
  /** Expired hoặc ExpiringSoon của giấy tờ mới nhất; null khi giấy tờ ổn, vùng chưa có giấy tờ, hoặc người xem là nhân viên. */
  licenseState: LicenseState | null;
};

export type ZoneView = ZoneListItem & {
  latitude: number | null;
  longitude: number | null;
  rowVersion: string | null;
};

/** Kết quả thêm hoặc sửa vùng (FARM-02.0 bước 6). */
export type ZoneSaved = {
  zone: ZoneView;
  message: string;
  messageCode: string;
};

export type ZoneLookupItem = {
  id: string;
  code: string | null;
  name: string | null;
  statusId: number;
  status: string | null;
};

/** Thêm hoặc sửa vùng: mã, tên, vị trí, tọa độ và diện tích (lớn hơn 0) đều bắt buộc. */
export type SaveZone = {
  code: string;
  name: string;
  location: string;
  latitude: number;
  longitude: number;
  area: number;
  rowVersion?: string | null;
};

export type ZoneStatusFilter = "inUse" | "discontinued" | "all";

export type ZoneSearchParams = {
  search?: string;
  statusId?: number;
  page?: number;
  pageSize?: number;
};
