import type { PayrollSheetStatus } from "@/features/payroll/models/Payroll";
import type { WagePaymentKind, WagePaymentMethod, WagePaymentStatus } from "@/features/payroll/models/PayrollPayment";
import type { Paged } from "@/models/Pagination";

/** Một phiếu lương trong danh sách phiếu của một nhân viên (`EmployeeSlipRow`), kỳ mới nhất trước. */
export type EmployeeSlipRow = {
  id: string;
  code: string;
  payrollId: string;
  payrollCode: string;
  payrollName: string;
  from: string;
  to: string;
  income: number;
  net: number;
  paid: number;
  outstanding: number;
  status: PayrollSheetStatus;
};

/** `outstanding`: còn nợ trên các phiếu đã chốt; `advanceBalance`: tạm ứng chưa được trừ. */
export type EmployeeSlipSummary = {
  outstanding: number;
  advanceBalance: number;
};

export type EmployeeSlipPage = Paged<EmployeeSlipRow> & {
  summary: EmployeeSlipSummary;
};

export type EmployeeSlipListParams = {
  page: number;
  pageSize: number;
};

/** Tiền công theo loại việc và mức giá trong kỳ. */
export type PayrollSlipJobLine = {
  jobName: string;
  hours: number;
  hourlyRate: number;
  amount: number;
};

export type PayrollSlipPayment = {
  id: string;
  voucherCode: string;
  paidAt: string;
  method: WagePaymentMethod;
  amount: number;
  kind: WagePaymentKind;
  status: WagePaymentStatus;
};

/** Một ngày công được trả, theo loại việc (chỉ ngày của nhân viên thời vụ có đủ giờ vào và ra, BR-LABOR-05). */
export type PayrollSlipAttendanceDay = {
  date: string;
  jobName: string;
  hours: number;
};

/** Chi tiết một phiếu lương (`PayrollSlipDetail`). `status` là trạng thái của bảng lương chứa phiếu. */
export type PayrollSlipDetail = {
  id: string;
  code: string;
  payrollId: string;
  payrollCode: string;
  employeeId: string;
  employeeName: string;
  from: string;
  to: string;
  hours: number;
  mainPay: number;
  bonus: number;
  deduction: number;
  income: number;
  net: number;
  paid: number;
  outstanding: number;
  status: PayrollSheetStatus;
  lines: PayrollSlipJobLine[];
  payments: PayrollSlipPayment[];
  attendance: PayrollSlipAttendanceDay[];
};
