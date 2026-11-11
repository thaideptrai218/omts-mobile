import type { MyPortWeighingList, PortWeighing, PortWeighingLotEntry, WeighingLotDraft } from "@/features/sales/models/PortWeighing";
import { api } from "@/services/httpClient";
import { parseNumber } from "@/utils/format";

/** Các lần cân của một đơn đã đồng ý, cho quản lý vùng và Chủ HTX. */
export const requestWeighings = (requestId: string) => api<PortWeighing[]>(`/api/port-weighings?purchaseRequestId=${requestId}`);
export const getWeighing = (id: string) => api<PortWeighing>(`/api/port-weighings/${id}`);
export const createWeighing = (requestId: string, lots: PortWeighingLotEntry[]) =>
  api<PortWeighing>("/api/port-weighings", { method: "POST", body: { purchaseRequestId: requestId, lots } });
export const updateWeighing = (row: PortWeighing, lots: PortWeighingLotEntry[]) =>
  api<PortWeighing>(`/api/port-weighings/${row.id}`, { method: "PUT", body: { lots, rowVersion: row.rowVersion } });

/** Phiếu cân của thương lái đang đăng nhập. */
export const myWeighings = (page = 1) => api<MyPortWeighingList>(`/api/me/port-weighings?page=${page}&pageSize=20`);
export const myWeighing = (id: string) => api<PortWeighing>(`/api/me/port-weighings/${id}`);
/** Thương lái chốt số cân; số đã bị sửa sau khi đọc thì server trả 409. */
export const confirmWeighing = (row: PortWeighing) =>
  api<PortWeighing>(`/api/me/port-weighings/${row.id}/confirm`, { method: "POST", body: { rowVersion: row.rowVersion } });

/** Kg của một lồng gõ vào: số lớn hơn 0, tối đa 3 chữ số thập phân; null khi sai. */
export function cageKg(text: string): number | null {
  const kg = parseNumber(text);
  return kg !== null && kg > 0 && Math.round(kg * 1000) === kg * 1000 ? kg : null;
}

/** Lỗi của phiếu cân trước khi gửi; chuỗi rỗng là hợp lệ. */
export function weighingDraftError(lots: WeighingLotDraft[]): string {
  if (lots.length === 0) return "Chọn ít nhất một lô hàu để cân.";
  for (const lot of lots) {
    if (lot.cageKgs.length === 0) return `Lô ${lot.lotCode} chưa có lồng nào.`;
    const wrong = lot.cageKgs.findIndex((kg) => cageKg(kg) === null);
    if (wrong >= 0) return `Lô ${lot.lotCode}, lồng ${wrong + 1}: nhập số kg lớn hơn 0.`;
  }
  return "";
}

export const toLotEntries = (lots: WeighingLotDraft[]): PortWeighingLotEntry[] =>
  lots.map((lot) => ({ harvestLotId: lot.harvestLotId, cageKgs: lot.cageKgs.map((kg) => cageKg(kg) ?? 0) }));

/** Tổng kg của các lồng đã nhập đúng. */
export const draftKg = (kgs: string[]) => kgs.reduce((sum, kg) => sum + (cageKg(kg) ?? 0), 0);
