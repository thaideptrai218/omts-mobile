import type { FarmingWarning } from "@/features/farming/models/FarmingWarning";
import type { ZoneRef } from "@/features/farming/models/Zone";

// Bè (FARM-04). Một bè chỉ còn số hàng: không lưu chiều dài, mốc hay sơ đồ từng hàng.

/** Một hàng của bè: Đang dùng hoặc Đã gỡ (hàng gỡ khỏi cuối bè giữ số và dữ liệu cũ, BR-FARM-04). */
export type LaneView = {
  id: string;
  laneNumber: number;
  statusId: number;
  status: string;
};

/** Ảnh bè, tối đa ba ảnh theo thứ tự; `url` là đường dẫn đọc có hạn, không lưu lại. */
export type RaftPhoto = {
  id: string;
  sortOrder: number;
  url: string;
};

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
  photos: RaftPhoto[];
  statusId: number;
  status: string | null;
  /** Số hàng đang dùng. */
  laneCount: number;
  /** Mọi hàng theo số, kể cả hàng đã gỡ. */
  lanes: LaneView[];
  /** Tiền vật tư đã dùng trên bè, theo giá mua gần nhất của từng vật tư (BR-FARM-05). */
  materialCost: number | null;
  rowVersion: string | null;
};

/** Kết quả thêm, sửa bè hoặc đổi ảnh bè (FARM-04.0 bước 6). */
export type RaftSaved = {
  raft: RaftView;
  message: string;
  messageCode: string;
  /** Lưu ý không chặn lưu, ví dụ bè xa vùng hơn 5 km hoặc nằm ngoài ranh giới vùng. */
  warnings?: FarmingWarning[] | null;
};

/**
 * Thêm hoặc sửa bè. Mã, kích thước và số hàng (1 đến 200) bắt buộc; tọa độ không bắt buộc nhưng phải có cả hai. Sửa số hàng thì
 * backend gỡ các hàng cuối hoặc dùng lại hàng đã gỡ.
 */
export type SaveRaft = {
  code: string;
  latitude: number | null;
  longitude: number | null;
  location: string | null;
  size: string;
  conditionNotes: string | null;
  laneCount: number;
  rowVersion?: string | null;
};
