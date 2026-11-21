/** Một kỳ lương, đặt tên theo tháng của ngày cuối kỳ: 26/09 đến 25/10 là "10/2026" (BR-LABOR-13). */
export type PayPeriod = {
  start: string;
  end: string;
  name: string;
};

/** Cài đặt lương (LABOR-16). `nextPeriods`: hai kỳ lương kế tiếp theo cài đặt đang lưu. */
export type PayrollSettingsView = {
  /** 1 đến 28. */
  payPeriodStartDay: number;
  automaticPayroll: boolean;
  nextPeriods: PayPeriod[];
  rowVersion: string;
};

/** Trả lời khi lưu: cài đặt mới và MSG-GEN-05. */
export type PayrollSettingsSaved = {
  settings: PayrollSettingsView;
  message: string;
  messageCode: string;
};

/** Xem trước, không lưu: hai kỳ lương kế tiếp theo cài đặt đang chọn và câu hỏi MSG-LABOR-36. */
export type PayrollSettingsPreview = {
  payPeriodStartDay: number;
  automaticPayroll: boolean;
  nextPeriods: PayPeriod[];
  message: string;
  messageCode: string;
};

export type SavePayrollSettingsRequest = {
  payPeriodStartDay: number;
  automaticPayroll: boolean;
  rowVersion: string;
};
