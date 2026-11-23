import type { LinkZaloOrder, TraderCheckout } from "@/features/sales/models/TraderCheckout";

import { api } from "@/services/httpClient";

/**
 * Bắt đầu trả số còn nợ của một hóa đơn. Hóa đơn đang có lần thanh toán còn hạn cùng số tiền thì server trả lại lần đó;
 * lần đã hết hạn hoặc khác số tiền thì server hủy rồi tạo lần mới.
 */
export const startCheckout = (invoiceId: string) => api<TraderCheckout>(`/api/me/invoices/${invoiceId}/checkout`, { method: "POST" });

/** Màn QR hỏi mỗi vài giây: trạng thái do server đọc, không phải do app. */
export const getCheckout = (id: string) => api<TraderCheckout>(`/api/me/checkouts/${id}`);

/** Mã đơn Zalo trả về ở sự kiện `PAY_BY_CUSTOM_METHOD`; server báo Zalo đơn này khi tiền về. */
export const linkZaloOrder = (id: string, body: LinkZaloOrder) => api<TraderCheckout>(`/api/me/checkouts/${id}/zalo-order`, { method: "POST", body });
