import type { PurchaseHarvest as Harvest, PurchaseRequest } from "@/features/sales/models/PurchaseRequest";
import { useState } from "react";
import { Button } from "zmp-ui";

import { ConfirmSheet } from "@/components/ConfirmSheet/ConfirmSheet";
import { Empty } from "@/components/Empty/Empty";
import { Facts } from "@/components/Facts/Facts";
import { Row } from "@/components/Row/Row";
import { Rows } from "@/components/Rows/Rows";
import { Section } from "@/components/Section/Section";
import { clearHarvestDone, markHarvestDone } from "@/features/sales/services/salesService";
import { useAction } from "@/hooks/useAction";
import { dateTime, num } from "@/utils/format";

/** So số lồng đã thu với số lồng HTX nhận đơn: thu thiếu hoặc dư vẫn đánh dấu được, chỉ nhắc cho Chủ HTX biết. */
function gapText(harvest: Harvest, accepted: number | null): string {
  if (accepted === null) return `Đã thu ${num(harvest.harvestedCages, "lồng")}.`;
  const gap = harvest.harvestedCages - accepted;
  const base = `Đã thu ${num(harvest.harvestedCages, "lồng")} trên ${num(accepted, "lồng")} đã nhận đơn`;
  return gap < 0 ? `${base}, còn thiếu ${num(-gap, "lồng")}.` : gap > 0 ? `${base}, dư ${num(gap, "lồng")}.` : `${base}, đủ số lồng.`;
}

/**
 * Thu hoạch của một đơn đã nhận (chốt 11/11/2026): các lô đã ghi cho đơn ở mọi bè, và nút "Đã thu xong" của Chủ HTX. Đánh dấu xong thì
 * không ghi thêm lô cho đơn và bắt đầu cân được; bỏ đánh dấu được khi đơn chưa cân lần nào.
 */
export default function PurchaseHarvest({ row, onUpdated }: { row: PurchaseRequest; onUpdated: (row: PurchaseRequest) => void }) {
  const harvest = row.harvest;
  const [asking, setAsking] = useState<"mark" | "clear" | null>(null);
  const { busy, run } = useAction();
  if (row.statusId !== 3202 || !harvest) return null;

  const confirm = async () => {
    const mark = asking === "mark";
    const saved = await run(() => (mark ? markHarvestDone(row) : clearHarvestDone(row)), mark ? "Đã đánh dấu đơn đã thu xong." : "Đã bỏ đánh dấu thu xong.");
    setAsking(null);
    if (saved) onUpdated(saved);
  };

  return (
    <Section title="Thu hoạch cho đơn">
      <Facts items={[
        ["Tình trạng", harvest.completedAt ? `Đã thu xong lúc ${dateTime(harvest.completedAt)}` : "Đang thu, chưa đánh dấu thu xong"],
        ["Người đánh dấu", harvest.completedByName],
        ["Số lồng đã thu", gapText(harvest, row.response?.acceptedCages ?? null)],
      ]} />
      {harvest.lots.length ? (
        <Rows>
          {harvest.lots.map((lot) => (
            <Row key={lot.id} title={`Lô ${lot.lotCode}`}
              meta={`Vùng ${lot.zoneCode} · bè ${lot.raftCode} · ${num(lot.cageCount, "lồng")} · thu lúc ${dateTime(lot.harvestedAt)}${lot.recordedByName ? ` · ${lot.recordedByName} ghi` : ""}`} />
          ))}
        </Rows>
      ) : (
        <Empty title="Chưa có lô nào thu cho đơn này" text="Quản lý vùng ghi thu hoạch ở bè và chọn đơn này." />
      )}
      {!harvest.completedAt && harvest.lots.length > 0 && !harvest.canMarkDone && <p className="form__hint">Chỉ Chủ HTX đánh dấu được đơn đã thu xong.</p>}
      {harvest.completedAt && !harvest.canUnmarkDone && <p className="form__hint">Đơn đã cân nên giữ nguyên đánh dấu thu xong.</p>}
      <div className="button-stack">
        {harvest.canMarkDone && <Button fullWidth size="large" disabled={busy} onClick={() => setAsking("mark")}>Đã thu xong</Button>}
        {harvest.canUnmarkDone && <Button fullWidth size="large" variant="secondary" disabled={busy} onClick={() => setAsking("clear")}>Bỏ đánh dấu thu xong</Button>}
      </div>
      <ConfirmSheet visible={asking === "mark"} busy={busy} title="Đánh dấu đơn đã thu xong?" confirmText="Đúng, đã thu xong"
        message={<>
          <p>{gapText(harvest, row.response?.acceptedCages ?? null)}</p>
          <p>Sau khi đánh dấu, không ghi thêm lô cho đơn {row.code} nữa và bắt đầu cân tại cảng được.</p>
        </>}
        onClose={() => setAsking(null)} onConfirm={() => void confirm()} />
      <ConfirmSheet visible={asking === "clear"} busy={busy} title="Bỏ đánh dấu thu xong?" confirmText="Bỏ đánh dấu"
        message={<p>Đơn {row.code} sẽ ghi thêm lô được, và chưa cân được cho tới khi đánh dấu thu xong lại.</p>}
        onClose={() => setAsking(null)} onConfirm={() => void confirm()} />
    </Section>
  );
}
