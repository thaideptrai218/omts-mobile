import type { CycleClosePreview, CycleDraft, CycleSummary, CycleView } from "@/features/farming/models/Cycle";
import type { ReactNode } from "react";
import { useState } from "react";
import { Button, Checkbox, Input, useNavigate, useParams } from "zmp-ui";

import { ConfirmSheet } from "@/components/ConfirmSheet/ConfirmSheet";
import { Facts } from "@/components/Facts/Facts";
import FormError from "@/components/FormError/FormError";
import { Loadable } from "@/components/Loadable/Loadable";
import { ManagePage } from "@/components/ManagePage/ManagePage";
import { Section } from "@/components/Section/Section";
import { CycleBadge } from "@/features/farming/components/CycleBadge/CycleBadge";
import { CycleForm, cycleDraftOf } from "@/features/farming/components/CycleForm/CycleForm";
import {
  cancelCycle, closeCycle, closePreview, CULTIVATION_LIMITS, cycleDraftError, cycleSummary, editCycle, getCycle,
} from "@/features/farming/services/cultivationService";
import { useAction } from "@/hooks/useAction";
import { useLoad } from "@/hooks/useLoad";
import { date, num } from "@/utils/format";
import "@/features/farming/styles/laneOptions.scss";

type Mode = "view" | "edit" | "close";

/** "đã có / dự kiến": số thật của chu kỳ cạnh ước tính của kế hoạch, hoặc "chưa đặt" khi không có ước tính. */
const versus = (actual: string, planned: string | null) => `${actual} (kế hoạch: ${planned ?? "chưa đặt"})`;

/** Tổng kết chu kỳ (BR-CYCLE-06) dạng các dòng thông tin. */
function summaryFacts(s: CycleSummary): [string, ReactNode][] {
  const unit = s.seedUnit ?? "";
  return [
    ["Tính đến ngày", date(s.asOf)],
    ["Số ngày nuôi", num(s.daysOfFarming, "ngày")],
    ["Giống đã thả", versus(`${num(s.seedHung, unit)} trong ${num(s.seedingSessionCount, "phiên")}`, s.expectedSeedQuantity === null ? null : num(s.expectedSeedQuantity, unit))],
    ["Đã thu hoạch", versus(`khoảng ${num(s.kgHarvested, "kg")} trong ${num(s.harvestLotCount, "lô")}`, s.targetYieldKg === null ? null : num(s.targetYieldKg, "kg"))],
    ["Lần thu cuối", versus(s.lastHarvestDate ? date(s.lastHarvestDate) : "chưa thu", s.expectedHarvestDate ? date(s.expectedHarvestDate) : null)],
    ["Đánh giá", s.assessment],
  ];
}

/** Câu báo đóng sớm (MSG-CYCLE-07) viết lại bằng tiếng Việt từ lý do backend trả. */
function earlyText(s: CycleSummary): string {
  if (s.earlyReason === "NoSeedingSession") return "Đây là đóng sớm: chu kỳ chưa có phiên thả giống nào.";
  const lanes = s.notHarvestedLanes.join(", ");
  return `Đây là đóng sớm: luống ${lanes} đã thả giống nhưng chưa thu hết. Đóng rồi thì các luống này kết thúc không có sản lượng.`;
}

/** Một chu kỳ nuôi (CYCLE-05.1): tổng kết, sửa kế hoạch (CYCLE-01.1), hủy khi bắt đầu nhầm (CYCLE-01.2) và đóng chu kỳ (CYCLE-06). */
export default function CyclePage() {
  const { cycleId = "" } = useParams();
  const navigate = useNavigate();
  const data = useLoad(async () => {
    const [cycle, summary] = await Promise.all([getCycle(cycleId), cycleSummary(cycleId)]);
    return { cycle, summary };
  }, [cycleId]);
  const [mode, setMode] = useState<Mode>("view");
  const [draft, setDraft] = useState<CycleDraft>(cycleDraftOf);
  const [preview, setPreview] = useState<CycleClosePreview | null>(null);
  const [assessment, setAssessment] = useState("");
  const [approved, setApproved] = useState(false);
  const [asking, setAsking] = useState<"cancel" | "close" | null>(null);
  const [error, setError] = useState("");
  const { busy, run } = useAction();

  const back = () => { setMode("view"); setError(""); };

  const startEdit = (cycle: CycleView) => { setDraft(cycleDraftOf(cycle)); setError(""); setMode("edit"); };

  const saveEdit = async (cycle: CycleView) => {
    const problem = cycleDraftError(draft) || (draft.startDate ? "" : "Chọn ngày bắt đầu nuôi.");
    setError(problem);
    if (problem || busy) return;
    const saved = await run(() => editCycle(cycle, draft), "Đã lưu chu kỳ nuôi.");
    if (saved) { back(); await data.reload(); }
  };

  const startClose = async () => {
    const found = await run(() => closePreview(cycleId));
    if (!found) return;
    setPreview(found); setAssessment(""); setApproved(false); setError(""); setMode("close");
  };

  const reviewClose = () => {
    const problem = !assessment.trim() ? "Nhập đánh giá chu kỳ trước khi đóng."
      : preview?.needsOwnerApproval && !approved ? "Đóng sớm cần Chủ HTX đồng ý. Đánh dấu ô xác nhận khi Chủ HTX đã đồng ý."
        : "";
    setError(problem);
    if (!problem) setAsking("close");
  };

  const confirm = async (cycle: CycleView) => {
    if (asking === "cancel") {
      const done = await run(async () => { await cancelCycle(cycle); return true; }, "Đã hủy chu kỳ bắt đầu nhầm.");
      setAsking(null);
      if (done) navigate(`/manage/cycles/raft/${cycle.raftId}`, { replace: true });
      return;
    }
    if (!preview) return;
    const closed = await run(() => closeCycle(cycleId, assessment, preview.cycleRowVersion, approved), "Đã đóng chu kỳ nuôi.");
    setAsking(null);
    if (closed) { back(); await data.reload(); }
  };

  const loaded = data.data;
  const footer = !loaded ? undefined : mode === "edit" ? (
    <div className="sheet-actions">
      <Button fullWidth size="large" loading={busy} disabled={busy} onClick={() => void saveEdit(loaded.cycle)}>Lưu chu kỳ</Button>
      <Button fullWidth size="large" variant="secondary" disabled={busy} onClick={back}>Không, quay lại</Button>
    </div>
  ) : mode === "close" ? (
    <div className="sheet-actions">
      <Button fullWidth size="large" disabled={busy} onClick={reviewClose}>Đóng chu kỳ</Button>
      <Button fullWidth size="large" variant="secondary" disabled={busy} onClick={back}>Không, quay lại</Button>
    </div>
  ) : (
    <div className="button-stack">
      <Button fullWidth size="large" onClick={() => navigate(`/manage/cycles/${cycleId}/seeding`)}>Thả giống</Button>
      <Button fullWidth size="large" variant="secondary" onClick={() => navigate(`/manage/cycles/${cycleId}/logs`)}>Nhật ký nuôi</Button>
    </div>
  );

  return (
    <ManagePage title={loaded ? `Chu kỳ bè ${loaded.cycle.raftCode}` : "Chu kỳ nuôi"} footer={footer} onBack={mode !== "view" ? back : undefined}>
      <Loadable data={loaded} error={data.error} reload={() => void data.reload()}>
        {({ cycle, summary }) =>
          mode === "edit" ? (
            <CycleForm draft={draft} error={error} busy={busy} onChange={(d) => { setDraft(d); setError(""); }} />
          ) : mode === "close" && preview ? (
            <>
              <p className="form__intro">Chu kỳ sẽ đóng hôm nay. Xem lại tổng kết rồi ghi đánh giá.</p>
              <Facts items={summaryFacts(preview.summary)} />
              {preview.isEarly && <p className="form__hint" role="alert">{earlyText(preview.summary)}</p>}
              <div className="card form">
                <Input.TextArea label="Đánh giá chu kỳ (bắt buộc)" value={assessment} maxLength={CULTIVATION_LIMITS.assessment} showCount disabled={busy}
                  onChange={(e) => { setAssessment(e.target.value); setError(""); }} />
                {preview.needsOwnerApproval && (
                  <Checkbox className="harvest-option" value="owner-approved" checked={approved} disabled={busy} onChange={(e) => { setApproved(e.target.checked); setError(""); }}>
                    Chủ HTX đã đồng ý cho đóng sớm chu kỳ này
                  </Checkbox>
                )}
                <FormError text={error} />
              </div>
            </>
          ) : (
            <>
              <Facts items={[
                ["Trạng thái", <CycleBadge key="status" cycle={cycle} />],
                ["Bắt đầu nuôi", date(cycle.startDate)],
                ["Ngày đóng", cycle.closeDate ? date(cycle.closeDate) : null],
                ["Thả giống xong", cycle.seedingCompletedOn ? date(cycle.seedingCompletedOn) : "Chưa đánh dấu"],
              ]} />
              <Section title={cycle.closeDate ? "Tổng kết chu kỳ" : "Tổng kết nếu đóng hôm nay"}>
                <Facts items={summaryFacts(summary)} />
              </Section>
              {cycle.canEdit && (
                <div className="button-stack">
                  <Button fullWidth size="large" variant="secondary" disabled={busy} onClick={() => startEdit(cycle)}>Sửa ngày bắt đầu và kế hoạch</Button>
                  <Button fullWidth size="large" variant="secondary" loading={busy} disabled={busy} onClick={() => void startClose()}>Đóng chu kỳ</Button>
                  {cycle.canCancel && (
                    <Button fullWidth size="large" variant="tertiary" type="danger" disabled={busy} onClick={() => setAsking("cancel")}>Hủy chu kỳ bắt đầu nhầm</Button>
                  )}
                </div>
              )}
              {!cycle.canEdit && !cycle.closeDate && <p className="form__hint">Bè hoặc vùng nuôi đã ngừng dùng nên chu kỳ chỉ còn xem được.</p>}
            </>
          )
        }
      </Loadable>
      {loaded && (
        <>
          <ConfirmSheet visible={asking === "cancel"} busy={busy} danger title="Hủy chu kỳ này?" confirmText="Hủy chu kỳ"
            message={<p>Chu kỳ bắt đầu ngày {date(loaded.cycle.startDate)} chưa có bản ghi nào sẽ bị xóa. Dùng khi bắt đầu nhầm.</p>}
            onClose={() => setAsking(null)} onConfirm={() => void confirm(loaded.cycle)} />
          <ConfirmSheet visible={asking === "close"} busy={busy} title="Đóng chu kỳ hôm nay?" confirmText="Đúng, đóng chu kỳ"
            message={<p>Đóng rồi thì chu kỳ không mở lại được, và không ghi thêm thả giống hay nhật ký cho chu kỳ này. Chủ HTX sẽ nhận thông báo.</p>}
            onClose={() => setAsking(null)} onConfirm={() => void confirm(loaded.cycle)} />
        </>
      )}
    </ManagePage>
  );
}
