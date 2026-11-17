import type {
  AcceptQualityClaim,
  QualityClaimDraft,
  QualityClaimSaved,
  QualityClaimsPage,
  QualityClaimView,
  RejectQualityClaim,
  TraderQualityClaimView,
} from "@/features/claims/models/QualityClaim";

import { api } from "@/services/httpClient";
import { appendPhoto, shrinkImage } from "@/utils/imageFile";

/** Giới hạn của backend: mô tả (QualityClaim.MaxDescriptionLength), lời nhắn phản hồi, số ảnh và cỡ mỗi ảnh (CLAIM-01 bước 4). */
export const CLAIM_LIMITS = { description: 2000, note: 1000, photos: 10, photoBytes: 10 * 1024 * 1024 } as const;

const PAGE_SIZE = 20;

// ---- Thương lái (CLAIM-01): chỉ hồ sơ khách gắn với tài khoản đang đăng nhập; của người khác trả 404 (BR-ACCOUNT-04).

/** Khiếu nại của tôi, mới nhất trước. */
export const myClaims = (page: number) => api<QualityClaimsPage>(`/api/me/quality-claims?page=${page}&pageSize=${PAGE_SIZE}`);

/** Một khiếu nại của tôi, kèm ảnh và phản hồi của HTX. */
export const myClaim = (id: string) => api<TraderQualityClaimView>(`/api/me/quality-claims/${id}`);

/** Lỗi của phiếu khiếu nại trước khi gửi; chuỗi rỗng là hợp lệ. */
export function claimDraftError(draft: QualityClaimDraft): string {
  const description = draft.description.trim();
  if (!description) return "Ghi rõ hàng bị lỗi thế nào (bắt buộc).";
  if (description.length > CLAIM_LIMITS.description) return `Mô tả tối đa ${CLAIM_LIMITS.description} ký tự.`;
  if (draft.photos.length === 0) return "Chụp ít nhất một ảnh hàng bị lỗi.";
  if (draft.photos.length > CLAIM_LIMITS.photos) return `Một khiếu nại có tối đa ${CLAIM_LIMITS.photos} ảnh.`;
  if (draft.photos.some((p) => p.size > CLAIM_LIMITS.photoBytes)) return "Mỗi ảnh tối đa 10 MB. Bỏ ảnh quá lớn rồi chụp lại.";
  return "";
}

/**
 * Backend chỉ nhận JPEG hoặc PNG tối đa 10 MB, đọc theo nội dung tệp. Ảnh loại khác (WebP…) hoặc quá lớn được vẽ lại
 * thành JPEG; ảnh đã hợp lệ giữ nguyên.
 */
export function preparePhoto(photo: Blob): Promise<Blob> {
  const accepted = photo.type === "" || photo.type === "image/jpeg" || photo.type === "image/png";
  return shrinkImage(photo, accepted ? CLAIM_LIMITS.photoBytes : 0, 2560);
}

/**
 * CLAIM-01: gửi khiếu nại về một hóa đơn của tôi. Multipart `description` và mỗi ảnh một phần `photos`. Server từ chối
 * (MSG-GEN-09) hóa đơn đã hủy, đã trả hàng hoặc đang có khiếu nại chờ phản hồi; không lưu gì khi tải ảnh lỗi (MSG-GEN-03).
 */
export function submitClaim(invoiceId: string, draft: QualityClaimDraft) {
  const form = new FormData();
  form.append("description", draft.description.trim());
  draft.photos.forEach((photo) => appendPhoto(form, "photos", photo));
  return api<QualityClaimSaved>(`/api/me/sales-invoices/${invoiceId}/quality-claims`, { method: "POST", form });
}

// ---- HTX (CLAIM-02, SCR-CLAIM-02): Chủ HTX phản hồi; Quản lý vùng chỉ xem khiếu nại của hóa đơn trong vùng mình.

/** Khiếu nại chờ phản hồi trước, rồi mới nhất trước. `statusId` null là mọi trạng thái. */
export function searchClaims(statusId: number | null, page: number) {
  const status = statusId === null ? "" : `statusId=${statusId}&`;
  return api<QualityClaimsPage>(`/api/quality-claims?${status}page=${page}&pageSize=${PAGE_SIZE}`);
}

/** Khiếu nại kèm ảnh, hồ sơ thương lái và hóa đơn; vùng không được xem trả 403. */
export const getClaim = (id: string) => api<QualityClaimView>(`/api/quality-claims/${id}`);

/** CLAIM-02.0 (chỉ Chủ HTX): MSG-CLAIM-03 khi hóa đơn đã hủy hoặc đã trả hàng, lúc đó vẫn từ chối được. */
export const acceptClaim = (id: string, body: AcceptQualityClaim) =>
  api<QualityClaimView>(`/api/quality-claims/${id}/accept`, { method: "POST", body });

/** CLAIM-02.1 (chỉ Chủ HTX): lý do bắt buộc. */
export const rejectClaim = (id: string, body: RejectQualityClaim) =>
  api<QualityClaimView>(`/api/quality-claims/${id}/reject`, { method: "POST", body });
