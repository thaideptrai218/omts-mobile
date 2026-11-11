import type { HarvestDraft, HarvestLane, HarvestOrderOption, HarvestScreen, LaneState } from "@/features/farming/models/Harvest";
import type { Tone } from "@/models/UI";
import { useState } from "react";
import { Button, Checkbox, useParams } from "zmp-ui";

import { Badge } from "@/components/Badge/Badge";
import { Empty } from "@/components/Empty/Empty";
import { Facts } from "@/components/Facts/Facts";
import FormError from "@/components/FormError/FormError";
import { Loadable } from "@/components/Loadable/Loadable";
import { ManagePage } from "@/components/ManagePage/ManagePage";
import { NumberInput } from "@/components/NumberInput/NumberInput";
import { Row } from "@/components/Row/Row";
import { Rows } from "@/components/Rows/Rows";
import { Section } from "@/components/Section/Section";
import { harvestDraftError, harvestScreen, recordHarvest } from "@/features/farming/services/harvestService";
import { useAction } from "@/hooks/useAction";
import { useLoad } from "@/hooks/useLoad";
import { date, num, parseNumber } from "@/utils/format";
import "@/features/farming/pages/RaftHarvestPage.scss";

const LANE_STATE: Record<LaneState, [string, Tone]> = {
  NotSeeded: ["Chưa thả giống", "neutral"],
  Growing: ["Đang nuôi", "success"],
  BeingHarvested: ["Đang thu hoạch", "warning"],
  Harvested: ["Đã thu hết", "neutral"],
};

const LOT_OPEN = 2901;
const LOT_REOPENED = 2902;

const emptyDraft = (purchaseRequestId = ""): HarvestDraft => ({ purchaseRequestId, laneNumbers: [], finishedLaneNumbers: [], cages: "", estimatedKg: "" });

/** Chọn sẵn đơn khi chỉ có một đơn theo kế hoạch của bè này, hoặc chỉ có một đơn đang chờ thu. */
function suggestedOrder(screen: HarvestScreen): string {
  const planned = screen.orders.filter((o) => o.plannedOnRaft);
  if (planned.length === 1) return planned[0].id;
  return screen.orders.length === 1 ? screen.orders[0].id : "";
}

/**
 * Thu hoạch một bè: các luống hôm nay, các lô của chu kỳ đang mở và phiếu ghi lô mới (HARVEST-01). Mỗi lần thu ghi cho một đơn đã nhận
 * (chốt 11/11/2026); hai người thu hai bè cho cùng một đơn thì mỗi người ghi một lô ở bè của mình.
 */
export default function RaftHarvestPage() {
  const { raftId = "" } = useParams();
  const screen = useLoad(() => harvestScreen(raftId), [raftId]);
  const [form, setForm] = useState(false);
  const [draft, setDraft] = useState(emptyDraft);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const { busy, run } = useAction();

  const toggle = (list: number[], n: number, on: boolean) => (on ? [...list.filter((x) => x !== n), n].sort((a, b) => a - b) : list.filter((x) => x !== n));
  const pickLane = (n: number, on: boolean) => {
    setDraft((d) => ({ ...d, laneNumbers: toggle(d.laneNumbers, n, on), finishedLaneNumbers: on ? d.finishedLaneNumbers : d.finishedLaneNumbers.filter((x) => x !== n) }));
    setError("");
  };

  const openForm = (s: HarvestScreen) => { setDraft(emptyDraft(suggestedOrder(s))); setError(""); setNotice(""); setForm(true); };

  const save = async () => {
    const problem = harvestDraftError(draft);
    setError(problem);
    if (problem || busy) return;
    const saved = await run(() => recordHarvest(raftId, draft), "Đã lưu lô thu hoạch.");
    if (!saved) return;
    const order = screen.data?.orders.find((o) => o.id === draft.purchaseRequestId);
    setNotice(`Đã tạo lô ${saved.lot.lotCode}: ${num(saved.lot.cageCount, "lồng")}, khoảng ${num(saved.lot.estimatedKg, "kg")}${order ? `, thu cho đơn ${order.code}` : ""}.`);
    setDraft(emptyDraft());
    setForm(false);
    await screen.reload();
  };

  const data = screen.data;
  const average = data?.averageKgPerCage ?? 0;
  const cages = Number(draft.cages.trim());
  const estimate = Number.isFinite(cages) && cages > 0 ? cages * average : null;
  const footer = !data ? undefined : form ? (
    <div className="sheet-actions">
      <Button fullWidth size="large" loading={busy} disabled={busy} onClick={() => void save()}>Lưu lô thu hoạch</Button>
      <Button fullWidth size="large" variant="secondary" disabled={busy} onClick={() => { setForm(false); setError(""); }}>Không, quay lại</Button>
    </div>
  ) : data.canRecordHarvest ? (
    <Button fullWidth size="large" disabled={data.orders.length === 0} onClick={() => openForm(data)}>Ghi thu hoạch</Button>
  ) : undefined;

  return (
    <ManagePage title={data ? `Thu hoạch bè ${data.raftCode}` : "Thu hoạch"} footer={footer} onBack={form ? () => setForm(false) : undefined}>
      {notice && <p className="card form harvest-notice" role="status">{notice}</p>}
      <Loadable data={data} error={screen.error} reload={() => void screen.reload()}>
        {(s) =>
          form ? (
            <div className="card form">
              <p className="form__intro">1. Lần thu này thu cho đơn nào (bắt buộc)</p>
              {s.orders.map((order) => (
                <OrderPick key={order.id} order={order} picked={draft.purchaseRequestId === order.id} disabled={busy}
                  onPick={(on) => { setDraft((d) => ({ ...d, purchaseRequestId: on ? order.id : "" })); setError(""); }} />
              ))}
              <p className="form__intro">2. Chọn các luống vừa thu. Luống đã hết hàu thì đánh dấu thêm "đã thu hết".</p>
              {s.lanes.filter((l) => l.canHarvest).map((lane) => (
                <LanePick key={lane.id} lane={lane} picked={draft.laneNumbers.includes(lane.laneNumber)} finished={draft.finishedLaneNumbers.includes(lane.laneNumber)}
                  disabled={busy} onPick={(on) => pickLane(lane.laneNumber, on)}
                  onFinish={(on) => setDraft((d) => ({ ...d, finishedLaneNumbers: toggle(d.finishedLaneNumbers, lane.laneNumber, on) }))} />
              ))}
              <NumberInput label="Số lồng thu được (bắt buộc)" value={draft.cages} disabled={busy} onChange={(cages) => { setDraft((d) => ({ ...d, cages })); setError(""); }} />
              <NumberInput label="Số kg ước tính (không bắt buộc)" decimal value={draft.estimatedKg} disabled={busy}
                helperText={estimate !== null && parseNumber(draft.estimatedKg) === null ? `Để trống: hệ thống tính ${num(estimate, "kg")} (${num(average, "kg")} mỗi lồng).` : `Để trống thì tính theo ${num(average, "kg")} mỗi lồng.`}
                onChange={(estimatedKg) => { setDraft((d) => ({ ...d, estimatedKg })); setError(""); }} />
              <FormError text={error} />
            </div>
          ) : (
            <>
              <Facts items={[
                ["Chu kỳ nuôi", s.cycle ? `Bắt đầu ${date(s.cycle.startDate)}` : "Không có chu kỳ đang mở"],
                ["Kg trung bình mỗi lồng", num(s.averageKgPerCage, "kg")],
              ]} />
              {!s.canRecordHarvest && <p className="form__hint">Chưa ghi được lô mới: bè cần chu kỳ đang mở và có luống đang nuôi.</p>}
              {s.canRecordHarvest && s.orders.length === 0 && (
                <p className="form__hint">Chưa có đơn nào đang chờ thu. Mỗi lần thu phải ghi cho một đơn HTX đã nhận và chưa đánh dấu thu xong.</p>
              )}
              <Section title="Các luống">
                {s.lanes.length ? (
                  <Rows>
                    {s.lanes.map((lane) => {
                      const [text, tone] = LANE_STATE[lane.state] ?? ["Khác", "neutral"];
                      return <Row key={lane.id} title={`Luống ${lane.laneNumber}`} badge={<Badge text={text} tone={tone} />} />;
                    })}
                  </Rows>
                ) : (
                  <Empty title="Bè chưa có luống" />
                )}
              </Section>
              <Section title="Các lô của chu kỳ">
                {s.lots.length ? (
                  <Rows>
                    {s.lots.map((lot) => {
                      const open = lot.statusId === LOT_OPEN || lot.statusId === LOT_REOPENED;
                      return (
                        <Row key={lot.id} title={lot.lotCode}
                          meta={`${date(lot.harvestDate)} · ${num(lot.cageCount, "lồng")} · khoảng ${num(lot.estimatedKg, "kg")} · đã bán ${num(lot.invoicedKg, "kg")}${lot.purchaseRequestCode ? ` · đơn ${lot.purchaseRequestCode}` : ""}`}
                          badge={<Badge text={open ? "Đang bán" : "Đã đóng"} tone={open ? "success" : "neutral"} />} />
                      );
                    })}
                  </Rows>
                ) : (
                  <Empty title="Chưa có lô thu hoạch" text="Bấm Ghi thu hoạch sau khi thu xong các luống." />
                )}
              </Section>
            </>
          )
        }
      </Loadable>
    </ManagePage>
  );
}

/** Một đơn chọn được: khung lớn, bấm chọn đơn này thì bỏ chọn đơn khác. */
function OrderPick({ order, picked, disabled, onPick }: { order: HarvestOrderOption; picked: boolean; disabled: boolean; onPick: (on: boolean) => void }) {
  return (
    <div className="harvest-lane">
      <Checkbox className="harvest-option" value={`order-${order.id}`} checked={picked} disabled={disabled} onChange={(e) => onPick(e.target.checked)}>
        <span className="harvest-order">
          <span className="harvest-order__title">{order.customerName} · {order.productName}</span>
          <span className="harvest-order__meta">
            Đơn {order.code} · đã thu {num(order.harvestedCages, "lồng")} trên {num(order.acceptedCages, "lồng")} · giao {date(order.pickupDate)}
          </span>
          {order.plannedOnRaft && <span className="harvest-order__meta">Theo kế hoạch ngày làm của bè này</span>}
        </span>
      </Checkbox>
    </div>
  );
}

function LanePick({ lane, picked, finished, disabled, onPick, onFinish }: {
  lane: HarvestLane; picked: boolean; finished: boolean; disabled: boolean; onPick: (on: boolean) => void; onFinish: (on: boolean) => void;
}) {
  return (
    <div className="harvest-lane">
      <Checkbox className="harvest-option" value={`lane-${lane.laneNumber}`} checked={picked} disabled={disabled} onChange={(e) => onPick(e.target.checked)}>
        Luống {lane.laneNumber} ({LANE_STATE[lane.state]?.[0] ?? "khác"})
      </Checkbox>
      {picked && (
        <Checkbox className="harvest-option" value={`finished-${lane.laneNumber}`} checked={finished} disabled={disabled} onChange={(e) => onFinish(e.target.checked)}>
          Luống {lane.laneNumber} đã thu hết
        </Checkbox>
      )}
    </div>
  );
}
