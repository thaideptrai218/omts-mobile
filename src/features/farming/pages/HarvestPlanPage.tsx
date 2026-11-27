import type { HarvestPlan, HarvestPlanLine, HarvestPlanStep } from "@/features/farming/models/HarvestPlan";
import { useState } from "react";
import { Button, Input, Sheet, useNavigate, useParams } from "zmp-ui";

import { Badge } from "@/components/Badge/Badge";
import { ConfirmSheet } from "@/components/ConfirmSheet/ConfirmSheet";
import { Facts } from "@/components/Facts/Facts";
import FormError from "@/components/FormError/FormError";
import { Loadable } from "@/components/Loadable/Loadable";
import { ManagePage } from "@/components/ManagePage/ManagePage";
import { Section } from "@/components/Section/Section";
import { getHarvestPlan, skipPlanLanes, stepHarvestPlan, unskipPlanLanes } from "@/features/farming/services/harvestPlanService";
import { executorText, laneSummary, lineLabel, planStatusLabel, progressText } from "@/features/farming/utils/harvestPlanText";
import { useAction } from "@/hooks/useAction";
import { useLoad } from "@/hooks/useLoad";
import { date, dateTime, num, todayIso } from "@/utils/format";

/** Câu hỏi lại và chữ báo thành công của từng bước chuyển trạng thái. */
const STEPS: Record<HarvestPlanStep, { button: string; title: string; message: string; done: string }> = {
  receive: {
    button: "Nhận kế hoạch",
    title: "Nhận kế hoạch thu hoạch?",
    message: "Nhận rồi bạn ghi nhận thu được từng bè của kế hoạch.",
    done: "Đã nhận kế hoạch. Bạn ghi nhận thu được từng bè.",
  },
  "hand-over": {
    button: "Bàn giao cho Chủ HTX",
    title: "Bàn giao kế hoạch?",
    message: "Mọi bè đã có lô hoặc đã bỏ luống. Sau khi bàn giao, Chủ HTX kiểm tra và hoàn thành kế hoạch.",
    done: "Đã bàn giao. Chủ HTX đã được báo để hoàn thành kế hoạch.",
  },
  finish: {
    button: "Hoàn thành kế hoạch",
    title: "Hoàn thành kế hoạch thu hoạch?",
    message: "Mọi bè đã có lô hoặc đã bỏ luống. Các lô vẫn cân và bán như thường.",
    done: "Kế hoạch đã hoàn thành.",
  },
};

const ACTION_OF: Record<HarvestPlanStep, "Receive" | "HandOver" | "Finish"> = { receive: "Receive", "hand-over": "HandOver", finish: "Finish" };

/**
 * Một kế hoạch thu hoạch: tiến độ, các đơn được phục vụ và từng bè. Bè chờ thu có nút "Ghi nhận thu hoạch"; bè đã thu hiện lô và nút
 * "Cân lô này" sang phiếu cân của lô. Nút chuyển trạng thái (nhận, bàn giao, hoàn thành) chỉ hiện khi backend cho phép.
 */
export default function HarvestPlanPage() {
  const { id = "" } = useParams();
  const plan = useLoad(() => getHarvestPlan(id), [id]);
  const { busy, run } = useAction();
  const [asking, setAsking] = useState<HarvestPlanStep | null>(null);
  const [skipping, setSkipping] = useState<HarvestPlanLine | null>(null);

  const step = async (p: HarvestPlan, s: HarvestPlanStep) => {
    const saved = await run(() => stepHarvestPlan(p, s), STEPS[s].done);
    setAsking(null);
    if (saved) plan.setData(saved.plan);
    else void plan.reload();
  };

  const steps = (p: HarvestPlan) => (Object.keys(STEPS) as HarvestPlanStep[]).filter((s) => p.allowedActions.includes(ACTION_OF[s]));

  return (
    <ManagePage
      title={plan.data ? `Kế hoạch ${plan.data.code}` : "Kế hoạch thu hoạch"}
      footer={
        plan.data && steps(plan.data).length > 0 ? (
          <div className="sheet-actions">
            {steps(plan.data).map((s) => (
              <Button key={s} fullWidth size="large" disabled={busy} onClick={() => setAsking(s)}>
                {STEPS[s].button}
              </Button>
            ))}
          </div>
        ) : undefined
      }
    >
      <Loadable data={plan.data} error={plan.error} reload={() => void plan.reload()}>
        {(p) => {
          const status = planStatusLabel(p.statusId);
          const waitingReceive = p.allowedActions.includes("Receive");
          return (
            <>
              <Facts
                items={[
                  ["Trạng thái", <Badge key="status" text={status.text} tone={status.tone} />],
                  ["Thu lúc", dateTime(p.plannedAt)],
                  ["Người thu", executorText(p.executor)],
                  ["Vùng nuôi", p.zones.map((z) => `${z.code} · ${z.name}`).join(", ")],
                  ["Đơn hàng", p.orders.map((o) => (o.customer ? `${o.code} · ${o.customer.name}` : o.code)).join(", ") || null],
                  ["Tiến độ", progressText(p.progress)],
                  ["Ghi chú", p.note],
                ]}
              />
              {waitingReceive && <p className="form__hint">Bấm "Nhận kế hoạch" ở cuối trang rồi mới ghi nhận thu được từng bè.</p>}
              <Section title="Các bè cần thu">
                <div className="form">
                  {p.lines.map((line) => (
                    <LineCard key={line.id} plan={p} line={line} busy={busy} onSkip={() => setSkipping(line)}
                      onUnskip={async () => {
                        const lanes = line.lanes.filter((l) => l.state === "Skipped").map((l) => l.laneNumber);
                        const next = await run(() => unskipPlanLanes(p.id, line.id, lanes), "Đã đưa các luống trở lại kế hoạch.");
                        if (next) plan.setData(next);
                      }} />
                  ))}
                </div>
              </Section>
              {asking && (
                <ConfirmSheet visible title={STEPS[asking].title} message={STEPS[asking].message} confirmText={STEPS[asking].button}
                  busy={busy} onClose={() => setAsking(null)} onConfirm={() => void step(p, asking)} />
              )}
              <SkipSheet plan={p} line={skipping} onClose={() => setSkipping(null)} onSaved={(next) => { setSkipping(null); plan.setData(next); }} />
            </>
          );
        }}
      </Loadable>
    </ManagePage>
  );
}

/** Một bè của kế hoạch: luống, sản phẩm, số lồng dự kiến, lô đã thu và các nút của bè. */
function LineCard({ plan, line, busy, onSkip, onUnskip }: { plan: HarvestPlan; line: HarvestPlanLine; busy: boolean; onSkip: () => void; onUnskip: () => void }) {
  const navigate = useNavigate();
  const label = lineLabel(line);
  const open = line.state === "Open";
  const canHarvest = open && line.canHarvest && plan.allowedActions.includes("Harvest");
  const canSkip = open && line.canHarvest && plan.allowedActions.includes("SkipLane");
  const hasPlanned = line.lanes.some((l) => l.state === "Planned");
  const skipped = line.lanes.filter((l) => l.state === "Skipped");
  // Chỉ nhắc, không chặn: hàu của chu kỳ chưa đủ ngày thu theo ngày trưởng thành của giống.
  const early = open && line.expectedHarvestDate && line.expectedHarvestDate > todayIso() ? line.expectedHarvestDate : null;
  return (
    <div className="card form">
      <div>
        <p className="request__name">Bè {line.raftCode} · vùng {line.zone.code}</p>
        <p className="row__badges"><Badge text={label.text} tone={label.tone} /></p>
      </div>
      <p className="form__hint">
        {[
          line.expectedProduct?.name,
          line.expectedCageCount !== null ? `dự kiến ${num(line.expectedCageCount, "lồng")}` : null,
          ...laneSummary(line),
        ].filter(Boolean).join(" · ")}
      </p>
      {line.note && <p className="form__hint">Ghi chú: {line.note}</p>}
      {skipped.length > 0 && skipped[0].skipReason && <p className="form__hint">Lý do không thu: {skipped[0].skipReason}</p>}
      {early && <p className="form__hint">Hàu của bè dự kiến đủ ngày thu từ {date(early)}. Thu sớm hơn vẫn được, hãy kiểm tra hàu trước.</p>}
      {line.lot && (
        <>
          <p className="form__hint">
            Lô {line.lot.lotCode} · {num(line.lot.cageCount, "lồng")} · ước {num(line.lot.estimatedKg, "kg")} · thu lúc {dateTime(line.lot.harvestedAt)}
          </p>
          <Button fullWidth size="large" onClick={() => navigate(`/manage/weighings/${line.lot!.id}`)}>
            Cân lô này
          </Button>
        </>
      )}
      {canHarvest && hasPlanned && (
        <Button fullWidth size="large" disabled={busy} onClick={() => navigate(`/manage/harvest-plans/${plan.id}/lines/${line.id}`)}>
          Ghi nhận thu hoạch
        </Button>
      )}
      {canSkip && hasPlanned && (
        <Button fullWidth size="large" variant="secondary" disabled={busy} onClick={onSkip}>
          Không thu một số luống
        </Button>
      )}
      {canSkip && skipped.length > 0 && (
        <Button fullWidth size="large" variant="secondary" disabled={busy} onClick={onUnskip}>
          Thu lại các luống đã bỏ
        </Button>
      )}
    </div>
  );
}

/** Chọn luống không thu và ghi lý do; Chủ HTX được báo. Bỏ hết luống thì bè coi như xong. */
function SkipSheet({ plan, line, onClose, onSaved }: { plan: HarvestPlan; line: HarvestPlanLine | null; onClose: () => void; onSaved: (plan: HarvestPlan) => void }) {
  const { busy, run } = useAction();
  const [lanes, setLanes] = useState<number[]>([]);
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");
  const planned = line?.lanes.filter((l) => l.state === "Planned") ?? [];

  const close = () => {
    setLanes([]);
    setReason("");
    setError("");
    onClose();
  };

  const save = async () => {
    if (!line) return;
    if (lanes.length === 0) return setError("Chọn ít nhất một luống không thu.");
    if (!reason.trim()) return setError("Nhập lý do không thu.");
    if (reason.trim().length > 500) return setError("Lý do tối đa 500 ký tự.");
    setError("");
    const next = await run(() => skipPlanLanes(plan.id, line.id, lanes, reason), "Đã ghi các luống không thu. Chủ HTX đã được báo.");
    if (next) {
      setLanes([]);
      setReason("");
      onSaved(next);
    }
  };

  return (
    <Sheet visible={!!line} onClose={close} autoHeight mask handler swipeToClose={!busy} title={line ? `Không thu luống ở bè ${line.raftCode}` : ""}>
      <div className="sheet-form form">
        <p className="form__intro">Chọn các luống sẽ không thu lần này. Bỏ hết luống thì bè này coi như xong, không có lô.</p>
        <div className="crew-list">
          {planned.map((l) => (
            <label key={l.laneId} className="crew-choice">
              <input type="checkbox" checked={lanes.includes(l.laneNumber)} disabled={busy}
                onChange={(e) => setLanes((current) => (e.target.checked ? [...current, l.laneNumber] : current.filter((n) => n !== l.laneNumber)))} />
              <span>Luống {l.laneNumber}</span>
            </label>
          ))}
        </div>
        <Input.TextArea label="Lý do (bắt buộc)" value={reason} maxLength={500} showCount disabled={busy} onChange={(e) => setReason(e.target.value)} />
        <FormError text={error} />
        <div className="sheet-actions">
          <Button fullWidth size="large" loading={busy} disabled={busy} onClick={() => void save()}>
            Ghi luống không thu
          </Button>
          <Button fullWidth size="large" variant="secondary" disabled={busy} onClick={close}>
            Quay lại
          </Button>
        </div>
      </div>
    </Sheet>
  );
}
