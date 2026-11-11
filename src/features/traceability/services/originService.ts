import type { PublicOrigin, PublicOriginDetail, PublicOriginLot } from "@/features/traceability/models/PublicOrigin";
import type { TraceLot, TraceStep } from "@/features/traceability/models/TraceLot";
import { api } from "@/services/httpClient";
import { date, num } from "@/utils/format";

/** Trang truy xuất công khai của một mã QR: không cần đăng nhập, không gửi token. */
export const publicOrigin = (token: string) => api<PublicOrigin>(`/api/origin/${encodeURIComponent(token)}`, { auth: false });

/** "850 kg" khi dưới 1 tấn, "6,2 tấn" khi từ 1 tấn trở lên. */
function weight(kg: number) {
  return kg >= 1000 ? num(Math.round(kg / 100) / 10, "tấn") : num(kg, "kg");
}

function water(detail: PublicOriginDetail) {
  const w = detail.water;
  if (w.measurementCount === 0) return "Chưa có lần đo nước trong thời gian nuôi";
  const parts = [
    w.averageSalinity !== null ? `độ mặn trung bình ${num(w.averageSalinity)}‰` : null,
    w.averageTemperature !== null ? `nhiệt độ ${num(w.averageTemperature)} °C` : null,
    w.averagePh !== null ? `pH ${num(w.averagePh)}` : null,
  ].filter(Boolean);
  const text = parts.join(", ");
  return `${text.charAt(0).toUpperCase()}${text.slice(1)} (${num(w.measurementCount)} lần đo)`;
}

function steps(detail: PublicOriginDetail): TraceStep[] {
  const seeds = detail.seedLots.map((s) =>
    [s.itemName ?? "Hàu giống", s.supplierLotCode ? `lô giống ${s.supplierLotCode}` : null, `từ ${s.supplierName}`].filter(Boolean).join(", "));
  const received = detail.seedLots.map((s) => s.receivedOn).sort();
  const seeding = detail.firstSeedingDate === detail.lastSeedingDate
    ? date(detail.firstSeedingDate)
    : `${date(detail.firstSeedingDate)} đến ${date(detail.lastSeedingDate)}`;
  const sold = detail.weighedCages > 0
    ? `Cân tại cảng ${num(detail.weighedCages, "lồng")}, tổng ${num(detail.soldKg, "kg")}.`
    : `Bán ${num(detail.soldKg, "kg")}.`;
  return [
    ...(seeds.length ? [{ title: "Nhận giống", date: date(received[0]), detail: `${seeds.join("; ")}.` }] : []),
    ...(detail.firstSeedingDate
      ? [{ title: "Thả giống", date: seeding, detail: `Thả xuống ${num(detail.laneCount, "luống")} của bè ${detail.raftCode}, ${detail.zoneName}.` }]
      : []),
    {
      title: "Chăm sóc và theo dõi",
      date: `${date(detail.cycleStartDate)} đến ${date(detail.harvestDate)}`,
      detail: `${num(detail.cultivationLogCount)} lần ghi nhật ký nuôi, ${num(detail.water.measurementCount)} lần đo chỉ số nước.`,
    },
    { title: "Thu hoạch", date: date(detail.harvestDate), detail: `Thu ${num(detail.harvestedCages, "lồng")}, khoảng ${weight(detail.harvestedKg)}.` },
    { title: "Bán ra", date: date(detail.soldOn), detail: sold },
  ];
}

function traceLot(lot: PublicOriginLot, publisher: string): TraceLot {
  const detail = lot.detail;
  if (!detail) {
    return { code: lot.lotCode, publisher, withdrawn: date(lot.withdrawnAt), product: "", zone: "", harvestDate: "", weight: "", water: "", steps: [] };
  }
  return {
    code: lot.lotCode,
    publisher,
    withdrawn: null,
    product: detail.productNames.join(", "),
    zone: `${detail.zoneName}, bè ${detail.raftCode}`,
    harvestDate: date(detail.harvestDate),
    weight: weight(detail.soldKg),
    water: water(detail),
    steps: steps(detail),
  };
}

/** Các lô của trang truy xuất, chữ đã sẵn để hiện. */
export const toTraceLots = (origin: PublicOrigin): TraceLot[] => origin.lots.map((lot) => traceLot(lot, origin.cooperativeName));
