import type {
  CreateSalesInvoice, FinishSalesInvoice, InvoicePublishCheck, MyInvoice, MyInvoiceList, ProductPrice, SalesInvoice, SalesInvoiceSaved, SalesInvoiceSent,
} from "@/features/sales/models/SalesInvoice";
import { api } from "@/services/httpClient";

export const productPrice = (id: string) => api<ProductPrice>(`/api/products/${id}`);
export const createInvoice = (body: CreateSalesInvoice) => api<SalesInvoiceSaved>("/api/sales-invoices", { method: "POST", body });
export const getInvoice = (id: string) => api<SalesInvoice>(`/api/sales-invoices/${id}`);
/** Lô nào sẽ được công bố nguồn gốc nếu trả lời "có" cho câu hỏi tạo mã QR; không thay đổi gì. */
export const publishCheck = (id: string) => api<InvoicePublishCheck>(`/api/sales-invoices/${id}/publish-check`);
/** Kết thúc bán (SALE-05 bước 9-11): có mã QR thì công bố nguồn gốc các lô đủ thông tin và gửi hóa đơn cho thương lái. */
export const finishInvoice = (id: string, body: FinishSalesInvoice) => api<SalesInvoiceSent>(`/api/sales-invoices/${id}/finish`, { method: "POST", body });

export const myInvoices = (page = 1) => api<MyInvoiceList>(`/api/me/invoices?page=${page}&pageSize=20`);
export const myInvoice = (id: string) => api<MyInvoice>(`/api/me/invoices/${id}`);
