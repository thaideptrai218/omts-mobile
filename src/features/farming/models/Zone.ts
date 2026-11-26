import type { FarmingWarning } from "@/features/farming/models/FarmingWarning";
import type { ZoneBoundary } from "@/features/farming/models/ZoneBoundary";
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
  /** Ranh giới vùng theo sơ đồ cấp phép; null khi chưa nhập. */
  boundary: ZoneBoundary | null;
  rowVersion: string | null;
};

/** Kết quả thêm hoặc sửa vùng (FARM-02.0 bước 6). */
export type ZoneSaved = {
  zone: ZoneView;
  message: string;
  messageCode: string;
  /** Lưu ý không chặn lưu, ví dụ ghim ngoài Việt Nam hoặc bè nằm ngoài ranh giới mới. */
  warnings?: FarmingWarning[] | null;
};

export type ZoneLookupItem = {
  id: string;
  code: string | null;
  name: string | null;
  statusId: number;
  status: string | null;
};

/**
 * Thêm hoặc sửa vùng: chỉ mã và tên bắt buộc; vị trí (chữ) và diện tích (lớn hơn 0) có thể bỏ trống. Không gửi ghim: vùng có
 * ranh giới thì máy chủ lấy tâm ranh giới làm ghim.
 */
export type SaveZone = {
  code: string;
  name: string;
  location: string | null;
  area: number | null;
  rowVersion?: string | null;
};

export type ZoneStatusFilter = "inUse" | "discontinued" | "all";

export type ZoneSearchParams = {
  search?: string;
  statusId?: number;
  page?: number;
  pageSize?: number;
};
