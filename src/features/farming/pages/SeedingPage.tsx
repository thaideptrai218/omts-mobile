import type { LaneState } from "@/features/farming/models/Harvest";
import type { SeedingCompletionPreview, SeedingDraft, SeedingList, SeedingRecordView, SeedLotList } from "@/features/farming/models/Seeding";
import type { Tone } from "@/models/UI";
import { useState } from "react";
import { Button, Checkbox, Select, useParams } from "zmp-ui";

import { Badge } from "@/components/Badge/Badge";
import { ConfirmSheet } from "@/components/ConfirmSheet/ConfirmSheet";
import DateField from "@/components/DateField/DateField";
import { Empty } from "@/components/Empty/Empty";
import { Facts } from "@/components/Facts/Facts";
import FormError from "@/components/FormError/FormError";
import { Loadable } from "@/components/Loadable/Loadable";
import { ManagePage } from "@/components/ManagePage/ManagePage";
import { NumberInput } from "@/components/NumberInput/NumberInput";
import { ReasonSheet } from "@/components/ReasonSheet/ReasonSheet";
import { Row } from "@/components/Row/Row";
import { Rows } from "@/components/Rows/Rows";
import { Section } from "@/components/Section/Section";
import {
  completeSeeding, completionPreview, correctSeeding, CULTIVATION_LIMITS, getCycle, recordSeeding, removeSeeding, seedingDraftError, seedingList, seedLots,
} from "@/features/farming/services/cultivationService";
import { useAction } from "@/hooks/useAction";
import { useLoad } from "@/hooks/useLoad";
import { date, num, todayIso } from "@/utils/format";
import "@/features/farming/styles/laneOptions.scss";

const LANE_STATE: Record<LaneState, [string, Tone]> = {
  NotSeeded: ["Chưa thả giống", "warning"],
  Growing: ["Đang nuôi", "success"],
  BeingHarvested: ["Đang thu hoạch", "neutral"],
  Harvested: ["Đã thu hết", "neutral"],
};

const emptyDraft = (): SeedingDraft => ({ seedingDate: todayIso(), seedLotId: "", laneNumbers: [], quantity: "" });

const draftOf = (record: SeedingRecordView): SeedingDraft => ({
  seedingDate: record.seedingDate, seedLotId: record.seedLot.id, laneNumbers: [...record.laneNumbers], quantity: String(record.quantity).replace(".", ","),
});

const lanesText = (lanes: number[]) => (lanes.length ? `luống ${lanes.join(", ")}` : "không còn luống nào");

/** Thả giống của một chu kỳ (CYCLE-02, SCR-CYCLE-02): mỗi phiên là một lô giống treo trên một hoặc nhiều luống. */
export default function SeedingPage() {
  const { cycleId = "" } = useParams();
  const data = useLoad(async () => {
    const [list, cycle] = await Promise.all([seedingList(cycleId), getCycle(cycleId)]);
    return { list, cycle };
  }, [cycleId]);
  const [lots, setLots] = useState<SeedLotList | null>(null);
  /** null: đang xem; "new": ghi phiên mới; một phiên: đang sửa phiên đó. */
  const [editing, setEditing] = useState<"new" | SeedingRecordView | null>(null);
  const [draft, setDraft] = useState(emptyDraft);
  const [error, setError] = useState("");
  const [reasonFor, setReasonFor] = useState<"correct" | "remove" | null>(null);
  const [completion, setCompletion] = useState<SeedingCompletionPreview | null>(null);
  const { busy, run } = useAction();

  const openForm = async (list: SeedingList, record: SeedingRecordView | null) => {
    const found = lots ?? (await run(() => seedLots(list.raftId)));
    if (!found) return;
    setLots(found);
    setDraft(record ? draftOf(record) : emptyDraft());
    setError("");
    setEditing(record ?? "new");
  };

  const close = () => { setEditing(null); setError(""); };

  const review = async () => {
    const problem = seedingDraftError(draft, data.data?.cycle.startDate ?? "");
    setError(problem);
    if (problem || busy) return;
    if (editing !== "new") { setReasonFor("correct"); return; }
    const saved = await run(() => recordSeeding(cycleId, draft), "Đã lưu phiên thả giống.");
    if (!saved) return;
    close();
    await data.reload();
    if (saved.offerMarkComplete) await askCompletion();
  };

  const withReason = async (reason: string): Promise<boolean> => {
    if (!editing || editing === "new") return false;
    const done = reasonFor === "correct"
      ? await run(async () => { await correctSeeding(editing, draft, reason); return true; }, "Đã sửa phiên thả giống.")
      : await run(async () => { await removeSeeding(editing, reason); return true; }, "Đã xóa phiên thả giống.");
    if (!done) return false;
    setReasonFor(null);
    close();
    await data.reload();
    return true;
  };

  const askCompletion = async () => {
    const preview = await run(() => completionPreview(cycleId));
    if (preview) setCompletion(preview);
  };

  const complete = async () => {
    if (!completion) return;
    const done = await run(() => completeSeeding(cycleId, completion.cycleRowVersion), "Đã đánh dấu thả giống xong.");
    setCompletion(null);
    if (done) await data.reload();
  };

  const loaded = data.data;
  // Chân trang dính chỉ giữ nút chính; nút xóa và nút quay lại nằm cuối phiếu để không che nội dung.
  const footer = !loaded ? undefined : editing ? (
    <Button fullWidth size="large" loading={busy} disabled={busy} onClick={() => void review()}>{editing === "new" ? "Lưu phiên thả giống" : "Lưu thay đổi"}</Button>
  ) : loaded.list.canRecord || loaded.list.canMarkComplete ? (
    <div className="sheet-actions">
      {loaded.list.canRecord && <Button fullWidth size="large" loading={busy} disabled={busy} onClick={() => void openForm(loaded.list, null)}>Ghi phiên thả giống</Button>}
      {loaded.list.canMarkComplete && <Button fullWidth size="large" variant="secondary" disabled={busy} onClick={() => void askCompletion()}>Đánh dấu thả giống xong</Button>}
    </div>
  ) : undefined;

  return (
    <ManagePage title={loaded ? `Thả giống bè ${loaded.list.raftCode}` : "Thả giống"} footer={footer} onBack={editing ? close : undefined}>
      <Loadable data={loaded} error={data.error} reload={() => void data.reload()}>
        {({ list, cycle }) =>
          editing ? (
            <>
              <SeedingForm list={list} lots={lots} draft={draft} editing={editing === "new" ? null : editing} busy={busy} error={error}
                cycleStart={cycle.startDate} onChange={(d) => { setDraft(d); setError(""); }} />
              <div className="button-stack">
                {editing !== "new" && <Button fullWidth size="large" variant="tertiary" type="danger" disabled={busy} onClick={() => setReasonFor("remove")}>Xóa phiên này</Button>}
                <Button fullWidth size="large" variant="secondary" disabled={busy} onClick={close}>Không, quay lại</Button>
              </div>
            </>
          ) : (
            <>
              <Facts items={[
                ["Chu kỳ bắt đầu", date(cycle.startDate)],
                ["Đã thả giống", `${num(list.seededCount)} trên ${num(list.laneCount, "luống")}`],
                ["Chưa thả", list.notSeededLanes.length ? lanesText(list.notSeededLanes) : "Đã thả đủ các luống"],
                ["Thả giống xong", list.seedingCompletedOn ? date(list.seedingCompletedOn) : "Chưa đánh dấu"],
              ]} />
              {!list.canRecord && !cycle.closeDate && <p className="form__hint">Chưa ghi được phiên mới: chu kỳ phải đang mở trên bè đang dùng và còn luống chưa thả.</p>}
              <Section title="Các luống">
                {list.lanes.length ? (
                  <Rows>
                    {list.lanes.map((lane) => {
                      const [text, tone] = LANE_STATE[lane.state] ?? ["Khác", "neutral"];
                      return <Row key={lane.id} title={`Luống ${lane.laneNumber}`} badge={<Badge text={text} tone={tone} />} />;
                    })}
                  </Rows>
                ) : (
                  <Empty title="Bè chưa có luống" />
                )}
              </Section>
              {list.lots.length > 0 && (
                <Section title="Tổng theo lô giống">
                  <Rows>
                    {list.lots.map((lot) => (
                      <Row key={lot.seedLotId} title={`Lô ${lot.code}`} meta={lot.itemName ?? undefined} value={num(lot.quantity, lot.unit)} />
                    ))}
                  </Rows>
                </Section>
              )}
              <Section title="Các phiên thả giống">
                {list.records.length ? (
                  <Rows>
                    {list.records.map((record) => (
                      <Row key={record.id} title={`${date(record.seedingDate)} · lô ${record.seedLot.code}`}
                        meta={`${lanesText(record.laneNumbers)} · ${num(record.quantity, record.seedLot.unit)}${record.recordedByName ? ` · ${record.recordedByName} ghi` : ""}`}
                        badge={record.canCorrect ? <Badge text="Sửa được" tone="neutral" /> : undefined}
                        onClick={record.canCorrect ? () => void openForm(list, record) : undefined} />
                    ))}
                  </Rows>
                ) : (
                  <Empty title="Chưa có phiên thả giống" text="Bấm Ghi phiên thả giống sau khi treo giống lên luống." />
                )}
              </Section>
            </>
          )
        }
      </Loadable>
      <ReasonSheet visible={reasonFor !== null} busy={busy} required maxLength={CULTIVATION_LIMITS.reason} danger={reasonFor === "remove"}
        title={reasonFor === "remove" ? "Xóa phiên thả giống này?" : "Lưu thay đổi của phiên?"}
        intro={reasonFor === "remove" ? "Phiên bị xóa vẫn còn trong lịch sử thao tác cùng lý do." : "Ghi lý do sửa để người khác hiểu vì sao số liệu đổi."}
        confirmText={reasonFor === "remove" ? "Xóa phiên" : "Lưu thay đổi"} onClose={() => setReasonFor(null)} onConfirm={withReason} />
      <ConfirmSheet visible={completion !== null} busy={busy} title="Đánh dấu thả giống xong?" confirmText="Đúng, đã thả xong"
        message={completion && (
          completion.notSeededLanes.length
            ? <p>Còn {lanesText(completion.notSeededLanes)} chưa thả giống. Vẫn đánh dấu thả giống xong? Chủ HTX sẽ nhận thông báo.</p>
            : <p>Đã thả giống đủ {num(completion.laneCount, "luống")}. Chủ HTX sẽ nhận thông báo.</p>
        )}
        onClose={() => setCompletion(null)} onConfirm={() => void complete()} />
    </ManagePage>
  );
}

/** Phiếu một phiên: ngày thả, lô giống, các luống và lượng giống theo đơn vị của lô. */
function SeedingForm({ list, lots, draft, editing, busy, error, cycleStart, onChange }: {
  list: SeedingList;
  lots: SeedLotList | null;
  draft: SeedingDraft;
  editing: SeedingRecordView | null;
  busy: boolean;
  error: string;
  cycleStart: string;
  onChange: (draft: SeedingDraft) => void;
}) {
  const set = (patch: Partial<SeedingDraft>) => onChange({ ...draft, ...patch });
  // Phiên đang sửa giữ được các luống của chính nó, dù các luống đó đã có giống.
  const lanes = list.lanes.filter((l) => l.canSeed || editing?.laneNumbers.includes(l.laneNumber));
  const options = lots?.lots ?? [];
  const option = options.find((l) => l.id === draft.seedLotId);
  const unit = option?.unit ?? (editing?.seedLot.id === draft.seedLotId ? editing.seedLot.unit : null);
  const toggle = (n: number, on: boolean) =>
    set({ laneNumbers: on ? [...draft.laneNumbers.filter((x) => x !== n), n].sort((a, b) => a - b) : draft.laneNumbers.filter((x) => x !== n) });

  return (
    <div className="card form">
      <DateField label="1. Ngày thả giống" value={draft.seedingDate || null} onChange={(seedingDate) => set({ seedingDate })} disabled={busy} />
      {draft.seedingDate && draft.seedingDate < cycleStart && <p className="form__hint">Chu kỳ bắt đầu ngày {date(cycleStart)}.</p>}
      {options.length ? (
        <Select label="2. Lô giống đã thả" value={draft.seedLotId} onChange={(v) => set({ seedLotId: String(v) })} closeOnSelect disabled={busy}>
          {options.map((l) => (
            <Select.Option key={l.id} value={l.id}
              title={`${l.code}${l.itemName ? ` · ${l.itemName}` : ""} · ${l.supplierName}${l.boughtForThisRaft ? " · mua cho bè này" : ""}`} />
          ))}
        </Select>
      ) : (
        <p className="form__hint" role="alert">Chưa có lô giống để chọn: cần hoàn tất phiếu nhập hàng của giống trước.</p>
      )}
      {option && (
        <p className="form__hint">Lô nhập {num(option.quantityReceived, option.unit)} ngày {date(option.receivedDate)}, đã thả {num(option.quantitySeeded, option.unit)} (chỉ để tham khảo).</p>
      )}
      <p className="form__intro">3. Các luống đã treo giống của lô này</p>
      {lanes.length ? lanes.map((lane) => (
        <div key={lane.id} className="harvest-lane">
          <Checkbox className="harvest-option" value={`lane-${lane.laneNumber}`} checked={draft.laneNumbers.includes(lane.laneNumber)} disabled={busy}
            onChange={(e) => toggle(lane.laneNumber, e.target.checked)}>
            Luống {lane.laneNumber}
          </Checkbox>
        </div>
      )) : <p className="form__hint">Không còn luống nào chưa thả giống.</p>}
      <NumberInput label={`4. Lượng giống đã thả${unit ? ` (${unit})` : ""}`} decimal value={draft.quantity} disabled={busy}
        helperText="Tổng của cả phiên, không chia theo từng luống." onChange={(quantity) => set({ quantity })} />
      <FormError text={error} />
    </div>
  );
}
