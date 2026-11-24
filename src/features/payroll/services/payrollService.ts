import type {
  CreatePayrollRequest, FinalizePayrollRequest, PayrollListParams, PayrollSheetDetail, PayrollSheetPage, ReloadPayrollRequest,
} from "@/features/payroll/models/Payroll";
import type {
  PayableEmployees, PayPayrollRequest, PayrollPaymentListParams, PayrollPaymentPage, PayrollPaymentResult, StandalonePaymentResult,
  StandalonePayrollPaymentRequest,
} from "@/features/payroll/models/PayrollPayment";
import type { EmployeeSlipListParams, EmployeeSlipPage, PayrollSlipDetail } from "@/features/payroll/models/Payslip";

import { api } from "@/services/httpClient";

/** Chuỗi query; giá trị mảng thành tham số lặp lại (`status=A&status=B`), giá trị rỗng bị bỏ. */
function query(params: Record<string, string | number | boolean | string[] | null | undefined>) {
  const parts = Object.entries(params).flatMap(([key, value]) =>
    (Array.isArray(value) ? value : [value])
      .filter((v) => v !== null && v !== undefined && v !== "")
      .map((v) => `${key}=${encodeURIComponent(String(v))}`),
  );
  return parts.length ? `?${parts.join("&")}` : "";
}

// Bảng lương, phiếu lương và trả lương (LABOR-12, LABOR-13, LABOR-14): chỉ Chủ HTX, server kiểm tra theo tài khoản.
export function listPayrolls(filter: PayrollListParams) {
  return api<PayrollSheetPage>(
    `/api/payrolls${query({ status: filter.status, sortBy: "from", sortDir: "desc", page: filter.page, pageSize: filter.pageSize })}`,
  );
}

export function getPayroll(id: string) {
  return api<PayrollSheetDetail>(`/api/payrolls/${id}`);
}

export function createPayroll(body: CreatePayrollRequest) {
  return api<PayrollSheetDetail>("/api/payrolls", { method: "POST", body });
}

export function reloadPayroll(id: string, body: ReloadPayrollRequest) {
  return api<PayrollSheetDetail>(`/api/payrolls/${id}/reload`, { method: "POST", body });
}

export function finalizePayroll(id: string, body: FinalizePayrollRequest) {
  return api<PayrollSheetDetail>(`/api/payrolls/${id}/finalize`, { method: "POST", body });
}

/** Không có lý do: API hủy không nhận thân yêu cầu. */
export function cancelPayroll(id: string) {
  return api<PayrollSheetDetail>(`/api/payrolls/${id}/cancel`, { method: "POST" });
}

export function payPayroll(id: string, body: PayPayrollRequest) {
  return api<PayrollPaymentResult>(`/api/payrolls/${id}/payments`, { method: "POST", body });
}

export function listPayrollPayments(filter: PayrollPaymentListParams) {
  return api<PayrollPaymentPage>(
    `/api/payroll-payments${query({ payrollId: filter.payrollId, employeeId: filter.employeeId, kind: filter.kind, page: filter.page, pageSize: filter.pageSize })}`,
  );
}

export function payEmployee(body: StandalonePayrollPaymentRequest) {
  return api<StandalonePaymentResult>("/api/payroll-payments", { method: "POST", body });
}

/** `includeAll`: thêm mọi nhân viên đang làm việc (còn nợ 0); server trả tối đa 200 người. */
export function payableEmployees(search: string, includeAll: boolean) {
  return api<PayableEmployees>(`/api/payrolls/payable-employees${query({ search, includeAll })}`);
}

export function employeePayslips(employeeId: string, filter: EmployeeSlipListParams) {
  return api<EmployeeSlipPage>(`/api/employees/${employeeId}/payslips${query({ page: filter.page, pageSize: filter.pageSize })}`);
}

export function getPayslip(slipId: string) {
  return api<PayrollSlipDetail>(`/api/payroll-slips/${slipId}`);
}
