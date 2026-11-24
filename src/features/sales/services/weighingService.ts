import type { PortWeighing } from "@/features/sales/models/PortWeighing";

import { api } from "@/services/httpClient";

/**
 * Lần cân cũ ở cảng (`api/port-weighings`), chỉ còn cho màn lập hóa đơn cũ. Backend đã gỡ API này khi chuyển sang cân từng lồng của lô
 * (chốt 24/11/2026, OMTS-227; xem `lotWeighingService`), nên màn đó cần làm lại theo phiếu cân của lô.
 */
export const getWeighing = (id: string) => api<PortWeighing>(`/api/port-weighings/${id}`);
