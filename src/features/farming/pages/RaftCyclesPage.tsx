import { useState } from "react";
import { Button, useNavigate, useParams } from "zmp-ui";

import { Empty } from "@/components/Empty/Empty";
import { Facts } from "@/components/Facts/Facts";
import { Loadable } from "@/components/Loadable/Loadable";
import { ManagePage } from "@/components/ManagePage/ManagePage";
import { Row } from "@/components/Row/Row";
import { Rows } from "@/components/Rows/Rows";
import { Section } from "@/components/Section/Section";
import { CycleBadge } from "@/features/farming/components/CycleBadge/CycleBadge";
import { CycleForm, cycleDraftOf } from "@/features/farming/components/CycleForm/CycleForm";
import { CYCLE_STATUS, cycleDraftError, raftCycles, startCycle, zoneCycles } from "@/features/farming/services/cultivationService";
import { getRaft } from "@/features/farming/services/farmService";
import { useAction } from "@/hooks/useAction";
import { useLoad } from "@/hooks/useLoad";
import { date, num } from "@/utils/format";

/** Các chu kỳ của một bè (CYCLE-05.1) và nút bắt đầu chu kỳ mới (CYCLE-01.0). */
export default function RaftCyclesPage() {
  const { raftId = "" } = useParams();
  const navigate = useNavigate();
  // Nút bắt đầu chỉ bật khi backend sẽ nhận: lấy từ màn chu kỳ của vùng chứa bè.
  const raft = useLoad(async () => {
    const view = await getRaft(raftId);
    const item = (await zoneCycles(view.zone.id)).find((r) => r.raftId === raftId) ?? null;
    return { view, item };
  }, [raftId]);
  const cycles = useLoad(() => raftCycles(raftId), [raftId]);
  const [form, setForm] = useState(false);
  const [draft, setDraft] = useState(cycleDraftOf);
  const [error, setError] = useState("");
  const { busy, run } = useAction();

  const save = async () => {
    const problem = cycleDraftError(draft);
    setError(problem);
    if (problem || busy) return;
    const started = await run(() => startCycle(raftId, draft), "Đã bắt đầu chu kỳ nuôi.");
    if (started) navigate(`/manage/cycles/${started.cycle.id}`, { replace: true });
  };

  const item = raft.data?.item ?? null;
  const code = raft.data?.view.code ?? item?.raftCode ?? "";
  const footer = form ? (
    <div className="sheet-actions">
      <Button fullWidth size="large" loading={busy} disabled={busy} onClick={() => void save()}>Bắt đầu chu kỳ</Button>
      <Button fullWidth size="large" variant="secondary" disabled={busy} onClick={() => { setForm(false); setError(""); }}>Không, quay lại</Button>
    </div>
  ) : item?.canStart ? (
    <Button fullWidth size="large" onClick={() => { setDraft(cycleDraftOf()); setError(""); setForm(true); }}>Bắt đầu chu kỳ mới</Button>
  ) : undefined;

  return (
    <ManagePage title={code ? `Chu kỳ nuôi bè ${code}` : "Chu kỳ nuôi"} footer={footer} onBack={form ? () => setForm(false) : undefined}>
      <Loadable data={raft.data} error={raft.error} reload={() => void raft.reload()}>
        {({ view }) =>
          form ? (
            <CycleForm draft={draft} error={error} busy={busy} onChange={(d) => { setDraft(d); setError(""); }} />
          ) : (
            <>
              <Facts items={[
                ["Vùng nuôi", view.zone.name ?? view.zone.code ?? null],
                ["Số luống đang dùng", item ? num(item.laneCount, "luống") : null],
                ["Chu kỳ trước đóng ngày", item?.lastCloseDate ? date(item.lastCloseDate) : null],
              ]} />
              {item && !item.canStart && item.cycle?.statusId !== CYCLE_STATUS.open && (
                <p className="form__hint">Chưa bắt đầu được chu kỳ mới: bè phải đang dùng, và chu kỳ trước không đóng trong hôm nay.</p>
              )}
              <Section title="Các chu kỳ của bè">
                <Loadable data={cycles.data} error={cycles.error} reload={() => void cycles.reload()}>
                  {(list) =>
                    list.length ? (
                      <Rows>
                        {list.map((c) => (
                          <Row key={c.id} title={`Từ ${date(c.startDate)}`} meta={c.closeDate ? `Đóng ${date(c.closeDate)}` : "Đang nuôi"}
                            badge={<CycleBadge cycle={c} />} onClick={() => navigate(`/manage/cycles/${c.id}`)} />
                        ))}
                      </Rows>
                    ) : (
                      <Empty title="Bè chưa có chu kỳ nuôi nào" text="Bấm Bắt đầu chu kỳ mới khi bắt đầu nuôi trên bè này." />
                    )
                  }
                </Loadable>
              </Section>
            </>
          )
        }
      </Loadable>
    </ManagePage>
  );
}
