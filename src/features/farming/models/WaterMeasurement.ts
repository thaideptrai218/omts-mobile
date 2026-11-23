/*
 * Chỉ số nước (WATER-01 đến WATER-04) theo backend SRS 27/10 (OMTS-219): mỗi lần đo gắn một bè, có pH, độ mặn, nhiệt độ và
 * ảnh máy đo bắt buộc. Lưu là ghi chính thức (Active); sửa và hủy làm tại chỗ kèm lý do. Không còn bản nháp, xác nhận hay
 * phiên bản.
 */

/** Ngưỡng của từng chỉ số; để trống thì không kiểm tra (BR-WATER-04). */
export type WaterThresholds = {
  phMin: number | null;
  phMax: number | null;
  salinityMin: number | null;
  salinityMax: number | null;
  temperatureMin?: number | null;
  temperatureMax?: number | null;
};

export type ZoneWaterThresholds = {
  zoneId: string;
  zoneCode: string | null;
  zoneName: string | null;
  zoneStatus: string | null;
  thresholds: WaterThresholds;
};

/** Cảnh báo của một lần đo: Active = đang vượt ngưỡng, Voided = vượt ngưỡng nhưng đã hủy. */
export type AlertState = "None" | "Active" | "Voided";

export type AccountRef = {
  id: string;
  name: string | null;
} | null;

/** Mã chỉ số trong `WaterValueOutside` và `unread` của OCR. */
export type WaterIndicator = "PH" | "SALINITY" | "TEMPERATURE";

/** Một giá trị nằm ngoài ngưỡng, kèm khoảng cho phép. */
export type WaterValueOutside = {
  indicator: WaterIndicator;
  value: number;
  unit: string | null;
  direction: "High" | "Low";
  min: number | null;
  max: number | null;
};

export type WaterStatusCode = "ACTIVE" | "VOIDED";

export type WaterListItem = {
  id: string;
  measuredAt: string;
  raftId: string;
  raftCode: string;
  ph: number;
  salinity: number;
  temperature: number;
  status: string;
  statusCode: WaterStatusCode;
  alertState: AlertState;
  violatedValues: string | null;
  measuredBy: AccountRef;
  thresholdsUsed: WaterThresholds;
  valuesOutside: WaterValueOutside[];
  voidReason: string | null;
};

/** Một trang lịch sử và khoảng ngày nó bao (mặc định 3 tháng gần nhất). */
export type WaterHistoryPage = {
  items: WaterListItem[];
  page: number;
  pageSize: number;
  total: number;
  from: string;
  to: string;
  message: string | null;
  messageCode: string | null;
};

export type WaterDetail = {
  id: string;
  zoneId: string;
  zoneCode: string;
  zoneName: string;
  raftId: string;
  raftCode: string;
  measuredAt: string;
  ph: number;
  salinity: number;
  temperature: number;
  status: string;
  statusCode: WaterStatusCode;
  /** Địa chỉ ảnh máy đo, dùng được trong thời gian ngắn. */
  photoUrl: string;
  thresholdsUsed: WaterThresholds;
  alertState: AlertState;
  thresholdExceeded: boolean;
  violatedValues: string | null;
  alertedAt: string | null;
  measuredBy: AccountRef;
  voidReason: string | null;
};

/** Giá trị gửi lên khi ghi hoặc sửa: mọi số đều bắt buộc. */
export type WaterValues = {
  raftId: string;
  measuredAt: string;
  ph: number;
  salinity: number;
  temperature: number;
};

/** Ghi một lần đo (WATER-01 bước 9-10). `photoKey` lấy từ bước đọc ảnh; `clientOperationId` chống ghi trùng khi gửi lại. */
export type RecordWater = WaterValues & {
  photoKey: string;
  clientOperationId: string;
};

/** Sửa tại chỗ một lần đo đang hiệu lực, kèm lý do (WATER-02). */
export type CorrectWater = WaterValues & {
  reason: string;
};

export type WaterFilter = "All" | "Active" | "Voided";

export type OcrField<T> = {
  value: T;
  confidence: number;
  uncertain: boolean;
};

export type UserMessage = {
  code: string;
  text: string;
};

/** Số app đọc được từ ảnh máy đo, chỉ là gợi ý. `unread` là các chỉ số chưa đọc được (MSG-WATER-01). */
export type OcrOutcome = {
  status: "Success" | "Failed";
  ph: OcrField<number> | null;
  salinity: OcrField<number> | null;
  temperature: OcrField<number> | null;
  measuredAt: OcrField<string> | null;
  unread: WaterIndicator[];
  warning: UserMessage | null;
};

/** Kết quả đọc ảnh (WATER-01 bước 5-6): ảnh đã lưu (`photoKey`) và số gợi ý; chưa có số đo nào được lưu. */
export type WaterRecognition = {
  photoKey: string;
  measuredAt: string;
  ocr: OcrOutcome;
  valuesOutside: WaterValueOutside[];
  thresholdWarning: UserMessage | null;
};

/**
 * Phần ảnh có màn hình số của máy đo, người đo kéo khung chọn (tỉ lệ 0…1 theo chiều ngang và dọc của ảnh). Backend chỉ
 * đọc số trong khung này; ảnh lưu làm bằng chứng vẫn là cả ảnh.
 */
export type WaterCrop = {
  left: number;
  top: number;
  right: number;
  bottom: number;
};

/** Ảnh (và khung màn hình, nếu có) của một lần gửi đọc ảnh, giữ lại để gửi lại đúng như vậy sau lỗi mạng. */
export type WaterPhotoAttempt = {
  zoneId: string;
  photo: Blob;
  crop: WaterCrop | null;
};

/** Số đo đang ghi, sau khi đã đọc ảnh: người đo kiểm tra và sửa số rồi lưu. */
export type WaterDraft = {
  zoneId: string;
  recognition: WaterRecognition;
};

/** Một vùng trên tổng quan nước: lần đo mới nhất và cảnh báo (WATER-03 bước 1; Chủ HTX và Quản lý vùng). */
export type WaterZoneOverviewItem = {
  zoneId: string;
  zoneCode: string;
  zoneName: string;
  zoneStatus: string;
  zoneStatusCode: string;
  latestMeasuredAt: string | null;
  hasWaterAlert: boolean;
  valuesOutside: WaterValueOutside[];
};

/** Một lần đo trên biểu đồ (số thô, chỉ lần đo đang hiệu lực). */
export type WaterChartPoint = {
  id: string;
  measuredAt: string;
  ph: number;
  salinity: number;
  temperature: number;
};

/** Biểu đồ của backend: các lần đo trong kỳ, cũ nhất trước, cùng ngưỡng hiện tại. App tự gom theo ngày hoặc tháng. */
export type WaterChartResponse = {
  zoneId: string;
  from: string;
  to: string;
  thresholds: WaterThresholds;
  points: WaterChartPoint[];
};

export type WaterIndicatorStats = {
  average: number | null;
  minimum: number | null;
  maximum: number | null;
  count: number;
};

export type WaterChartPeriod = {
  period: string;
  ph: WaterIndicatorStats;
  salinity: WaterIndicatorStats;
  temperature: WaterIndicatorStats;
  missing: boolean;
};

/** Dữ liệu biểu đồ đã gom theo ngày (30 ngày) hoặc theo tháng (12 tháng). */
export type WaterChartData = {
  from: string;
  to: string;
  groupBy: "Month" | "Day";
  thresholds: WaterThresholds;
  periods: WaterChartPeriod[];
};

export type WaterRange = "days" | "months";

export type WaterView = "list" | "chart";

/** Khoảng ngày lọc lịch sử số đo, dạng "2026-10-28" theo ngày Việt Nam. */
export type WaterDateRange = {
  from: string;
  to: string;
};
