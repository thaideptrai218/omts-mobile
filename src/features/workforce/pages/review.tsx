import { useState } from "react";
import { Button, Input, Sheet } from "zmp-ui";
import FormError from "@/shared/ui/form-error";
import { Badge, Empty, Loadable, ManagePage } from "@/shared/ui/ui";
import WorkforceGate from "@/features/workforce/components/workforce-gate";
import { useLoad } from "@/shared/hooks/use-load";
import { errorText } from "@/shared/lib/messages";
import { date } from "@/shared/lib/format";
import { listLeave, reviewLeave, type LeaveRow } from "@/features/workforce/api/workforce";

export default function ReviewLeavePage() { return <WorkforceGate mode="owner"><ReviewContent /></WorkforceGate>; }
function ReviewContent() {
  const data = useLoad(listLeave, []);
  const [choice, setChoice] = useState<{ row: LeaveRow; approved: boolean } | null>(null);
  const [response, setResponse] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const save = async () => {
    if (!choice || busy) return;
    if (!choice.approved && !response.trim()) { setError("Nhập lý do từ chối cho nhân viên."); return; }
    setBusy(true); setError("");
    try { await reviewLeave(choice.row.id, choice.approved, response.trim(), choice.row.rowVersion); setChoice(null); await data.reload(); }
    catch (e) { setError(errorText(e)); } finally { setBusy(false); }
  };
  return <ManagePage title="Duyệt nghỉ phép">
    <p className="form__hint">Chỉ Chủ HTX duyệt hoặc từ chối. Quyết định nghỉ phép không tự tạo giờ chấm công.</p>
    <Loadable data={data.data} error={data.error} reload={() => void data.reload()}>{rows => rows.length ? rows.map(r =>
      <div className="card form" key={r.id}><p className="block__title">{r.employeeName}</p>
        <p>{date(r.from)} – {date(r.to)}</p><p>{r.reason}</p>
        <Badge text={r.cancelledAt ? "Đã hủy" : r.approved === null ? "Chờ duyệt" : r.approved ? "Đã duyệt" : "Từ chối"} tone={r.approved === null ? "warning" : r.approved ? "success" : "danger"} />
        {r.response && <p>Phản hồi: {r.response}</p>}
        {r.approved === null && !r.cancelledAt && <div className="action-row">{[true, false].map(approved => <Button key={String(approved)} size="large" variant={approved ? "primary" : "secondary"} disabled={busy}
          onClick={() => { setChoice({ row: r, approved }); setResponse(""); setError(""); }}>{approved ? "Duyệt" : "Từ chối"}</Button>)}</div>}
      </div>) : <Empty title="Chưa có yêu cầu nghỉ phép" />}</Loadable>
    <Button fullWidth size="large" variant="secondary" onClick={() => void data.reload()}>Tải lại</Button>
    <Sheet visible={choice !== null} onClose={() => { if (!busy) setChoice(null); }} autoHeight mask handler title={choice?.approved ? "Duyệt nghỉ phép" : "Từ chối nghỉ phép"}>
      <div className="sheet-form form workforce-sheet"><p>{choice?.row.employeeName}</p><Input.TextArea label="Phản hồi cho nhân viên" value={response} maxLength={500} disabled={busy} onChange={e => setResponse(e.target.value)} />
        <FormError text={error} /><Button fullWidth size="large" loading={busy} disabled={busy} onClick={() => void save()}>Xác nhận</Button></div>
    </Sheet>
  </ManagePage>;
}
