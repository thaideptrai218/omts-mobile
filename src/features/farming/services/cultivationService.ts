import type { CultivationLogDraft, CultivationLogSaved, CultivationLogView } from "@/features/farming/models/CultivationLog";
import type { CycleClosed, CycleClosePreview, CycleDraft, CycleListItem, CycleSaved, CycleStarted, CycleSummary, CycleView, ZoneCycleItem } from "@/features/farming/models/Cycle";
import type { SeedingCompletionPreview, SeedingDraft, SeedingList, SeedingRecordSaved, SeedingRecordView, SeedLotList } from "@/features/farming/models/Seeding";
import { api } from "@/services/httpClient";
import { parseNumber, todayIso } from "@/utils/format";
import { appendPhoto } from "@/utils/imageFile";

/** Trạng thái chu kỳ nuôi (Status catalog của backend). */
export const CYCLE_STATUS = { open: 601, closed: 602 } as const;

/** Giới hạn của backend: ghi chú nhật ký, lý do sửa hoặc xóa, đánh giá khi đóng chu kỳ, số ảnh của một nhật ký. */
export const CULTIVATION_LIMITS = { notes: 2000, reason: 1000, assessment: 2000, photos: 10, photoBytes: 10 * 1024 * 1024 } as const;

// ---- Chu kỳ nuôi (CYCLE-01, CYCLE-05, CYCLE-06)

/** Màn Chu kỳ nuôi của một vùng: mỗi bè với chu kỳ đang mở hoặc chu kỳ đóng gần nhất và các nút được phép. */
export const zoneCycles = (zoneId: string) => api<ZoneCycleItem[]>(`/api/zones/${zoneId}/cultivation-cycles`);

/** Các chu kỳ của một bè, mới nhất trước. */
export const raftCycles = (raftId: string) => api<CycleListItem[]>(`/api/rafts/${raftId}/cultivation-cycles`);

export const getCycle = (cycleId: string) => api<CycleView>(`/api/cultivation-cycles/${cycleId}`);

/** Tổng kết chu kỳ: đã đóng thì tính tới ngày đóng, đang mở thì tính như thể đóng hôm nay. */
export const cycleSummary = (cycleId: string) => api<CycleSummary>(`/api/cultivation-cycles/${cycleId}/summary`);

/** Lỗi của phiếu chu kỳ trước khi gửi; chuỗi rỗng là hợp lệ. Các ước tính không bắt buộc. */
export function cycleDraftError(draft: CycleDraft): string {
  if (draft.startDate && draft.startDate > todayIso()) return "Ngày bắt đầu không được sau hôm nay.";
  if (draft.expectedSeedQuantity.trim()) {
    const quantity = parseNumber(draft.expectedSeedQuantity);
    if (quantity === null || quantity <= 0) return "Lượng giống dự kiến phải lớn hơn 0, hoặc để trống.";
  }
  if (draft.targetYieldKg.trim()) {
    const kg = parseNumber(draft.targetYieldKg);
    if (kg === null || kg <= 0) return "Sản lượng mục tiêu phải lớn hơn 0, hoặc để trống.";
  }
  if (draft.expectedHarvestDate && draft.startDate && draft.expectedHarvestDate < draft.startDate) return "Ngày thu dự kiến không được trước ngày bắt đầu.";
  return "";
}

const cycleBody = (draft: CycleDraft) => ({
  startDate: draft.startDate || null,
  expectedSeedQuantity: parseNumber(draft.expectedSeedQuantity),
  expectedHarvestDate: draft.expectedHarvestDate || null,
  targetYieldKg: parseNumber(draft.targetYieldKg),
});

/** CYCLE-01.0: không chọn ngày thì bắt đầu hôm nay. */
export const startCycle = (raftId: string, draft: CycleDraft) =>
  api<CycleStarted>(`/api/rafts/${raftId}/cultivation-cycles`, { method: "POST", body: cycleBody(draft) });

/** CYCLE-01.1: ước tính để trống là xóa ước tính đó. */
export const editCycle = (cycle: CycleView, draft: CycleDraft) =>
  api<CycleSaved>(`/api/cultivation-cycles/${cycle.id}`, { method: "PUT", body: { ...cycleBody(draft), rowVersion: cycle.rowVersion } });

/** CYCLE-01.2: xóa chu kỳ bắt đầu nhầm, khi chưa có bản ghi nào. */
export const cancelCycle = (cycle: CycleView) =>
  api<void>(`/api/cultivation-cycles/${cycle.id}/cancel`, { method: "POST", body: { rowVersion: cycle.rowVersion } });

/** CYCLE-06 bước 1, 2, 4: tổng kết nếu đóng hôm nay và có phải đóng sớm không. */
export const closePreview = (cycleId: string) => api<CycleClosePreview>(`/api/cultivation-cycles/${cycleId}/close/preview`);

/** CYCLE-06: đóng hôm nay với đánh giá. Quản lý vùng đóng sớm phải xác nhận Chủ HTX đã đồng ý. */
export const closeCycle = (cycleId: string, assessment: string, rowVersion: string, ownerApproved: boolean) =>
  api<CycleClosed>(`/api/cultivation-cycles/${cycleId}/close`, { method: "POST", body: { assessment: assessment.trim(), rowVersion, ownerApproved } });

// ---- Thả giống (CYCLE-02)

/** Các lô giống chọn được: lô mua cho chính bè này trước. */
export const seedLots = (raftId: string) => api<SeedLotList>(`/api/rafts/${raftId}/seed-lots`);

/** Màn Thả giống của một chu kỳ: các luống, các phiên và tổng theo lô giống. */
export const seedingList = (cycleId: string) => api<SeedingList>(`/api/cultivation-cycles/${cycleId}/seeding-records`);

/** Lỗi của phiếu thả giống trước khi gửi; chuỗi rỗng là hợp lệ. */
export function seedingDraftError(draft: SeedingDraft, cycleStart: string): string {
  if (!draft.seedingDate) return "Chọn ngày thả giống.";
  if (draft.seedingDate > todayIso()) return "Ngày thả giống không được sau hôm nay.";
  if (draft.seedingDate < cycleStart) return "Ngày thả giống không được trước ngày bắt đầu chu kỳ.";
  if (!draft.seedLotId) return "Chọn lô giống đã thả.";
  if (draft.laneNumbers.length === 0) return "Chọn ít nhất một luống đã thả giống.";
  const quantity = parseNumber(draft.quantity);
  if (quantity === null || quantity <= 0) return "Lượng giống phải lớn hơn 0.";
  return "";
}

const seedingBody = (draft: SeedingDraft) => ({
  seedingDate: draft.seedingDate,
  seedLotId: draft.seedLotId,
  laneNumbers: draft.laneNumbers,
  quantity: parseNumber(draft.quantity),
});

/** CYCLE-02.0: một lô giống và các luống đã treo giống của lô đó. */
export const recordSeeding = (cycleId: string, draft: SeedingDraft) =>
  api<SeedingRecordSaved>(`/api/cultivation-cycles/${cycleId}/seeding-records`, { method: "POST", body: seedingBody(draft) });

/** CYCLE-02.2: sửa phiên, kèm lý do. */
export const correctSeeding = (record: SeedingRecordView, draft: SeedingDraft, reason: string) =>
  api<SeedingRecordSaved>(`/api/seeding-records/${record.id}`, { method: "PUT", body: { ...seedingBody(draft), reason: reason.trim(), rowVersion: record.rowVersion } });

/** CYCLE-02.2: xóa phiên, kèm lý do. */
export const removeSeeding = (record: SeedingRecordView, reason: string) =>
  api<void>(`/api/seeding-records/${record.id}/remove`, { method: "POST", body: { reason: reason.trim(), rowVersion: record.rowVersion } });

/** CYCLE-02.1 bước 2: số luống còn chưa thả trước khi đánh dấu thả giống xong. */
export const completionPreview = (cycleId: string) => api<SeedingCompletionPreview>(`/api/cultivation-cycles/${cycleId}/seeding-complete/preview`);

/** CYCLE-02.1: đánh dấu thả giống xong, một lần cho mỗi chu kỳ; báo Chủ HTX. */
export const completeSeeding = (cycleId: string, cycleRowVersion: string) =>
  api<unknown>(`/api/cultivation-cycles/${cycleId}/seeding-complete`, { method: "POST", body: { rowVersion: cycleRowVersion } });

// ---- Nhật ký nuôi (CYCLE-04)

/** Các nhật ký của chu kỳ, kèm link ảnh có hạn. */
export const listLogs = (cycleId: string) => api<CultivationLogView[]>(`/api/cultivation-cycles/${cycleId}/cultivation-logs`);

/** Lỗi của phiếu nhật ký trước khi gửi; chuỗi rỗng là hợp lệ. */
export function logDraftError(draft: CultivationLogDraft, cycleStart: string): string {
  if (!draft.visitDate) return "Chọn ngày đi kiểm tra bè.";
  if (draft.visitDate > todayIso()) return "Ngày kiểm tra không được sau hôm nay.";
  if (draft.visitDate < cycleStart) return "Ngày kiểm tra không được trước ngày bắt đầu chu kỳ.";
  if (draft.notes.length > CULTIVATION_LIMITS.notes) return `Ghi chú tối đa ${CULTIVATION_LIMITS.notes} ký tự.`;
  const photos = draft.keepPhotos.length + draft.newPhotos.length;
  if (photos === 0) return "Chụp ít nhất một ảnh bè.";
  if (photos > CULTIVATION_LIMITS.photos) return `Một nhật ký có tối đa ${CULTIVATION_LIMITS.photos} ảnh.`;
  if (draft.newPhotos.some((p) => p.size > CULTIVATION_LIMITS.photoBytes)) return "Mỗi ảnh tối đa 10 MB. Bỏ ảnh quá lớn rồi chụp lại.";
  return "";
}

function logForm(draft: CultivationLogDraft) {
  const form = new FormData();
  form.append("visitDate", draft.visitDate);
  if (draft.notes.trim()) form.append("notes", draft.notes.trim());
  draft.newPhotos.forEach((photo) => appendPhoto(form, "photos", photo));
  return form;
}

/** CYCLE-04.0: ngày đi bè, ghi chú và 1 đến 10 ảnh; báo Chủ HTX. */
export const recordLog = (cycleId: string, draft: CultivationLogDraft) =>
  api<CultivationLogSaved>(`/api/cultivation-cycles/${cycleId}/cultivation-logs`, { method: "POST", form: logForm(draft) });

/** CYCLE-04.1: ảnh cũ không giữ lại thì bị xóa; cần lý do. */
export function correctLog(log: CultivationLogView, draft: CultivationLogDraft, reason: string) {
  const form = logForm(draft);
  if (!draft.notes.trim()) form.append("notes", "");
  draft.keepPhotos.forEach((photo) => form.append("keepPhotoKeys", photo.key));
  form.append("reason", reason.trim());
  return api<CultivationLogSaved>(`/api/cultivation-logs/${log.id}`, { method: "PUT", form });
}

/** CYCLE-04.1: xóa nhật ký và ảnh, kèm lý do. */
export const removeLog = (log: CultivationLogView, reason: string) =>
  api<void>(`/api/cultivation-logs/${log.id}/remove`, { method: "POST", body: { reason: reason.trim() } });
