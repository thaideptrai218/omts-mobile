import type {
  CancelDebtAdjustment,
  CustomerDebtList,
  CustomerDebtSearchParams,
  CustomerDebtStatement,
  DebtAdjustmentSaved,
  RecordDebtAdjustment,
} from "@/features/customers/models/CustomerDebt";
import type { StatementPeriod } from "@/models/Period";

import { api } from "@/services/httpClient";

function query(params: Record<string, string | number | null | undefined>) {
  const q = Object.entries(params)
    .filter(([, v]) => v !== null && v !== undefined && v !== "")
    .map(([k, v]) => `${k}=${encodeURIComponent(String(v))}`)
    .join("&");
  return q ? `?${q}` : "";
}

/** DEBT-03 bước 1: hồ sơ có nợ khác 0, nợ lâu nhất lên đầu, rồi nợ nhiều nhất; tìm theo tên hoặc số điện thoại. */
export function listCustomerDebts(filter: CustomerDebtSearchParams) {
  return api<CustomerDebtList>(`/api/customer-debts${query({ search: filter.search, page: filter.page ?? 1, pageSize: filter.pageSize ?? 20 })}`);
}

/** DEBT-03 bước 3: sao kê theo kỳ (mặc định tháng hiện tại, tối đa 5 năm). */
export function getCustomerStatement(customerId: string, period: StatementPeriod = {}) {
  return api<CustomerDebtStatement>(`/api/customer-debts/${customerId}/statement${query({ from: period.from, to: period.to })}`);
}

/** Điều chỉnh công nợ bằng tay (cần CUSTOMER_PAYMENTS Edit). */
export function recordDebtAdjustment(body: RecordDebtAdjustment) {
  return api<DebtAdjustmentSaved>("/api/customer-debts/adjustments", { method: "POST", body });
}

/** Hủy một điều chỉnh ghi nhầm, có lý do; từ đó nó không còn tính vào nợ. */
export function cancelDebtAdjustment(id: string, body: CancelDebtAdjustment) {
  return api<DebtAdjustmentSaved>(`/api/customer-debts/adjustments/${id}/cancel`, { method: "POST", body });
}
