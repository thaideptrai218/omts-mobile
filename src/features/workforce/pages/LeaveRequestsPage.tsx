import type { LeaveRow } from "@/features/workforce/models/LeaveRequest";
import { useState } from "react";
import { Button, Input, Sheet } from "zmp-ui";
import FormError from "@/components/FormError/FormError";
import { Badge } from "@/components/Badge/Badge";
import { Empty } from "@/components/Empty/Empty";
import { Loadable } from "@/components/Loadable/Loadable";
import { ManagePage } from "@/components/ManagePage/ManagePage";
import WorkforceGate from "@/features/workforce/components/WorkforceGate/WorkforceGate";
import { useLoad } from "@/hooks/useLoad";
import { errorText } from "@/utils/errorText";
import { date } from "@/utils/format";
import { listLeave, reviewLeave } from "@/features/workforce/services/workforceService";
import "@/features/workforce/styles/workforce.scss";

export default function ReviewLeavePage() { return <WorkforceGate mode="owner"><ReviewContent /></WorkforceGate>; }
function ReviewContent() {
  const data = useLoad(listLeave, []);
  const [choice, setChoice] = useState<{ row: LeaveRow; approved: boolean } | null>(null);
  const [response, setResponse] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState<{ id: string; text: string } | null>(null);
  const save = async () => {
    if (!choice || busy) return;
    if (!choice.approved && !response.trim()) { setError("Nhập lý do từ chối cho nhân viên."); return; }
    setBusy(true); setError("");
    try { await reviewLeave(choice.row.id, choice.approved, response.trim(), choice.row.rowVersion); setDone({ id: choice.row.id, text: choice.approved ? "Đã duyệt yêu cầu nghỉ phép." : "Đã từ chối yêu cầu nghỉ phép." }); setChoice(null); await data.reload(); }
    catch (e) { setError(errorText(e)); } finally { setBusy(false); }
  };
  return <ManagePage title="Duyệt nghỉ phép">
    <div className="button-stack"><p className="form__hint">Chỉ Chủ HTX duyệt hoặc từ chối. Quyết định nghỉ phép không tự tạo giờ chấm công.</p></div>
    <Loadable data={data.data} error={data.error} reload={() => void data.reload()}>{rows => rows.length ? <div className="workforce-cards">{rows.map(r =>
      <div className="card form" key={r.id}><p className="block__title">{r.employeeName}</p>
        <p>{date(r.from)} – {date(r.to)}</p><p>{r.reason}</p>
        <Badge text={r.cancelledAt ? "Đã hủy" : r.approved === null ? "Chờ duyệt" : r.approved ? "Đã duyệt" : "Từ chối"} tone={r.approved === null ? "warning" : r.approved ? "success" : "danger"} />
        {r.response && <p>Phản hồi: {r.response}</p>}
        {done?.id === r.id && <p className="status-note" role="status">{done.text}</p>}
        {r.approved === null && !r.cancelledAt && <div className="action-row">{[true, false].map(approved => <Button key={String(approved)} size="large" variant={approved ? "primary" : "secondary"} disabled={busy}
          onClick={() => { setChoice({ row: r, approved }); setResponse(""); setError(""); setDone(null); }}>{approved ? "Duyệt" : "Từ chối"}</Button>)}</div>}
      </div>)}</div> : <Empty title="Chưa có yêu cầu nghỉ phép" />}</Loadable>
    <div className="button-stack"><Button fullWidth size="large" variant="secondary" onClick={() => void data.reload()}>Tải lại</Button></div>
    <Sheet visible={choice !== null} onClose={() => { if (!busy) setChoice(null); }} autoHeight mask handler title={choice?.approved ? "Duyệt nghỉ phép" : "Từ chối nghỉ phép"}>
      <div className="sheet-form form workforce-sheet"><p className="block__title">{choice?.row.employeeName}</p><p>{date(choice?.row.from)} – {date(choice?.row.to)}</p>
        <Input.TextArea label={choice?.approved ? "Phản hồi cho nhân viên (không bắt buộc)" : "Lý do từ chối (bắt buộc)"} value={response} maxLength={500} disabled={busy} onChange={e => setResponse(e.target.value)} />
        <FormError text={error} />
        <div className="sheet-actions">
          <Button fullWidth size="large" loading={busy} disabled={busy} onClick={() => void save()}>{choice?.approved ? "Xác nhận duyệt" : "Xác nhận từ chối"}</Button>
          <Button fullWidth size="large" variant="secondary" disabled={busy} onClick={() => setChoice(null)}>Không, quay lại</Button>
        </div></div>
    </Sheet>
  </ManagePage>;
}
