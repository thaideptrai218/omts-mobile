import type {
  AddLotCage, AgreeLotWeighing, CompleteLotWeighing, LotWeighed, LotWeighingSheet, TraderWeighingPage, UpdateLotCage, WeighingLotPage,
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

/** Phiếu cân của thương lái đang đăng nhập (chốt 24/11/2026, OMTS-227): chỉ lô của đơn của mình, mới thu trước. */
export const myWeighingLots = (page: number) => api<TraderWeighingPage>(`/api/me/weighings?page=${page}&pageSize=20`);

export const myWeighingSheet = (lotId: string) => api<LotWeighingSheet>(`/api/me/weighings/${lotId}`);

/** Thương lái tự cân một lồng bên cạnh HTX; số của HTX vẫn là số chính thức. */
export const addMyCage = (lotId: string, body: AddLotCage) => api<LotWeighingSheet>(`/api/me/weighings/${lotId}/cages`, { method: "POST", body });

export const updateMyCage = (lotId: string, cageId: string, body: UpdateLotCage) =>
  api<LotWeighingSheet>(`/api/me/weighings/${lotId}/cages/${cageId}`, { method: "PUT", body });

export const removeMyCage = (lotId: string, cageId: string) => api<LotWeighingSheet>(`/api/me/weighings/${lotId}/cages/${cageId}`, { method: "DELETE" });

/** "Đồng ý số cân": thương lái đồng ý theo số HTX đã hoàn tất; chưa đồng ý thì HTX không lập được hóa đơn cho lô. */
export const agreeWeighing = (lotId: string, body: AgreeLotWeighing) => api<LotWeighingSheet>(`/api/me/weighings/${lotId}/agree`, { method: "POST", body });

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
