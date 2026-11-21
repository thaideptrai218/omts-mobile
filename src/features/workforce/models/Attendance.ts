/** LABOR-04.0, 04.1, 04.7: `qrCode` là chữ quét được từ mã QR chấm công của nhân viên; null khi ghi thủ công. */
export type RecordAttendanceRequest = {
  qrCode: string | null;
};

/** LABOR-04.8: giờ vào chung của các thành viên đội trên một bè, giờ HTX "HH:mm" của hôm nay, kèm lý do. */
export type CrewStartRequest = {
  raftId: string;
  startTime: string;
  reason: string;
  employeeIds: string[];
};

/** LABOR-04.7 (`StaffAttendanceView`): nhân viên chính thức chấm công không cần phân công bè. */
export type StaffAttendance = {
  employeeId: string;
  employeeName: string;
  employeeCode: string | null;
  date: string;
  checkedInAt: string | null;
  checkedOutAt: string | null;
  complete: boolean;
  onLeave: boolean;
  message?: string;
  messageCode?: string;
};

/** Một khoảng làm một loại việc trong ngày, đã trừ giờ nghỉ và làm tròn (LABOR-08). */
export type MyPeriod = {
  jobTypeId: string;
  job: string;
  raft: string | null;
  startsAt: string;
  endsAt: string;
  minutes: number;
};

export type MyJobHours = {
  jobTypeId: string;
  job: string;
  hours: number;
};

/**
 * Một ngày chấm công của chính nhân viên (`MyAttendanceDayView`). `periods` và `jobs` rỗng khi ngày còn thiếu giờ
 * (BR-LABOR-06) và với nhân viên chính thức, người tính ngày công chứ không tính giờ.
 */
export type AttendanceDay = {
  date: string;
  checkedInAt: string | null;
  checkedOutAt: string | null;
  periods: MyPeriod[];
  jobs: MyJobHours[];
  complete: boolean;
};

/** Đơn vị làm tròn xuống giờ công của mỗi loại việc trong ngày (BR-LABOR-05). */
export type AttendanceRoundingUnit = "None" | "Minutes15" | "Minutes30" | "Hour1";

/**
 * Một phiên bản cài đặt chấm công (`AttendanceSettingsView`, LABOR-15): giờ nghỉ "HH:mm:ss" (cả hai hoặc không có),
 * đơn vị làm tròn, áp dụng từ ngày. `effectiveFrom` null chỉ với cài đặt lúc dựng OMTS: không nghỉ, không làm tròn.
 */
export type AttendanceSettingsVersion = {
  breakStart: string | null;
  breakEnd: string | null;
  roundingUnit: AttendanceRoundingUnit;
  effectiveFrom: string | null;
};

/** `GET api/attendance-settings`: cài đặt đang áp dụng hôm nay, mọi phiên bản (ngày mới nhất trước) và phiên bản bản ghi. */
export type AttendanceSettingsOverview = {
  current: AttendanceSettingsVersion;
  versions: AttendanceSettingsVersion[];
  rowVersion: string;
};

/** LABOR-15: lưu cài đặt từ một ngày; ngày đã có phiên bản thì thay phiên bản đó. Giờ "HH:mm", để null khi không nghỉ. */
export type SaveAttendanceSettings = {
  breakStart: string | null;
  breakEnd: string | null;
  roundingUnit: AttendanceRoundingUnit;
  effectiveFrom: string;
  rowVersion: string;
};

/** Trả lời khi lưu: cài đặt mới và MSG-GEN-05. */
export type AttendanceSettingsSaved = {
  settings: AttendanceSettingsOverview;
  message: string;
  messageCode: string;
};

/** LABOR-07: mã QR chấm công, dùng được `secondsValid` giây (60), hết hạn thì app xin mã mới. */
export type AttendanceQr = {
  code: string;
  expiresAt: string;
  secondsValid: number;
};
