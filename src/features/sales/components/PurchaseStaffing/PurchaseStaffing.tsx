import type { PurchaseRequest } from "@/features/sales/models/PurchaseRequest";
import { useRef, useState } from "react";
import { Button, Input } from "zmp-ui";
import { Badge } from "@/components/Badge/Badge";
import DateField from "@/components/DateField/DateField";
import { Empty } from "@/components/Empty/Empty";
import FormError from "@/components/FormError/FormError";
import { Loadable } from "@/components/Loadable/Loadable";
import { Section } from "@/components/Section/Section";
import { useLoad } from "@/hooks/useLoad";
import { planPurchaseStaffing, purchaseShiftInvitations, staffingEmployees } from "@/features/sales/services/purchaseStaffingService";
import { getPurchaseRequest, pickupDateError, wholeCages } from "@/features/sales/services/salesService";
import { errorText } from "@/utils/errorText";
import { date, todayIso } from "@/utils/format";

/** Chủ HTX gửi lời mời rồi xem từng phản hồi trước khi quyết định nhận đơn. */
export default function PurchaseStaffing({ row, onUpdated }: { row: PurchaseRequest; onUpdated: (row: PurchaseRequest) => void }) {
  const plan = row.staffing;
  const [cages, setCages] = useState(String(plan?.cages ?? row.requestedCages));
  const [capacity, setCapacity] = useState(String(plan?.cagesPerEmployeePerDay ?? 20));
  const [workDate, setWorkDate] = useState(plan?.workDate ?? (row.requestedPickupDate < todayIso() ? todayIso() : row.requestedPickupDate));
  const [pickup, setPickup] = useState(plan?.pickupDate ?? workDate);
  const [note, setNote] = useState(plan?.note ?? "");
  const [ids, setIds] = useState<string[]>([]);
  const [busy, setBusy] = useState(false); const lock = useRef(false);
  const [error, setError] = useState(""); const [notice, setNotice] = useState("");
  const invitations = useLoad(() => purchaseShiftInvitations(row.id), [row.id, row.rowVersion]);
  const employees = useLoad(() => staffingEmployees(workDate), [workDate, row.rowVersion]);
  const canPlan = row.status === "AWAITING_RESPONSE" || row.status === "AWAITING_STAFF";
  const count = wholeCages(cages); const perPerson = wholeCages(capacity);
  const required = count && perPerson ? Math.ceil(count / perPerson) : null;
  const invitedIds = new Set(invitations.data?.map(i => i.employeeId));
  const save = async () => {
    if (lock.current) return;
    if (!count || count > row.requestedCages || !perPerson) { setError("Nhập số lồng hợp lệ và năng suất lớn hơn 0."); return; }
    const problem = pickupDateError(workDate) || pickupDateError(pickup);
    if (problem || pickup < workDate) { setError(problem || "Ngày nhận hàng phải từ ngày làm trở đi."); return; }
    if (!ids.length) { setError("Chọn ít nhất một nhân viên để gửi lời mời."); return; }
    lock.current = true; setBusy(true); setError(""); setNotice("");
    try {
      await planPurchaseStaffing(row, { cages: count, workDate, pickupDate: pickup, cagesPerEmployeePerDay: perPerson, employeeIds: ids, note: note.trim() });
      setIds([]); setNotice("Đã gửi lời mời ca. Chờ nhân viên phản hồi trước khi nhận đơn.");
      onUpdated(await getPurchaseRequest(false, row.id));
      await invitations.reload(); await employees.reload();
    } catch (e) { setError(errorText(e)); } finally { lock.current = false; setBusy(false); }
  };
  return <Section title="Xác nhận nhân lực">
    {plan && <div className="card form" role="status">
      <p className="block__title">{plan.approvedEmployees}/{plan.requiredEmployees} người đã đồng ý</p>
      <p>{plan.cages} lồng · {plan.cagesPerEmployeePerDay} lồng/người/ngày · ca {date(plan.workDate)}</p>
      <p>Đang chờ: {plan.pendingEmployees} · Từ chối: {plan.declinedEmployees}</p>
      {canPlan && <Badge text={plan.hasEnoughStaff ? "Đủ nhân lực · Chủ HTX có thể nhận đơn" : `Còn thiếu ${Math.max(0, plan.requiredEmployees - plan.approvedEmployees)} người đồng ý`} tone={plan.hasEnoughStaff ? "success" : "warning"} />}
    </div>}
    <Loadable data={invitations.data} error={invitations.error} reload={() => void invitations.reload()}>{items => items.length ? <div className="card form">{items.map(i => <div key={i.id}>
      <p>{i.employeeName} · <Badge text={i.approved === null ? "Chờ trả lời" : i.approved ? "Đồng ý" : "Từ chối"} tone={i.approved === null ? "warning" : i.approved ? "success" : "danger"} /></p>
      {i.reason && <p className="form__hint">{i.reason}</p>}
    </div>)}</div> : <p className="form__hint">Chưa gửi lời mời ca cho nhân viên.</p>}</Loadable>
    {canPlan && !plan?.hasEnoughStaff && <div className="card form">
      {plan ? <p className="form__hint">Ca đã gửi được giữ nguyên để khớp nội dung nhân viên đã xác nhận. Bạn có thể mời thêm người.</p> : <>
        <Input label="Số lồng dự kiến nhận" inputMode="numeric" value={cages} disabled={busy} onChange={e => setCages(e.target.value)} />
        <Input label="Năng suất (lồng/người/ngày)" inputMode="numeric" value={capacity} disabled={busy} onChange={e => setCapacity(e.target.value)} />
        <DateField label="Ngày làm việc" value={workDate} disabled={busy} onChange={day => { setWorkDate(day); setIds([]); }} />
        <DateField label="Ngày nhận hàng dự kiến xác nhận" value={pickup} disabled={busy} onChange={setPickup} />
        <Input.TextArea label="Nội dung gửi nhân viên" value={note} maxLength={500} disabled={busy} onChange={e => setNote(e.target.value)} />
      </>}
      {required !== null && <p className="form__hint">Cần ít nhất {required} người đồng ý ca để xử lý {count} lồng.</p>}
      <Loadable data={employees.data} error={employees.error} reload={() => void employees.reload()}>{options => options.length ? options.filter(e => !invitedIds.has(e.id)).map(e =>
        <label className="crew-choice" key={e.id}><input type="checkbox" disabled={busy || !e.available} checked={ids.includes(e.id)} onChange={event => setIds(current => event.target.checked ? [...current, e.id] : current.filter(id => id !== e.id))} />
          <span>{e.name}{!e.available ? ` · ${e.unavailableReason}` : ""}</span></label>) : <Empty title="Chưa có nhân viên để mời" text="Thêm hồ sơ nhân viên và gắn tài khoản trước khi lên ca." />}</Loadable>
      <FormError text={employees.error || invitations.error || error} />
      <Button fullWidth size="large" loading={busy} disabled={busy || !ids.length || !invitations.data || !employees.data || !!employees.error || !!invitations.error} onClick={() => void save()}>{plan ? "Mời thêm nhân viên" : "Gửi lời mời ca"}</Button>
    </div>}
    {notice && <p role="status">{notice}</p>}
  </Section>;
}
