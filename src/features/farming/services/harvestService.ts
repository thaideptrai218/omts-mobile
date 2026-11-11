import type { HarvestDraft, HarvestLotSaved, HarvestLotsForSale, HarvestScreen } from "@/features/farming/models/Harvest";
import { api } from "@/services/httpClient";
import { parseNumber } from "@/utils/format";

/** Màn thu hoạch của một bè: chu kỳ đang mở, các luống và các lô (SCR-HARVEST-01). */
export const harvestScreen = (raftId: string) => api<HarvestScreen>(`/api/rafts/${raftId}/harvest-lots`);

/** Các lô đang bán trong vùng người dùng được bán: chọn khi cân và lập hóa đơn. */
export const lotsForSale = () => api<HarvestLotsForSale>("/api/harvest-lots/for-sale");

/** Lỗi của phiếu thu hoạch trước khi gửi; chuỗi rỗng là hợp lệ. */
export function harvestDraftError(draft: HarvestDraft): string {
  if (!draft.purchaseRequestId) return "Chọn đơn hàng mà lần thu này thu cho.";
  if (draft.laneNumbers.length === 0) return "Chọn ít nhất một luống đã thu hoạch.";
  const cages = draft.cages.trim();
  if (!/^\d+$/.test(cages) || Number(cages) <= 0) return "Số lồng phải là số nguyên lớn hơn 0.";
  if (draft.estimatedKg.trim()) {
    const kg = parseNumber(draft.estimatedKg);
    if (kg === null || kg <= 0) return "Số kg ước tính phải lớn hơn 0, hoặc để trống để hệ thống tự tính.";
  }
  return "";
}

/**
 * HARVEST-01: gửi dạng multipart, mỗi luống một trường. Không gửi kg ước tính thì server tự tính số lồng nhân kg trung bình.
 * Mỗi lần thu ghi cho một đơn đã nhận (chốt 11/11/2026).
 */
export function recordHarvest(raftId: string, draft: HarvestDraft) {
  const form = new FormData();
  form.append("purchaseRequestId", draft.purchaseRequestId);
  draft.laneNumbers.forEach((n) => form.append("laneNumbers", String(n)));
  draft.finishedLaneNumbers.filter((n) => draft.laneNumbers.includes(n)).forEach((n) => form.append("finishedLaneNumbers", String(n)));
  form.append("cageCount", draft.cages.trim());
  const kg = parseNumber(draft.estimatedKg);
  if (kg !== null) form.append("estimatedKg", String(kg));
  return api<HarvestLotSaved>(`/api/rafts/${raftId}/harvest-lots`, { method: "POST", form });
}
