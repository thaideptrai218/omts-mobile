import type { HarvestYieldGroup, HarvestYieldGrouping, HarvestYieldReport, YieldPeriod, YieldRange } from "@/features/reports/models/HarvestYield";
import { useState } from "react";
import { Button, Select, Sheet } from "zmp-ui";

import { Badge } from "@/components/Badge/Badge";
import { Chips } from "@/components/Chips/Chips";
import DateField from "@/components/DateField/DateField";
import { Empty } from "@/components/Empty/Empty";
import { Facts } from "@/components/Facts/Facts";
import FormError from "@/components/FormError/FormError";
import { Loadable } from "@/components/Loadable/Loadable";
import { ManagePage } from "@/components/ManagePage/ManagePage";
import { Row } from "@/components/Row/Row";
import { Rows } from "@/components/Rows/Rows";
import { Section } from "@/components/Section/Section";
import { zoneLookup } from "@/features/farming/services/farmService";
import { harvestYield } from "@/features/reports/services/reportService";
import { cycleText, groupTitle, GROUPINGS, lotStatus, NOT_FINAL_TEXT, periodRange, PERIODS } from "@/features/reports/utils/yieldText";
import { useLoad } from "@/hooks/useLoad";
import { date, num } from "@/utils/format";
import "@/features/reports/pages/ReportsPage.scss";

/**
 * Báo cáo (`/manage/reports`). Backend hiện chỉ có báo cáo sản lượng nuôi (HARVEST-04, SCR-HARVEST-03): các lô thu hoạch
 * trong khoảng ngày, gom theo bè, vùng hoặc chu kỳ, với kg ước tính, đã bán, hao hụt và chênh lệch (BR-HARVEST-07). Số liệu
 * tính lúc xem; lô còn đang bán thì số còn đổi (MSG-HARVEST-04). Chủ HTX xem mọi vùng, Quản lý vùng xem vùng của mình.
 */
export default function ReportsPage() {
  const zones = useLoad(() => zoneLookup(true), []);
  const [period, setPeriod] = useState<YieldPeriod>("thisMonth");
  const [custom, setCustom] = useState<YieldRange>({ from: null, to: null });
  const [zoneId, setZoneId] = useState("");
  const [groupBy, setGroupBy] = useState<HarvestYieldGrouping>("Raft");
  const [open, setOpen] = useState<HarvestYieldGroup | null>(null);

  const waiting = period === "custom" && (!custom.from || !custom.to);
  const range = periodRange(period, custom);
  const report = useLoad(
    () => (waiting ? Promise.resolve(null) : harvestYield({ from: range.from, to: range.to, zoneId: zoneId || null, groupBy })),
    [waiting, range.from, range.to, zoneId, groupBy],
  );

  return (
    <ManagePage title="Báo cáo">
      <Section title="Sản lượng nuôi">
        <div className="form">
          <p className="form__hint">Khoảng ngày thu hoạch</p>
          <Chips options={PERIODS} value={period} onChange={setPeriod} />
          {period === "custom" && <CustomRange value={custom} onApply={setCustom} />}
          {zones.data && zones.data.length > 1 && (
            <div className="card form">
              <Select label="Vùng nuôi" value={zoneId} onChange={(v) => setZoneId(String(v ?? ""))} closeOnSelect>
                <Select.Option value="" title="Tất cả vùng" />
                {zones.data.map((z) => (
                  <Select.Option key={z.id} value={z.id} title={z.name ?? z.code ?? ""} />
                ))}
              </Select>
            </div>
          )}
          <p className="form__hint">Gom số liệu</p>
          <Chips options={GROUPINGS} value={groupBy} onChange={setGroupBy} />
        </div>
      </Section>

      {waiting ? (
        <p className="form__hint">Chọn từ ngày, đến ngày rồi bấm “Xem báo cáo”.</p>
      ) : (
        <Loadable data={report.data} error={report.error} reload={() => void report.reload()}>
          {(r) => <YieldResult report={r} onOpen={setOpen} />}
        </Loadable>
      )}

      <Sheet visible={!!open} onClose={() => setOpen(null)} autoHeight mask handler swipeToClose title={open && report.data ? groupTitle(open, report.data.groupBy) : ""}>
        {open && report.data && <GroupLots group={open} groupBy={report.data.groupBy} />}
      </Sheet>
    </ManagePage>
  );
}

/** Khoảng ngày tự chọn: chỉ tải báo cáo khi bấm "Xem báo cáo". */
function CustomRange({ value, onApply }: { value: YieldRange; onApply: (range: YieldRange) => void }) {
  const [from, setFrom] = useState<string | null>(value.from);
  const [to, setTo] = useState<string | null>(value.to);
  const [error, setError] = useState("");

  const apply = () => {
    if (!from || !to) {
      setError("Vui lòng chọn đủ từ ngày và đến ngày.");
      return;
    }
    if (from > to) {
      setError("Từ ngày không được sau đến ngày.");
      return;
    }
    setError("");
    onApply({ from, to });
  };

  return (
    <div className="card form">
      <DateField label="Từ ngày" value={from} onChange={setFrom} />
      <DateField label="Đến ngày" value={to} onChange={setTo} />
      <FormError text={error} />
      <Button fullWidth size="large" onClick={apply}>
        Xem báo cáo
      </Button>
    </div>
  );
}

function YieldResult({ report, onOpen }: { report: HarvestYieldReport; onOpen: (group: HarvestYieldGroup) => void }) {
  const t = report.totals;
  return (
    <>
      <p className="form__hint">
        Lô thu hoạch từ {date(report.from)} đến {date(report.to)}
      </p>
      {t.lotCount === 0 ? (
        <Empty title="Không có lô nào" text="Không có lô thu hoạch trong khoảng ngày và vùng đã chọn. Hãy chọn lại." />
      ) : (
        <>
          {report.notFinalNotice && (
            <div className="card yield-notice">
              <Badge text="Chưa chốt" tone="warning" />
              <span>{NOT_FINAL_TEXT}</span>
            </div>
          )}
          <div className="summary">
            <Cell label="Số lô" value={num(t.lotCount)} />
            <Cell label="Ước tính" value={num(t.estimatedKg, "kg")} />
            <Cell label="Đã bán" value={num(t.soldKg, "kg")} tone="success" />
            <Cell label="Hao hụt" value={num(t.lostKg, "kg")} tone={t.lostKg > 0 ? "warning" : undefined} />
            <Cell label="Chênh lệch" value={num(t.differenceKg, "kg")} />
          </div>
          <p className="form__hint">
            Đã bán là kg trên hóa đơn trừ kg trả lại. Hao hụt là kg còn lại khi đóng lô và kg hủy. Chênh lệch là ước tính trừ đã bán và hao hụt.
          </p>
          <Section title={GROUPINGS.find(([key]) => key === report.groupBy)?.[1] ?? "Các nhóm"}>
            <p className="form__hint">Số bên phải là kg đã bán. Bấm vào một dòng để xem từng lô.</p>
            <Rows>
              {report.groups.map((g) => (
                <Row
                  key={g.key}
                  title={groupTitle(g, report.groupBy)}
                  meta={[report.groupBy !== "Zone" && g.zoneName, num(g.lotCount, "lô"), `ước tính ${num(g.estimatedKg, "kg")}`, g.lostKg ? `hao hụt ${num(g.lostKg, "kg")}` : null]
                    .filter(Boolean)
                    .join(" · ")}
                  value={num(g.soldKg, "kg")}
                  badge={g.notFinal ? <Badge text="Chưa chốt" tone="warning" /> : undefined}
                  onClick={() => onOpen(g)}
                />
              ))}
            </Rows>
          </Section>
        </>
      )}
    </>
  );
}

function Cell({ label, value, tone }: { label: string; value: string; tone?: "success" | "warning" }) {
  return (
    <div className={`summary__cell${tone ? ` tone-${tone}` : ""}`}>
      <span className="summary__label">{label}</span>
      <span className="summary__value">{value}</span>
    </div>
  );
}

/** Số liệu của một nhóm và từng lô, lô thu sớm nhất trước. */
function GroupLots({ group, groupBy }: { group: HarvestYieldGroup; groupBy: HarvestYieldGrouping }) {
  return (
    <div className="sheet-form form yield-sheet">
      <Facts
        items={[
          ["Vùng nuôi", groupBy === "Zone" ? null : group.zoneName],
          ["Chu kỳ nuôi", cycleText(group)],
          ["Số lô", num(group.lotCount)],
          ["Ước tính", num(group.estimatedKg, "kg")],
          ["Đã bán", num(group.soldKg, "kg")],
          ["Hao hụt", num(group.lostKg, "kg")],
          ["Chênh lệch", num(group.differenceKg, "kg")],
        ]}
      />
      <Rows>
        {group.lots.map((lot) => {
          const s = lotStatus(lot);
          return (
            <Row
              key={lot.id}
              title={`Lô ${lot.lotCode}`}
              meta={[
                `Thu ${date(lot.harvestDate)}`,
                groupBy !== "Raft" && `bè ${lot.raftCode}`,
                `ước tính ${num(lot.estimatedKg, "kg")}`,
                lot.returnedKg ? `trả lại ${num(lot.returnedKg, "kg")}` : null,
                lot.lostKg ? `hao hụt ${num(lot.lostKg, "kg")}` : null,
                !lot.inPeriod && "ngoài khoảng ngày đã chọn",
              ]
                .filter(Boolean)
                .join(" · ")}
              value={num(lot.soldKg, "kg")}
              badge={<Badge text={s.text} tone={s.tone} />}
            />
          );
        })}
      </Rows>
    </div>
  );
}
