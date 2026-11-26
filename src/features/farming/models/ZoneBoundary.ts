import type { Coordinates } from "@/models/Coordinates";

// Ranh giới vùng nuôi lấy từ bảng tọa độ các điểm góc trên sơ đồ cấp phép khu vực biển.

/** Một điểm GeoJSON: [kinh độ, vĩ độ] WGS84. */
export type BoundaryPosition = [number, number];

export type ZoneBoundaryFeature = {
  type: "Feature";
  /** Tên khu ("Khu 1") và tên các điểm góc theo thứ tự trên vòng ranh giới. */
  properties: { name?: string | null; corners?: string[] | null } | null;
  /** Một vòng ngoài, điểm đầu trùng điểm cuối. */
  geometry: { type: "Polygon"; coordinates: BoundaryPosition[][] };
};

/** Ranh giới vùng: GeoJSON FeatureCollection (RFC 7946, WGS84), mỗi khu trên sơ đồ là một Feature. */
export type ZoneBoundary = {
  type: "FeatureCollection";
  features: ZoneBoundaryFeature[];
};

/** Lưu hoặc xóa (`boundary: null`) ranh giới của một vùng. */
export type SaveZoneBoundary = {
  boundary: ZoneBoundary | null;
  rowVersion: string | null;
};

/** Một dòng của bảng tọa độ góc đọc từ ảnh, hệ VN-2000; ô không đọc được là null. */
export type CornerReading = {
  label: string;
  /** Vĩ độ, kinh độ VN-2000 (độ thập phân) từ cột độ, phút, giây. */
  latitude: number | null;
  longitude: number | null;
  /** X (hướng bắc), Y (hướng đông) VN-2000, mét. */
  x: number | null;
  y: number | null;
};

/** Một khu đọc được: tên lấy từ dòng "Tọa độ các điểm góc khu 1" nếu có. */
export type AreaReading = {
  name: string;
  corners: CornerReading[];
  /** Diện tích (ha) ghi ở tiêu đề bảng, khi máy chủ đọc được. */
  writtenAreaHa?: number | null;
};

/** Kết quả đọc ảnh bảng tọa độ góc. */
export type CornerTableReading = {
  text: string;
  confidence: number;
  areas: AreaReading[];
  /** Kinh tuyến trục đọc được ở đầu bảng (độ thập phân), null khi ảnh không có. */
  centralMeridian: number | null;
};

/** Kết quả đọc ảnh sơ đồ cấp phép trên máy chủ: các khu và kinh tuyến trục như bảng đọc trên điện thoại, cộng hai dòng của bảng thông tin. */
export type LicenseMapReading = Pick<CornerTableReading, "areas" | "centralMeridian"> & {
  /** Dòng "Địa điểm", chỉ để gợi ý cho ô Vị trí; null khi không đọc được. */
  location: string | null;
  /** Dòng "Diện tích đề nghị" (ha), chỉ để gợi ý cho ô Diện tích; null khi không đọc được. */
  writtenTotalAreaHa: number | null;
};

/** Điểm góc đang sửa trên màn hình: giữ nguyên chữ người dùng gõ. */
export type CornerDraft = {
  key: string;
  label: string;
  /** Vĩ độ, kinh độ dạng "21°07'06.66"" như trên giấy (hệ VN-2000). */
  latitude: string;
  longitude: string;
  x: string;
  y: string;
};

export type AreaDraft = {
  key: string;
  name: string;
  corners: CornerDraft[];
};

/**
 * Kết quả đối chiếu một điểm: `match` vĩ/kinh độ khớp X, Y; `mismatch` lệch quá 3 m; `dmsOnly` chỉ có vĩ/kinh độ; `gridOnly`
 * chỉ có X, Y (vị trí tính từ X, Y); `missing` chưa đủ số; `outside` nằm ngoài Việt Nam.
 */
export type CornerState = "match" | "mismatch" | "dmsOnly" | "gridOnly" | "missing" | "outside";

export type CornerCheck = {
  state: CornerState;
  /** Vị trí WGS84 dùng để vẽ ranh giới; null khi `missing` hoặc `outside`. */
  position: Coordinates | null;
  /** Khoảng lệch giữa vĩ/kinh độ và X, Y (m) khi có cả hai. */
  gapM: number | null;
};

/** Vị trí một điểm so với ranh giới vùng. */
export type BoundaryPlacement = {
  inside: boolean;
  /** Khoảng cách tới cạnh gần nhất (m), 0 khi nằm trong. */
  distanceM: number;
};
