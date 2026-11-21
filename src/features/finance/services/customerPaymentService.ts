import type {
  AwaitingCustomerPayments,
  CancelCustomerPayment,
  ConfirmCustomerPayments,
  CustomerPayment,
  CustomerPaymentSaved,
  CustomerPaymentsConfirmed,
  RecordCustomerPayment,
} from "@/features/finance/models/CustomerPayment";
import type { CustomerPaymentForm } from "@/features/finance/models/CustomerPaymentForm";
import type { FinanceCustomer, FinanceCustomerSearch } from "@/features/finance/models/FinanceCustomer";
import type { Paged } from "@/models/Pagination";

import { api } from "@/services/httpClient";

function query(params: Record<string, string | number | null | undefined>) {
  const q = Object.entries(params)
    .filter(([, v]) => v !== null && v !== undefined && v !== "")
    .map(([k, v]) => `${k}=${encodeURIComponent(String(v))}`)
    .join("&");
  return q ? `?${q}` : "";
}

/**
 * Thương lái đang dùng để chọn khi thu hoặc trả lại tiền (`GET api/customers`). Có quyền xem công nợ thì người nợ nhiều
 * lên đầu; khi trả lại tiền chỉ lấy người HTX đang nợ lại, nợ lại nhiều lên đầu. Không có quyền đó thì sắp theo tên,
 * vì máy chủ từ chối lọc và sắp theo công nợ.
 */
export function searchPaymentCustomers(filter: FinanceCustomerSearch) {
  const byDebt = filter.seesDebt;
  return api<Paged<FinanceCustomer>>(
    `/api/customers${query({
      search: filter.search,
      sortBy: byDebt ? "currentDebt" : "name",
      sortDir: byDebt && filter.mode === "receive" ? "desc" : "asc",
      currentDebtTo: byDebt && filter.mode === "payBack" ? -1 : null,
      page: filter.page,
      pageSize: filter.pageSize,
    })}`,
  );
}

export function getPaymentForm(customerId: string) {
  return api<CustomerPaymentForm>(`/api/customer-payments/form/${customerId}`);
}

export function getCustomerPayment(id: string) {
  return api<CustomerPayment>(`/api/customer-payments/${id}`);
}

/** DEBT-02 bước 2-7: phiếu thu hoàn tất ngay khi lưu. 409 MSG-DEBT-04 rồi MSG-DEBT-05 là câu hỏi, trả lời bằng cờ cùng tên. */
export function recordCustomerPayment(body: RecordCustomerPayment) {
  return api<CustomerPaymentSaved>("/api/customer-payments", { method: "POST", body });
}

/** DEBT-02.3: trả lại tiền, tối đa bằng tiền HTX đang nợ lại (400 MSG-DEBT-06). */
export function recordPayBack(body: RecordCustomerPayment) {
  return api<CustomerPaymentSaved>("/api/customer-payments/pay-back", { method: "POST", body });
}

export function listAwaitingPayments(page: number, pageSize: number) {
  return api<AwaitingCustomerPayments>(`/api/customer-payments/awaiting-confirmation${query({ page, pageSize })}`);
}

export function confirmCustomerPayment(id: string) {
  return api<CustomerPaymentSaved>(`/api/customer-payments/${id}/confirm`, { method: "POST" });
}

/** DEBT-02.2 bước 3-6: xác nhận nhiều khoản trong một lần lưu, Chủ HTX nhận một thông báo. */
export function confirmCustomerPayments(body: ConfirmCustomerPayments) {
  return api<CustomerPaymentsConfirmed>("/api/customer-payments/confirmations", { method: "POST", body });
}

/** DEBT-02.4: hủy phiếu kèm lý do; phiếu không còn tính vào công nợ. */
export function cancelCustomerPayment(id: string, body: CancelCustomerPayment) {
  return api<CustomerPaymentSaved>(`/api/customer-payments/${id}/cancel`, { method: "POST", body });
}
