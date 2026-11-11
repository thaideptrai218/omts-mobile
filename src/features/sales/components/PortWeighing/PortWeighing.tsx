import type { PortWeighing } from "@/features/sales/models/PortWeighing";

import { Badge } from "@/components/Badge/Badge";
import { Facts } from "@/components/Facts/Facts";
import { dateTime, num } from "@/utils/format";

/** Trạng thái của lần cân: chờ thương lái chốt, đã chốt, đã lập hóa đơn. Có chữ, không chỉ dựa vào màu. */
export function WeighingBadge({ row }: { row: PortWeighing }) {
  if (row.invoiceId) return <Badge text={`Đã lập hóa đơn ${row.invoiceCode ?? ""}`.trim()} tone="neutral" />;
  if (row.confirmedAt) return <Badge text="Thương lái đã đồng ý" tone="success" />;
  return <Badge text="Chờ thương lái đồng ý" tone="warning" />;
}

/** "1: 20 kg · 2: 22,5 kg": kg của từng lồng theo thứ tự cân. */
export const cageList = (kgs: number[]) => kgs.map((kg, i) => `${i + 1}: ${num(kg, "kg")}`).join(" · ");

/** Số cân của một lần cân: tổng, rồi từng lô với kg của từng lồng. */
export function WeighingFacts({ row }: { row: PortWeighing }) {
  return (
    <>
      <Facts items={[
        ["Thương lái", row.customerName],
        ["Sản phẩm", row.productName],
        ["Cân lúc", dateTime(row.weighedAt)],
        ["Số lồng đã cân", `${num(row.cageCount, "lồng")} (đơn nhận ${num(row.acceptedCages, "lồng")})`],
        ["Tổng khối lượng", num(row.totalKg, "kg")],
        ["Trạng thái", <WeighingBadge key="status" row={row} />],
        ["Thương lái đồng ý lúc", row.confirmedAt ? dateTime(row.confirmedAt) : null],
      ]} />
      {row.lots.map((lot) => (
        <div key={lot.harvestLotId} className="card weighing-lot">
          <p className="weighing-lot__title">Lô {lot.lotCode}: {num(lot.cageKgs.length, "lồng")}, {num(lot.kg, "kg")}</p>
          <p className="weighing-lot__cages">{cageList(lot.cageKgs)}</p>
        </div>
      ))}
    </>
  );
}
