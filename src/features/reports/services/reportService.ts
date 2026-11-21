import type { HarvestYieldQuery, HarvestYieldReport } from "@/features/reports/models/HarvestYield";
import { api } from "@/services/httpClient";

/**
 * Sản lượng nuôi (HARVEST-04): Chủ HTX mọi vùng, Quản lý vùng trong vùng của mình, không có Kế toán. Vùng ngoài phạm vi
 * thì server trả MSG-GEN-08; ngày bắt đầu sau ngày kết thúc thì MSG-GEN-01.
 */
export function harvestYield(query: HarvestYieldQuery) {
  const params = new URLSearchParams({ groupBy: query.groupBy.toLowerCase() });
  if (query.from) params.set("from", query.from);
  if (query.to) params.set("to", query.to);
  if (query.zoneId) params.append("zoneIds", query.zoneId);
  return api<HarvestYieldReport>(`/api/harvest-yield?${params.toString()}`);
}
