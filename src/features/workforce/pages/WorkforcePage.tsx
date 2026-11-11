import type { WorkRow } from "@/features/workforce/models/WorkAssignment";
import { useAtomValue } from "jotai";
import { useEffect, useState } from "react";
import { Button, Select, Sheet, useNavigate, useSnackbar } from "zmp-ui";
import FormError from "@/components/FormError/FormError";
import DateField from "@/components/DateField/DateField";
import { Badge } from "@/components/Badge/Badge";
import { ConfirmSheet } from "@/components/ConfirmSheet/ConfirmSheet";
import { Empty } from "@/components/Empty/Empty";
import { Loadable } from "@/components/Loadable/Loadable";
import { ManagePage } from "@/components/ManagePage/ManagePage";
import { Section } from "@/components/Section/Section";
import WorkforceGate from "@/features/workforce/components/WorkforceGate/WorkforceGate";
import { useLoad } from "@/hooks/useLoad";
import { errorText } from "@/utils/errorText";
import { listRafts, zoneLookup } from "@/features/farming/services/farmService";
import { dateTime, todayIso } from "@/utils/format";
import { assignWork, cancelWork, changeCrew, markWork, workList, workLookups } from "@/features/workforce/services/workforceService";
import { scanQr } from "@/services/zaloService";
import { permissionsAtom } from "@/features/auth/state/authAtoms";
import "@/features/workforce/styles/workforce.scss";

export default function CrewPage() { return <WorkforceGate mode="manager"><CrewContent /></WorkforceGate>; }
function CrewContent() {
  const navigate = useNavigate();
  const permissions = useAtomValue(permissionsAtom)!;
  const can = (code: string, action: string, zone?: string) => permissions.isCooperativeOwner || permissions.functions.some(f =>
    f.function === code && f.actions.includes(action) && (!zone || f.allZones || f.zoneIds.includes(zone)));
  const [day, setDay] = useState(todayIso);
  const [zone, setZone] = useState("");
  const [raft, setRaft] = useState("");
  const [job, setJob] = useState("");
  const [selected, setSelected] = useState<string[]>([]);
  const [mode, setMode] = useState<"assign" | "change" | null>(null);
  const [moving, setMoving] = useState(false);
  const [mark, setMark] = useState<{ row: WorkRow; out: boolean } | null>(null);
  const [removing, setRemoving] = useState<WorkRow | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const { openSnackbar } = useSnackbar();
  const lookup = useLoad(() => workLookups(day), [day]);
  const zones = useLoad(zoneLookup, []);
  const rafts = useLoad(() => zone ? listRafts(zone, 101) : Promise.resolve([]), [zone]);
  const rows = useLoad(() => workList(day), [day]);
  useEffect(() => { if (!zone && zones.data?.length) setZone(zones.data[0].id); }, [zone, zones.data]);
  const run = async (fn: () => Promise<unknown>) => {
    if (busy) return;
    setBusy(true); setError("");
    try {
      await fn(); setMark(null); setRemoving(null); setMode(null); setSelected([]); setMoving(false);
      await rows.reload(); openSnackbar({ text: "Đã ghi nhận.", type: "success" });
    } catch (e) { setError(errorText(e)); } finally { setBusy(false); }
  };
  const save = () => {
    if (!raft || !job || !selected.length) { setError("Chọn bè, loại việc và ít nhất một nhân viên."); return; }
    void run(() => mode === "change" ? changeCrew({ raftId: raft, jobTypeId: job, employeeIds: selected })
      : assignWork({ date: day, raftId: raft, jobTypeId: job, employeeIds: selected, moveExisting: moving }));
  };
  const employees = mode === "change"
    ? (rows.data ?? []).filter(a => !a.checkedOutAt).map(a => ({ id: a.employeeId, name: a.employeeName }))
    : lookup.data?.employees ?? [];
  return <ManagePage title="Phân công và chấm công">
    <DateField label="Ngày làm việc" value={day} onChange={value => { if (value) setDay(value); }} />
    <div className="action-row">
      {day >= todayIso() && can("WORK_ASSIGNMENTS", "Create") && <Button size="large" disabled={busy} onClick={() => navigate("/manage/work-plans")}>Kế hoạch và phân công</Button>}
      {day === todayIso() && can("WORK_ASSIGNMENTS", "Edit") && rows.data?.some(a => a.checkedInAt && !a.checkedOutAt) &&
        <Button size="large" variant="secondary" disabled={busy} onClick={() => { setMode("change"); setSelected([]); setError(""); }}>Đổi việc cho đội</Button>}
    </div>
    <div className="button-stack"><p className="form__hint">Giờ vào/ra lấy theo máy chủ lúc xác nhận tại bè. Nhân viên đưa mã QR hoặc Quản lý vùng chọn ghi thủ công.</p></div>
    <Loadable data={rows.data} error={rows.error} reload={() => void rows.reload()}>{items => items.length
      ? <div className="workforce-cards">{items.map(a => <div className="card form" key={a.id}>
        <p className="block__title">{a.employeeName}</p>
        <p>{a.job} · bè {a.raftCode ?? "—"}</p>
        <Badge text={a.checkedOutAt ? (a.checkedInAt ? "Đã ra ca" : "Thiếu giờ vào") : a.checkedInAt ? "Đang làm" : "Chưa vào ca"} tone={a.checkedOutAt && !a.checkedInAt ? "warning" : a.checkedInAt ? "success" : "neutral"} />
        <p className="form__hint">Vào: {dateTime(a.checkedInAt)} · Ra: {dateTime(a.checkedOutAt)}</p>
        {day === todayIso() && can("ATTENDANCE", "Create", a.zoneId) && <div className="action-row">
          {!a.checkedInAt && !a.checkedOutAt && <Button size="large" disabled={busy} onClick={() => { setMark({ row: a, out: false }); setError(""); }}>Vào ca</Button>}
          {!a.checkedOutAt && <Button size="large" variant="secondary" disabled={busy} onClick={() => { setMark({ row: a, out: true }); setError(""); }}>Ra ca</Button>}
        </div>}
        {!a.checkedInAt && !a.checkedOutAt && day >= todayIso() && can("WORK_ASSIGNMENTS", "Delete", a.zoneId) && (!a.responsibleAccountId || a.responsibleAccountId === permissions.accountId) &&
          <Button fullWidth size="large" variant="secondary" disabled={busy} onClick={() => { setRemoving(a); setError(""); }}>Gỡ phân công</Button>}
      </div>)}</div> : <Empty title="Chưa có phân công trong ngày" text="Chỉ hiển thị dữ liệu trong các vùng bạn có quyền." />}</Loadable>
    <div className="button-stack"><Button fullWidth size="large" variant="secondary" disabled={busy} onClick={() => void rows.reload()}>Tải lại</Button></div>
    <Sheet visible={mode !== null} onClose={() => { if (!busy) setMode(null); }} autoHeight mask handler title={mode === "change" ? "Đổi việc cho đội" : "Phân công nhân viên"}>
      <div className="sheet-form form workforce-sheet">
        <Section step={1} title="Nơi làm việc"><div className="form">
          <Loadable data={zones.data} error={zones.error} reload={() => void zones.reload()}>{items => <Select label="Vùng" value={zone} onChange={v => { setZone(String(v)); setRaft(""); }} closeOnSelect>
            {items.filter(z => can("WORK_ASSIGNMENTS", mode === "change" ? "Edit" : "Create", z.id)).map(z => <Select.Option key={z.id} value={z.id} title={z.name ?? z.code ?? ""} />)}
          </Select>}</Loadable>
          <Loadable data={rafts.data} error={rafts.error} reload={() => void rafts.reload()}>{items => <Select label="Bè (bắt buộc)" placeholder="Chọn bè" value={raft} onChange={v => setRaft(String(v))} closeOnSelect>
            {items.map(r => <Select.Option key={r.id} value={r.id} title={r.code ?? ""} />)}
          </Select>}</Loadable>
        </div></Section>
        <Loadable data={lookup.data} error={lookup.error} reload={() => void lookup.reload()}>{data => <>
          <Section step={2} title="Loại việc"><div className="form">
            <Select label="Loại việc (bắt buộc)" placeholder="Chọn loại việc" value={job} onChange={v => setJob(String(v))} closeOnSelect>
              {data.jobs.map(j => <Select.Option key={j.id} value={j.id} title={j.name} />)}
            </Select>
            {!data.jobs.length && <p className="form__hint">Chủ HTX cần thêm loại việc trong Cài đặt chấm công.</p>}
          </div></Section>
          <Section step={3} title="Chọn ít nhất một nhân viên (bắt buộc)">{employees.length ? <div className="crew-list">{employees.map(e => <label className="crew-choice" key={e.id}>
            <input type="checkbox" disabled={busy} checked={selected.includes(e.id)} onChange={event => setSelected(ids => event.target.checked ? [...ids, e.id] : ids.filter(id => id !== e.id))} />
            <span>{e.name}{"onLeave" in e && e.onLeave ? " · Đã duyệt nghỉ trong ngày này" : ""}</span>
          </label>)}</div> : <p className="form__hint">Chưa có nhân viên để chọn.</p>}</Section>
        </>}</Loadable>
        {mode === "assign" && <div className="crew-list"><label className="crew-choice"><input type="checkbox" checked={moving} disabled={busy} onChange={e => setMoving(e.target.checked)} /><span>Đồng ý chuyển những người đã được phân công sang bè này (nếu chưa vào ca)</span></label></div>}
        <FormError text={error} />
        <div className="sheet-actions">
          <Button fullWidth size="large" disabled={busy} loading={busy} onClick={save}>Xác nhận {mode === "change" ? "đổi việc" : "phân công"}</Button>
          <Button fullWidth size="large" variant="secondary" disabled={busy} onClick={() => setMode(null)}>Không, quay lại</Button>
        </div>
      </div>
    </Sheet>
    <Sheet visible={mark !== null} onClose={() => { if (!busy) setMark(null); }} autoHeight mask handler title={mark?.out ? "Xác nhận ra ca" : "Xác nhận vào ca"}>
      <div className="sheet-form form workforce-sheet">
        <p className="block__title">{mark?.row.employeeName}</p>
        <p>{mark?.row.job} · bè {mark?.row.raftCode}</p>
        {mark?.out && !mark.row.checkedInAt && <p className="form__hint">Chưa có giờ vào. Giờ ra sẽ được lưu ở trạng thái thiếu giờ vào, chưa tính công.</p>}
        <FormError text={error} />
        <div className="sheet-actions">
          <Button size="large" fullWidth disabled={busy} loading={busy} onClick={() => mark && void run(async () => markWork(mark.row.id, mark.out, await scanQr()))}>Quét mã QR của nhân viên</Button>
          <Button size="large" fullWidth variant="secondary" disabled={busy} onClick={() => mark && void run(() => markWork(mark.row.id, mark.out))}>Xác nhận ghi thủ công</Button>
          <Button size="large" fullWidth variant="secondary" disabled={busy} onClick={() => setMark(null)}>Không, quay lại</Button>
        </div>
      </div>
    </Sheet>
    <ConfirmSheet visible={removing !== null} title="Gỡ phân công" danger busy={busy}
      message={<><p>Gỡ công việc của {removing?.employeeName} trong ngày này?</p><FormError text={error} /></>}
      confirmText="Xác nhận gỡ" cancelText="Không, giữ phân công"
      onClose={() => { if (!busy) setRemoving(null); }}
      onConfirm={() => removing && void run(() => cancelWork(removing.id))} />
  </ManagePage>;
}
