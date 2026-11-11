// Chỉ số nước
export type WaterThresholds = {
  phMin: number | null;
  phMax: number | null;
  salinityMin: number | null;
  salinityMax: number | null;
};

export type ZoneWaterThresholds = {
  zoneId: string;
  zoneCode: string | null;
  zoneName: string | null;
  zoneStatus: string | null;
  thresholds: WaterThresholds;
};

export type AlertState = "None" | "Active" | "Corrected" | "Voided";

export type AccountRef = {
  id: string;
  name: string | null;
} | null;

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
  ocrDraft: {
    ph: number | null;
    salinity: number | null;
    measuredAt: string | null;
  };
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
  currentEditors: {
    accountId: string;
    name: string | null;
    startedAt: string;
  }[];
};

export type WaterValues = {
  measuredAt: string;
  ph: number | null;
  salinity: number | null;
};

export type WaterFilter = "All" | "Draft" | "Confirmed" | "Voided";

export type WaterDetailMode = "confirm" | "correct" | null;

export type WaterEditingStatus = {
  otherEditors: {
    name: string | null;
    startedAt: string;
  }[];
  notice: {
    code: string | null;
    text: string | null;
  } | null;
};

export type OcrField<T> = {
  value: T;
  confidence: number;
  uncertain: boolean;
};

/** `NotCalled`: gửi lại cùng mã thao tác, server trả bản nháp đã lưu và không đọc ảnh lần nữa. */
export type OcrOutcome = {
  status: "Success" | "Failed" | "NotCalled";
  ph: OcrField<number> | null;
  salinity: OcrField<number> | null;
};

export type WaterRecognition = {
  measurement: WaterDetail;
  ocr: OcrOutcome;
};

/** Ảnh và mã thao tác của một lần gửi đọc ảnh, giữ lại để gửi lại đúng ảnh đó sau lỗi mạng. */
export type WaterPhotoAttempt = {
  zoneId: string;
  photo: Blob;
  operationId: string;
};

export type WaterIndicatorStats = {
  average: number | null;
  minimum: number | null;
  maximum: number | null;
  count: number;
};

export type WaterChartPeriod = {
  period: string;
  from: string;
  to: string;
  ph: WaterIndicatorStats;
  salinity: WaterIndicatorStats;
  missing: boolean;
};

export type WaterChartData = {
  zoneId: string;
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
