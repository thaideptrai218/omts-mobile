import type { Paged } from "@/models/Pagination";

/** Hình thức trả. Server chỉ nhận Cash và BankTransfer khi ghi trả lương; Other chỉ có thể xuất hiện ở dữ liệu cũ. */
export type WagePaymentMethod = "Cash" | "BankTransfer" | "Other";

/** Wage: trả cho phiếu lương đã chốt; Advance: tạm ứng, bảng lương chốt kế tiếp của nhân viên sẽ trừ lại (BR-LABOR-11). */
export type WagePaymentKind = "Wage" | "Advance";

/** "Recorded": đã ghi; "Cancelled": phiếu chi đã bị hủy. */
export type WagePaymentStatus = "Recorded" | "Cancelled";

/** Một phiếu lương cần trả và số tiền trả cho phiếu đó (từ 1 đến số còn phải trả). */
export type PayPayrollLine = {
  slipId: string;
  amount: number;
};

/** LABOR-14: trả các phiếu lương của bảng lương đã chốt; mỗi dòng thành một lần trả và một phiếu chi. */
export type PayPayrollRequest = {
  /** ISO có múi giờ, không được sau thời điểm hiện tại. */
  paidAt: string;
  method: WagePaymentMethod;
  note: string | null;
  lines: PayPayrollLine[];
};

export type PayrollVoucherRef = {
  id: string;
  code: string;
  slipId: string;
  employeeName: string;
  amount: number;
};

export type PayrollPaymentResult = {
  vouchers: PayrollVoucherRef[];
};

/** Trả cho một nhân viên ngoài bảng lương: trả các phiếu đã chốt cũ nhất trước, phần dư thành tạm ứng. */
export type StandalonePayrollPaymentRequest = {
  employeeId: string;
  amount: number;
  paidAt: string;
  method: WagePaymentMethod;
  note: string | null;
};

/** `id` là phiếu chi đầu tiên đã tạo. */
export type StandalonePaymentResult = {
  id: string;
};

/** Một lần trả lương hoặc tạm ứng (`PayrollPaymentRow`), mới nhất trước. */
export type PayrollPaymentRow = {
  id: string;
  voucherCode: string;
  paidAt: string;
  employeeId: string;
  employeeName: string;
  payrollId: string | null;
  payrollCode: string | null;
  method: WagePaymentMethod;
  amount: number;
  kind: WagePaymentKind;
  status: WagePaymentStatus;
  payrollName: string | null;
};

/** `amount`: tổng các lần trả chưa hủy của cả tập đã lọc. */
export type PayrollPaymentSummary = {
  amount: number;
};

export type PayrollPaymentPage = Paged<PayrollPaymentRow> & {
  summary: PayrollPaymentSummary;
};

/** Bộ lọc các lần trả: theo bảng lương, nhân viên hoặc loại khoản; null là không lọc. */
export type PayrollPaymentListParams = {
  payrollId: string | null;
  employeeId: string | null;
  kind: WagePaymentKind | null;
  page: number;
  pageSize: number;
};

/** Nhân viên trả được: `outstanding` là số còn nợ trên các phiếu đã chốt (0 với người chưa nợ). */
export type PayableEmployee = {
  employeeId: string;
  code: string;
  name: string;
  outstanding: number;
};

export type PayableEmployees = {
  items: PayableEmployee[];
};
