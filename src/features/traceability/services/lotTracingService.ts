import type {
  LotPublishCheck,
  LotPublished,
  LotTrace,
  LotTraceSearchParams,
  LotTraceSearchResult,
  LotWithdrawalNotices,
  LotWithdrawalPreview,
  LotWithdrawn,
  WithdrawLot,
} from "@/features/traceability/models/LotTracing";
import { api } from "@/services/httpClient";

function query(params: Record<string, string | null | undefined>) {
  const parts = Object.entries(params)
    .filter(([, v]) => v !== undefined && v !== null && v.trim() !== "")
    .map(([k, v]) => `${k}=${encodeURIComponent(String(v).trim())}`);
  return parts.length ? `?${parts.join("&")}` : "";
}

/** Tìm lô theo đầu mã lô và/hoặc mã hóa đơn bán, trong các vùng người dùng được truy vết (TRACE-02 bước 1). */
export const searchLots = (params: LotTraceSearchParams) =>
  api<LotTraceSearchResult>(`/api/harvest-lots/trace-search${query({ lotCode: params.lotCode, invoiceCode: params.invoiceCode })}`);

/** Truy ngược và truy xuôi một lô (TRACE-02 bước 2-3). Chỉ đọc. */
export const getLotTrace = (lotId: string) => api<LotTrace>(`/api/harvest-lots/${lotId}/trace`);

/** Kiểm tra trước khi công bố (TRACE-01.2 bước 2). Không thay đổi gì. */
export const checkLotPublish = (lotId: string) => api<LotPublishCheck>(`/api/harvest-lots/${lotId}/publish-check`);

/** Công bố thông tin nguồn gốc của lô, hoặc công bố lại lô đã thu hồi (chỉ Chủ HTX). */
export const publishLot = (lotId: string) => api<LotPublished>(`/api/harvest-lots/${lotId}/publish`, { method: "POST" });

/** Những thương lái sẽ được báo nếu thu hồi bây giờ (TRACE-04 bước 1). Không thay đổi gì. */
export const previewLotWithdrawal = (lotId: string) => api<LotWithdrawalPreview>(`/api/harvest-lots/${lotId}/withdraw-preview`);

/** Thu hồi thông tin nguồn gốc kèm lý do; backend nhắn tin cho từng thương lái và trả kết quả gửi (TRACE-04). */
export const withdrawLot = (lotId: string, body: WithdrawLot) => api<LotWithdrawn>(`/api/harvest-lots/${lotId}/withdraw`, { method: "POST", body });

/** Thông báo của lần thu hồi gần nhất, với tình trạng gửi hiện tại. */
export const getWithdrawalNotices = (lotId: string) => api<LotWithdrawalNotices>(`/api/harvest-lots/${lotId}/withdrawal-notices`);
