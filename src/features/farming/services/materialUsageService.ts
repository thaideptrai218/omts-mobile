import type { CycleListItem } from "@/features/farming/models/Cycle";
import type {
  EditMaterialUsage, MaterialItem, MaterialUsageDraft, MaterialUsageEditChoices, MaterialUsageEditDraft, MaterialUsageList, MaterialUsageRecorded, MaterialUsageSaved, MaterialUsageView,
  RecordMaterialUsage,
} from "@/features/farming/models/MaterialUsage";
import { MESSAGES } from "@/constants/messages";
import { getRaft, listRafts, USAGE } from "@/features/farming/services/farmService";
import { api } from "@/services/httpClient";
import { date, parseNumber, todayIso } from "@/utils/format";

/** Giới hạn của backend (`MaterialUsageValues.cs`, `MaterialUsage.cs`): lý do sửa bè, lý do chỉnh sửa, số lượng lớn nhất. */
export const MATERIAL_USAGE_LIMITS = { repairReason: 500, reason: 1000, maxQuantity: 1_000_000_000 } as const;

/** Màn Vật tư sử dụng của bè: theo chu kỳ, rồi theo lần sửa bè. */
export const raftMaterialUsages = (raftId: string) => api<MaterialUsageList>(`/api/rafts/${raftId}/material-usages`);

export const getMaterialUsage = (id: string) => api<MaterialUsageView>(`/api/material-usages/${id}`);

/** Vật tư chọn được: nhóm Vật tư bè, đang dùng (GBR-01). */
export const materialItems = () => api<MaterialItem[]>(`/api/farming-input-items?group=Material&statusId=${USAGE.inUse}`);

/**
 * Lựa chọn của form sửa: vật tư đang dùng, giữ cả vật tư hiện tại dù đã ngừng dùng (server chỉ kiểm tra khi đổi vật tư),
 * và các bè đang dùng trong cùng vùng để chuyển bản ghi ghi nhầm bè.
 */
export async function usageEditChoices(usage: MaterialUsageView): Promise<MaterialUsageEditChoices> {
  const [found, raft] = await Promise.all([materialItems(), getRaft(usage.raftId)]);
  const zoneRafts = await listRafts(raft.zone.id, USAGE.inUse);
  const items = found.some((i) => i.id === usage.itemId)
    ? found
    : [{ id: usage.itemId, code: usage.itemCode, name: usage.itemName, unit: usage.unit, statusId: USAGE.discontinued, status: "" }, ...found];
  const rafts = zoneRafts.map((r) => ({ id: r.id, code: r.code ?? "" }));
  if (!rafts.some((r) => r.id === usage.raftId)) rafts.unshift({ id: usage.raftId, code: usage.raftCode });
  return { items, rafts };
}

/** Chu kỳ đã đóng chứa ngày này (tính cả ngày đóng), nếu có: ngày đó không ghi hay sửa vật tư được (BR-CYCLE-03, BR-CYCLE-04). */
export function closedCycleOn(cycles: CycleListItem[], day: string): CycleListItem | null {
  return cycles.find((c) => c.closeDate !== null && c.startDate <= day && day <= c.closeDate) ?? null;
}

function dateError(day: string, cycles: CycleListItem[]): string {
  if (!day) return "Chọn ngày sửa bè.";
  if (day > todayIso()) return "Ngày sửa bè không được sau hôm nay.";
  const closed = closedCycleOn(cycles, day);
  if (closed) return `Ngày ${date(day)} thuộc chu kỳ nuôi đã đóng (${date(closed.startDate)} – ${date(closed.closeDate)}) nên không ghi vật tư được. Hãy chọn ngày khác.`;
  return "";
}

/** Số lượng lớn hơn 0, tối đa 3 chữ số thập phân để server lưu đúng như đã gõ. */
function quantityError(text: string, prefix: string): string {
  const quantity = parseNumber(text);
  if (quantity === null || quantity <= 0) return `${prefix}số lượng phải lớn hơn 0.`;
  if (quantity > MATERIAL_USAGE_LIMITS.maxQuantity) return `${prefix}số lượng quá lớn.`;
  if (Number(quantity.toFixed(3)) !== quantity) return `${prefix}số lượng chỉ được tối đa 3 chữ số sau dấu phẩy.`;
  return "";
}

/** Lỗi của form ghi vật tư trước khi gửi; chuỗi rỗng là hợp lệ. Mỗi vật tư chỉ một dòng trong một lần sửa. */
export function usageDraftError(draft: MaterialUsageDraft, cycles: CycleListItem[]): string {
  const problem = dateError(draft.usageDate, cycles);
  if (problem) return problem;
  if (!draft.repairReason.trim()) return MESSAGES.MSG01("Lý do sửa bè");
  if (!draft.lines.length) return "Thêm ít nhất một vật tư đã dùng.";
  const seen = new Set<string>();
  for (const [i, line] of draft.lines.entries()) {
    const prefix = `Dòng ${i + 1}: `;
    if (!line.itemId) return `${prefix}chọn vật tư.`;
    if (seen.has(line.itemId)) return `${prefix}vật tư này đã có ở dòng trên, hãy cộng vào dòng đó.`;
    seen.add(line.itemId);
    const quantity = quantityError(line.quantity, prefix);
    if (quantity) return quantity;
  }
  return "";
}

/** Lỗi của form sửa một bản ghi; `cycles` là các chu kỳ của bè được chọn. */
export function usageEditError(draft: MaterialUsageEditDraft, cycles: CycleListItem[]): string {
  if (!draft.raftId) return "Chọn bè.";
  const problem = dateError(draft.usageDate, cycles);
  if (problem) return problem;
  if (!draft.itemId) return "Chọn vật tư.";
  const quantity = quantityError(draft.quantity, "");
  if (quantity) return quantity.charAt(0).toUpperCase() + quantity.slice(1);
  if (!draft.repairReason.trim()) return MESSAGES.MSG01("Lý do sửa bè");
  return "";
}

/** CYCLE-03.0: một lần sửa bè, mỗi vật tư một bản ghi. Ngày trong chu kỳ đã đóng bị từ chối (MSG-GEN-09). */
export function recordMaterialUsage(raftId: string, draft: MaterialUsageDraft) {
  const body: RecordMaterialUsage = {
    usageDate: draft.usageDate,
    repairReason: draft.repairReason.trim(),
    items: draft.lines.map((l) => ({ itemId: l.itemId, quantity: parseNumber(l.quantity) })),
  };
  return api<MaterialUsageRecorded>(`/api/rafts/${raftId}/material-usages`, { method: "POST", body });
}

/** CYCLE-03.1: sửa kèm lý do (ghi vào nhật ký hệ thống). Phiên bản cũ thì server trả MSG06. */
export function editMaterialUsage(usage: MaterialUsageView, draft: MaterialUsageEditDraft, reason: string) {
  const body: EditMaterialUsage = {
    raftId: draft.raftId,
    usageDate: draft.usageDate,
    itemId: draft.itemId,
    quantity: parseNumber(draft.quantity),
    repairReason: draft.repairReason.trim(),
    reason: reason.trim(),
    rowVersion: usage.rowVersion,
  };
  return api<MaterialUsageSaved>(`/api/material-usages/${usage.id}`, { method: "PUT", body });
}
