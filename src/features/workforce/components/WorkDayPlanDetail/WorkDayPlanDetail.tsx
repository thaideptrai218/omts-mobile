import type { WorkDayPlan, WorkDayPlanStatus } from "@/features/workforce/models/WorkDayPlan";
import { useRef, useState } from "react";
import { Button, Input } from "zmp-ui";
import { Badge } from "@/components/Badge/Badge";
import FormError from "@/components/FormError/FormError";
import { Loadable } from "@/components/Loadable/Loadable";
import { useLoad } from "@/hooks/useLoad";
import { purchaseShiftInvitations } from "@/features/sales/services/purchaseStaffingService";
import { assignWorkPlan, getWorkPlan, respondWorkPlan, workPlanEmployees } from "@/features/workforce/services/workDayPlanService";
import { date } from "@/utils/format";
import { errorText } from "@/utils/errorText";
import "@/features/workforce/styles/workforce.scss";

const LABEL: Record<WorkDayPlanStatus, string> = { PENDING_MANAGER: "Chờ quản lý nhận kế hoạch", DECLINED: "Quản lý từ chối", READY_TO_ASSIGN: "Chờ người phụ trách phân công", AWAITING_STAFF: "Chờ nhân viên phản hồi", ASSIGNED: "Đã phân công", CLOSED: "Đơn đã đóng" };

export function WorkPlanBadge({ status }: { status: WorkDayPlanStatus }) {
  return <Badge text={LABEL[status]} tone={status === "DECLINED" ? "danger" : status === "ASSIGNED" ? "success" : "warning"} />;
}

export default function WorkDayPlanDetail({ plan, onUpdated }: { plan: WorkDayPlan; onUpdated: (plan: WorkDayPlan) => void }) {
  const [reason, setReason] = useState(""); const [ids, setIds] = useState<string[]>([]);
  const [busy, setBusy] = useState(false); const lock = useRef(false);
  const [error, setError] = useState(""); const [notice, setNotice] = useState("");
  const employees = useLoad(() => plan.canAssign ? workPlanEmployees(plan.id) : Promise.resolve([]), [plan.id, plan.rowVersion, plan.canAssign]);
  const invitations = useLoad(() => plan.purchaseRequestId ? purchaseShiftInvitations(plan.purchaseRequestId) : Promise.resolve([]), [plan.id, plan.rowVersion]);
  const run = async (action: () => Promise<WorkDayPlan>, message: string) => {
    if (lock.current) return;
    lock.current = true; setBusy(true); setError(""); setNotice("");
    try { const updated = await action(); setIds([]); setReason(""); onUpdated(updated); setNotice(message); }
    catch (e) { setError(errorText(e)); } finally { lock.current = false; setBusy(false); }
  };
  const respond = (approved: boolean) => {
    if (!approved && !reason.trim()) { setError("Nhập lý do từ chối kế hoạch."); return; }
    void run(() => respondWorkPlan(plan.id, { approved, reason: reason.trim(), rowVersion: plan.rowVersion }), approved ? "Đã nhận kế hoạch. Bạn có thể phân công nhân viên." : "Đã gửi lý do từ chối cho Chủ HTX.");
  };
  const invited = new Set(invitations.data?.map(i => i.employeeId));
  return <div className="card form">
    <h3 className="block__title">{plan.jobName} · {date(plan.workDate)}</h3>
    <WorkPlanBadge status={plan.status} />
    <p>Bè {plan.raftCode} · {plan.zoneName}</p>
    <p>Phụ trách: {plan.responsibleName}</p>
    {plan.requestCode && <p>Đơn {plan.requestCode} · {plan.cages} lồng · {plan.approvedEmployees}/{plan.requiredEmployees} người đồng ý</p>}
    {plan.note && <p>{plan.note}</p>}
    {plan.responseReason && <p className="form__hint">Phản hồi quản lý: {plan.responseReason}</p>}
    {plan.canRespond && <>
      <Input.TextArea label="Phản hồi (bắt buộc khi từ chối)" value={reason} maxLength={500} disabled={busy} onChange={e => setReason(e.target.value)} />
      <Button fullWidth size="large" disabled={busy} onClick={() => respond(true)}>Đồng ý nhận kế hoạch</Button>
      <Button fullWidth size="large" variant="secondary" disabled={busy} onClick={() => respond(false)}>Từ chối kế hoạch</Button>
    </>}
    <Loadable data={invitations.data} error={invitations.error} reload={() => void invitations.reload()}>{items => items.map(i => <p key={i.id}>{i.employeeName} · {i.approved === null ? "Chờ trả lời" : i.approved ? "Đồng ý" : `Từ chối: ${i.reason ?? ""}`}</p>)}</Loadable>
    {plan.canAssign && <>
      <h3 className="block__title">{plan.purchaseRequestId ? "Mời nhân viên xác nhận ca" : "Phân công nhân viên"}</h3>
      {plan.purchaseRequestId && <p className="form__hint">Khi đủ người đồng ý, Chủ HTX mới quyết định nhận đơn. Phân công sẽ được chốt khi nhận đơn.</p>}
      <Loadable data={employees.data} error={employees.error} reload={() => void employees.reload()}>{items => <div className="crew-list">{items.filter(e => !invited.has(e.id)).map(e => <label className="crew-choice" key={e.id}>
        <input type="checkbox" checked={ids.includes(e.id)} disabled={busy || !e.available} onChange={event => setIds(current => event.target.checked ? [...current, e.id] : current.filter(id => id !== e.id))} />
        <span>{e.name}{e.unavailableReason ? ` · ${e.unavailableReason}` : ""}</span>
      </label>)}</div>}</Loadable>
      <Button fullWidth size="large" disabled={busy || !ids.length || !!employees.error || !!invitations.error} loading={busy} onClick={() => void run(() => assignWorkPlan(plan.id, { employeeIds: ids, rowVersion: plan.rowVersion }), plan.purchaseRequestId ? "Đã gửi lời mời ca cho nhân viên." : "Đã phân công và thông báo cho nhân viên.")}>{plan.purchaseRequestId ? "Gửi lời mời ca" : "Xác nhận phân công"}</Button>
    </>}
    <FormError text={error} />
    {notice && <p role="status">{notice}</p>}
    <Button fullWidth size="large" variant="secondary" disabled={busy} onClick={() => void run(() => getWorkPlan(plan.id), "Đã cập nhật kế hoạch.")}>Cập nhật kế hoạch</Button>
  </div>;
}
