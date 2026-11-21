import type { Paged } from "@/models/Pagination";

/**
 * Trạng thái bảng lương theo hợp đồng API (`PayrollSheetStatus`). Bảng lương được lập và tính trong một bước nên là
 * Provisional (tạm tính) ngay khi lưu; Creating chỉ có trong danh mục, không endpoint nào tạo ra.
 */
export type PayrollSheetStatus = "Creating" | "Provisional" | "Finalized" | "Cancelled";

/** Monthly: trọn một tháng dương lịch (ngày 1 đến ngày cuối tháng); Custom: khoảng ngày bất kỳ, tối đa 366 ngày. */
export type PayrollPeriodType = "Monthly" | "Custom";

/** All: mọi nhân viên có giờ công trong kỳ; Selected: các nhân viên được chọn lúc lập (1 đến 500 người). */
export type PayrollScope = "All" | "Selected";

/** All: tính lại mọi phiếu (cả danh sách nhân viên); WorkingDaysOnly: chỉ tính lại giờ công và tiền của các phiếu đang có. */
export type PayrollReloadMode = "All" | "WorkingDaysOnly";

/** Một dòng của danh sách bảng lương (`PayrollSheetRow`). Tiền là VND số nguyên; ngày dạng "YYYY-MM-DD". */
export type PayrollSheetRow = {
  id: string;
  code: string;
  /** Tên do server đặt, đã là tiếng Việt: "Bảng lương tháng 10/2026" hoặc "Bảng lương 01/10/2026 - 15/10/2026". */
  name: string;
  periodType: PayrollPeriodType;
  from: string;
  to: string;
  total: number;
  paid: number;
  outstanding: number;
  status: PayrollSheetStatus;
  createdAt: string;
};

/** Tổng của cả tập đã lọc (không chỉ trang đang xem). */
export type PayrollTotals = {
  total: number;
  paid: number;
  outstanding: number;
};

export type PayrollSheetPage = Paged<PayrollSheetRow> & {
  summary: PayrollTotals;
};

/** Bộ lọc danh sách bảng lương: `status` lặp lại trên query; rỗng là mọi trạng thái. */
export type PayrollListParams = {
  status: PayrollSheetStatus[];
  page: number;
  pageSize: number;
};

/** Một phiếu lương trong bảng lương (`PayrollSlipRow`). `net` = `income` - `deduction` (tạm ứng đã trừ). */
export type PayrollSlipRow = {
  id: string;
  code: string;
  employeeId: string;
  employeeCode: string;
  employeeName: string;
  hours: number;
  /** Các mức tiền công mỗi giờ trong kỳ, server viết sẵn dạng "30.000 / 32.000"; null khi không có giờ công. */
  hourlyRateNote: string | null;
  mainPay: number;
  bonus: number;
  deduction: number;
  income: number;
  net: number;
  paid: number;
  outstanding: number;
};

/** Chi tiết bảng lương (`PayrollSheetDetail`). */
export type PayrollSheetDetail = {
  id: string;
  code: string;
  name: string;
  periodType: PayrollPeriodType;
  from: string;
  to: string;
  scope: PayrollScope;
  status: PayrollSheetStatus;
  /** "YYYY-MM": tháng ghi chi phí lương, có khi đã chốt. */
  expenseMonth: string | null;
  note: string | null;
  createdBy: string | null;
  createdAt: string;
  total: number;
  paid: number;
  outstanding: number;
  slips: PayrollSlipRow[];
  createdByName: string | null;
  employeeCount: number;
};

/** LABOR-12: lập và tính bảng lương trong một bước. `employeeIds` chỉ gửi khi `scope` là Selected. */
export type CreatePayrollRequest = {
  periodType: PayrollPeriodType;
  from: string;
  to: string;
  scope: PayrollScope;
  employeeIds: string[] | null;
};

export type ReloadPayrollRequest = {
  mode: PayrollReloadMode;
};

/** LABOR-13: `expenseMonth` dạng "YYYY-MM", tháng tiền lương được tính vào chi phí. */
export type FinalizePayrollRequest = {
  expenseMonth: string;
};
