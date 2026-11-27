// Đọc ảnh sơ đồ cấp phép trên máy chủ: `POST api/zones/boundary-scans` rồi hỏi lại `GET api/zones/boundary-scans/{scanId}`.

export type ZoneMapScanStarted = {
  scanId: string;
};

/** Một điểm góc như máy chủ đọc: X (hướng bắc), Y (hướng đông) VN-2000 tính bằng mét; vĩ/kinh độ chép nguyên văn nếu bảng có cột này. */
export type ZoneMapScanCorner = {
  label: string | null;
  x: number | null;
  y: number | null;
  lat: string | null;
  lon: string | null;
};

export type ZoneMapScanArea = {
  name: string | null;
  writtenAreaHa: number | null;
  gridAreaHa: number | null;
  /** Diện tích tính từ X, Y có khớp diện tích ghi trên giấy không; null khi thiếu một trong hai. */
  areaMatches: boolean | null;
  corners: ZoneMapScanCorner[];
};

export type ZoneMapScanReading = {
  centralMeridian: number | null;
  coordinateSystem: string | null;
  location: string | null;
  writtenTotalAreaHa: number | null;
  zones: ZoneMapScanArea[];
};

export type ZoneMapScanStatus = "Pending" | "Done" | "Failed";

export type ZoneMapScan = {
  status: ZoneMapScanStatus;
  /** UNAVAILABLE, TIMEOUT, BAD_RESPONSE hoặc NOT_CONFIGURED khi `status` là Failed. */
  errorCode: string | null;
  reading: ZoneMapScanReading | null;
};
