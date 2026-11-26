import type {
  HarvestCrewSuggestions,
  HarvestPlan,
  HarvestPlanListItem,
  HarvestPlanSaved,
  HarvestPlanStep,
  HarvestPlansToHarvest,
  PlanHarvestDraft,
  PlanHarvestSaved,
} from "@/features/farming/models/HarvestPlan";
import type { Paged } from "@/models/Pagination";

import { api } from "@/services/httpClient";
import { parseNumber } from "@/utils/format";
import { appendPhoto } from "@/utils/imageFile";

/** Mã trạng thái kế hoạch thu hoạch trong danh mục Status của backend. */
export const PLAN_STATUS = { draft: 4201, assigned: 4202, harvesting: 4203, completed: 4204, cancelled: 4205, received: 4206, handedOver: 4207 } as const;

/** Tối đa 3 ảnh tại bè, mỗi ảnh 10 MB; ảnh không bắt buộc (chốt 26/11/2026). */
export const HARVEST_LIMITS = { photos: 3, photoBytes: 10 * 1024 * 1024, maxCages: 100000 } as const;

/** Kế hoạch người dùng đang thực hiện được: đã giao, đã nhận hoặc đang thu, trong các vùng người đó được ghi thu hoạch. */
export const assignedHarvestPlans = () => api<HarvestPlansToHarvest>("/api/harvest-plans/assigned");

/** Danh sách kế hoạch theo trạng thái (Chủ HTX xem kế hoạch đã bàn giao để hoàn thành). */
export function listHarvestPlans(statusIds: number[], page = 1) {
  const status = statusIds.map((id) => `statusIds=${id}`).join("&");
  return api<Paged<HarvestPlanListItem>>(`/api/harvest-plans?${status}&page=${page}&pageSize=20`);
}

/** Kế hoạch thu hoạch phục vụ một đơn hàng (đơn được tạo khi thương lái gửi yêu cầu mua). */
export const harvestPlansOfOrder = (salesOrderId: string) =>
  api<Paged<HarvestPlanListItem>>(`/api/harvest-plans?salesOrderId=${encodeURIComponent(salesOrderId)}&page=1&pageSize=20`);

export const getHarvestPlan = (id: string) => api<HarvestPlan>(`/api/harvest-plans/${id}`);

/** Nhận kế hoạch, bàn giao, hoàn thành: backend kiểm tra trạng thái và phiên bản bản ghi. */
export const stepHarvestPlan = (plan: HarvestPlan, step: HarvestPlanStep) =>
  api<HarvestPlanSaved>(`/api/harvest-plans/${plan.id}/${step}`, { method: "POST", body: { rowVersion: plan.rowVersion } });

/** "Không thu" một số luống của bè, kèm lý do (Chủ HTX được báo). Trả về kế hoạch sau khi đổi. */
export const skipPlanLanes = (planId: string, lineId: string, laneNumbers: number[], reason: string) =>
  api<HarvestPlan>(`/api/harvest-plans/${planId}/lines/${lineId}/skip-lanes`, { method: "POST", body: { laneNumbers, reason: reason.trim() } });

/** Thu lại các luống đã bỏ, khi bè chưa có lô. Trả về kế hoạch sau khi đổi. */
export const unskipPlanLanes = (planId: string, lineId: string, laneNumbers: number[]) =>
  api<HarvestPlan>(`/api/harvest-plans/${planId}/lines/${lineId}/unskip-lanes`, { method: "POST", body: { laneNumbers } });

/** Nhân viên được phân công làm ở bè trong ngày: gợi ý người thu. */
export const crewSuggestions = (raftId: string, date: string) =>
  api<HarvestCrewSuggestions>(`/api/rafts/${raftId}/crew-suggestions?date=${date}`);

/** Lỗi của form ghi nhận thu, bằng tiếng Việt; rỗng khi hợp lệ. */
export function planHarvestError(draft: PlanHarvestDraft): string {
  const cages = parseNumber(draft.cageCount);
  if (cages === null || cages <= 0 || cages > HARVEST_LIMITS.maxCages || Math.abs(Math.round(cages * 100) - cages * 100) > 1e-6)
    return "Nhập số lồng đã thu lớn hơn 0, tối đa 2 chữ số thập phân (0,5 là nửa lồng).";
  if (draft.estimatedKg.trim()) {
    const kg = parseNumber(draft.estimatedKg);
    if (kg === null || kg <= 0) return "Khối lượng ước tính phải lớn hơn 0, hoặc để trống.";
  }
  if (draft.photos.length > HARVEST_LIMITS.photos) return `Tối đa ${HARVEST_LIMITS.photos} ảnh.`;
  if (draft.photos.some((p) => p.size > HARVEST_LIMITS.photoBytes)) return "Mỗi ảnh tối đa 10 MB. Bỏ ảnh quá lớn rồi chụp lại.";
  return "";
}

/**
 * Ghi nhận thu một bè theo dòng kế hoạch (`POST api/rafts/{raftId}/harvest-lots` có `harvestPlanLineId`): luống lấy theo dòng
 * kế hoạch, sản phẩm theo chu kỳ nuôi của bè; lô mới ở trạng thái "Chờ cân". Số gửi lên dùng dấu chấm thập phân.
 */
export function recordPlanHarvest(raftId: string, lineId: string, draft: PlanHarvestDraft) {
  const form = new FormData();
  form.append("harvestPlanLineId", lineId);
  form.append("cageCount", String(parseNumber(draft.cageCount)));
  const kg = draft.estimatedKg.trim() ? parseNumber(draft.estimatedKg) : null;
  if (kg !== null) form.append("estimatedKg", String(kg));
  draft.crew.forEach((id) => form.append("crew", id));
  draft.photos.forEach((photo) => appendPhoto(form, "photos", photo));
  return api<PlanHarvestSaved>(`/api/rafts/${raftId}/harvest-lots`, { method: "POST", form });
}
