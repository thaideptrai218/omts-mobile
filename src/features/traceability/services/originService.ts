import type { ProvenanceLot, ProvenanceOrigin, ProvenancePage } from "@/features/traceability/models/PublicOrigin";
import type { TraceLookupResult, TraceLot, TraceStep } from "@/features/traceability/models/TraceLot";
import { api } from "@/services/httpClient";
import { date, num } from "@/utils/format";

/** Trang truy xuất công khai của một mã QR hóa đơn: không cần đăng nhập, không gửi token. */
export const publicOrigin = (token: string) =>
  api<ProvenancePage>(`/api/public/provenance/${encodeURIComponent(token)}?lang=vi`, { auth: false });

function steps(origin: ProvenanceOrigin): TraceStep[] {
  const seedings = origin.seedings.map((s) => ({ title: "Thả giống", date: date(s.seedingDate), detail: `${s.seedItemName}.` }));
  const place = `bè ${origin.raftCode}, ${origin.zoneName}`;
  return [
    ...seedings,
    ...(origin.daysOfFarming !== null ? [{ title: "Nuôi", date: `${num(origin.daysOfFarming)} ngày`, detail: `Nuôi tại ${place}.` }] : []),
    { title: "Thu hoạch", date: date(origin.harvestDate), detail: `Thu hoạch tại ${place}.` },
  ];
}

function traceLot(lot: ProvenanceLot, publisher: string): TraceLot {
  const origin = lot.origin;
  if (!origin) {
    return { code: lot.lotCode, publisher, withdrawn: date(lot.withdrawalDate), product: "", zone: "", harvestDate: "", farmingTime: "", steps: [] };
  }
  return {
    code: lot.lotCode,
    publisher,
    withdrawn: null,
    product: lot.products.join(", "),
    zone: `${origin.zoneName}, bè ${origin.raftCode}`,
    harvestDate: date(origin.harvestDate),
    farmingTime: origin.daysOfFarming !== null ? `${num(origin.daysOfFarming)} ngày` : "",
    steps: steps(origin),
  };
}

/** Các lô của trang truy xuất, chữ đã sẵn để hiện, kèm thông báo của máy chủ khi không có lô nào. */
export const toTraceResult = (page: ProvenancePage): TraceLookupResult => ({
  lots: page.lots.map((lot) => traceLot(lot, page.cooperative.fullName)),
  message: page.lots.length === 0 ? page.message : null,
});
