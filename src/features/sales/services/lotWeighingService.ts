import type {
  AddLotCage, CompleteLotWeighing, LotWeighed, LotWeighingSheet, UpdateLotCage, WeighingLotPage,
} from "@/features/sales/models/LotWeighing";

import { api } from "@/services/httpClient";
import { parseNumber } from "@/utils/format";

/** Lô chờ cân (`weighed=false`) hoặc lô đã cân, mới thu trước; backend tự lọc theo vùng của người dùng. */
export const listWeighingLots = (weighed: boolean, page: number) =>
  api<WeighingLotPage>(`/api/harvest-lots?weighed=${weighed}&sort=harvestedAt&sortDir=desc&page=${page}&pageSize=20`);

export const weighingSheet = (lotId: string) => api<LotWeighingSheet>(`/api/harvest-lots/${lotId}/cages`);

export const addCage = (lotId: string, body: AddLotCage) => api<LotWeighingSheet>(`/api/harvest-lots/${lotId}/cages`, { method: "POST", body });

export const updateCage = (lotId: string, cageId: string, body: UpdateLotCage) =>
  api<LotWeighingSheet>(`/api/harvest-lots/${lotId}/cages/${cageId}`, { method: "PUT", body });

export const removeCage = (lotId: string, cageId: string) => api<LotWeighingSheet>(`/api/harvest-lots/${lotId}/cages/${cageId}`, { method: "DELETE" });

/** "Hoàn tất": lô lấy tổng kg các lồng; server quyết định kg cân của lô. */
export const completeWeighing = (lotId: string, body: CompleteLotWeighing) => api<LotWeighed>(`/api/harvest-lots/${lotId}/weigh`, { method: "POST", body });

/** Kg của một lồng gõ vào: số lớn hơn 0, tối đa 3 chữ số thập phân; null khi sai. */
export function cageKg(text: string): number | null {
  const kg = parseNumber(text);
  return kg !== null && kg > 0 && Math.round(kg * 1000) === kg * 1000 ? kg : null;
}

/** Mã một lần gửi lồng, giữ nguyên khi gửi lại sau lỗi mạng để server không cân trùng. Webview cũ có thể chưa có `crypto.randomUUID`. */
export function newOperationId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") return crypto.randomUUID();
  const hex = (n: number) => Array.from({ length: n }, () => Math.floor(Math.random() * 16).toString(16)).join("");
  return `${hex(8)}-${hex(4)}-4${hex(3)}-${(8 + Math.floor(Math.random() * 4)).toString(16)}${hex(3)}-${hex(12)}`;
}
