import { useAtomValue } from "jotai";
import { useEffect, useState } from "react";
import { Button, Select, Sheet, useSnackbar } from "zmp-ui";
import FormError from "@/shared/ui/form-error";
import DateField from "@/shared/ui/date-field";
import { Badge, Empty, Loadable, ManagePage, Section } from "@/shared/ui/ui";
import WorkforceGate from "@/features/workforce/components/workforce-gate";
import { useLoad } from "@/shared/hooks/use-load";
import { errorText } from "@/shared/lib/messages";
import { listRafts, zoneLookup } from "@/features/farming/api/farm";
import { dateTime, todayIso } from "@/shared/lib/format";
import { assignWork, cancelWork, changeCrew, markWork, workList, workLookups, type WorkRow } from "@/features/workforce/api/workforce";
import { scanQr } from "@/shared/platform/zalo";
import { permissionsAtom } from "@/shared/auth/state";

export default function CrewPage() { return <WorkforceGate mode="manager"><CrewContent /></WorkforceGate>; }
function CrewContent() {
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
      {day >= todayIso() && can("WORK_ASSIGNMENTS", "Create") && <Button size="large" disabled={busy} onClick={() => { setMode("assign"); setSelected([]); setError(""); }}>Phân công</Button>}
      {day === todayIso() && can("WORK_ASSIGNMENTS", "Edit") && rows.data?.some(a => a.checkedInAt && !a.checkedOutAt) &&
        <Button size="large" variant="secondary" disabled={busy} onClick={() => { setMode("change"); setSelected([]); setError(""); }}>Đổi việc cho đội</Button>}
    </div>
    <p className="form__hint">Giờ vào/ra lấy theo máy chủ lúc xác nhận tại bè. Nhân viên đưa mã QR hoặc Quản lý vùng chọn ghi thủ công.</p>
    <Loadable data={rows.data} error={rows.error} reload={() => void rows.reload()}>{items => items.length
      ? items.map(a => <div className="card form" key={a.id}>
        <p className="block__title">{a.employeeName}</p>
        <p>{a.job} · bè {a.raftCode ?? "—"}</p>
        <Badge text={a.checkedOutAt ? (a.checkedInAt ? "Đã ra ca" : "Thiếu giờ vào") : a.checkedInAt ? "Đang làm" : "Chưa vào ca"} tone={a.checkedOutAt && !a.checkedInAt ? "warning" : a.checkedInAt ? "success" : "neutral"} />
        <p className="form__hint">Vào: {dateTime(a.checkedInAt)} · Ra: {dateTime(a.checkedOutAt)}</p>
        {day === todayIso() && can("ATTENDANCE", "Create", a.zoneId) && <div className="action-row">
          {!a.checkedInAt && !a.checkedOutAt && <Button size="large" disabled={busy} onClick={() => { setMark({ row: a, out: false }); setError(""); }}>Vào ca</Button>}
          {!a.checkedOutAt && <Button size="large" variant="secondary" disabled={busy} onClick={() => { setMark({ row: a, out: true }); setError(""); }}>Ra ca</Button>}
        </div>}
        {!a.checkedInAt && !a.checkedOutAt && day >= todayIso() && can("WORK_ASSIGNMENTS", "Delete", a.zoneId) &&
          <Button size="large" variant="tertiary" disabled={busy} onClick={() => { setRemoving(a); setError(""); }}>Gỡ phân công</Button>}
      </div>) : <Empty title="Chưa có phân công trong ngày" text="Chỉ hiển thị dữ liệu trong các vùng bạn có quyền." />}</Loadable>
    <Button fullWidth size="large" variant="secondary" disabled={busy} onClick={() => void rows.reload()}>Tải lại</Button>
    <Sheet visible={mode !== null} onClose={() => { if (!busy) setMode(null); }} autoHeight mask handler title={mode === "change" ? "Đổi việc cho đội" : "Phân công nhân viên"}>
      <div className="sheet-form form workforce-sheet">
        <Loadable data={zones.data} error={zones.error} reload={() => void zones.reload()}>{items => <Select label="Vùng" value={zone} onChange={v => { setZone(String(v)); setRaft(""); }} closeOnSelect>
          {items.filter(z => can("WORK_ASSIGNMENTS", mode === "change" ? "Edit" : "Create", z.id)).map(z => <Select.Option key={z.id} value={z.id} title={z.name ?? z.code ?? ""} />)}
        </Select>}</Loadable>
        <Loadable data={rafts.data} error={rafts.error} reload={() => void rafts.reload()}>{items => <Select label="Bè" value={raft} onChange={v => setRaft(String(v))} closeOnSelect>
          {items.map(r => <Select.Option key={r.id} value={r.id} title={r.code ?? ""} />)}
        </Select>}</Loadable>
        <Loadable data={lookup.data} error={lookup.error} reload={() => void lookup.reload()}>{data => <>
          <Select label="Loại việc" value={job} onChange={v => setJob(String(v))} closeOnSelect>
            {data.jobs.map(j => <Select.Option key={j.id} value={j.id} title={j.name} />)}
          </Select>
          {!data.jobs.length && <p className="form__hint">Chủ HTX cần thêm loại việc trong Cài đặt chấm công.</p>}
          <Section title="Chọn nhân viên">{employees.map(e => <label className="crew-choice" key={e.id}>
            <input type="checkbox" disabled={busy} checked={selected.includes(e.id)} onChange={event => setSelected(ids => event.target.checked ? [...ids, e.id] : ids.filter(id => id !== e.id))} />
            <span>{e.name}{"onLeave" in e && e.onLeave ? " · Đã duyệt nghỉ trong ngày này" : ""}</span>
          </label>)}</Section>
        </>}</Loadable>
        {mode === "assign" && <label className="crew-choice"><input type="checkbox" checked={moving} disabled={busy} onChange={e => setMoving(e.target.checked)} /><span>Đồng ý chuyển những người đã được phân công sang bè này (nếu chưa vào ca)</span></label>}
        <FormError text={error} />
        <Button fullWidth size="large" disabled={busy} loading={busy} onClick={save}>Xác nhận {mode === "change" ? "đổi việc" : "phân công"}</Button>
      </div>
    </Sheet>
    <Sheet visible={mark !== null} onClose={() => { if (!busy) setMark(null); }} autoHeight mask handler title={mark?.out ? "Xác nhận ra ca" : "Xác nhận vào ca"}>
      <div className="sheet-form form workforce-sheet">
        <p className="block__title">{mark?.row.employeeName}</p>
        <p>{mark?.row.job} · bè {mark?.row.raftCode}</p>
        {mark?.out && !mark.row.checkedInAt && <p className="form__hint">Chưa có giờ vào. Giờ ra sẽ được lưu ở trạng thái thiếu giờ vào, chưa tính công.</p>}
        <FormError text={error} />
        <Button size="large" fullWidth disabled={busy} loading={busy} onClick={() => mark && void run(async () => markWork(mark.row.id, mark.out, await scanQr()))}>Quét mã QR của nhân viên</Button>
        <Button size="large" fullWidth variant="secondary" disabled={busy} onClick={() => mark && void run(() => markWork(mark.row.id, mark.out))}>Xác nhận ghi thủ công</Button>
      </div>
    </Sheet>
    <Sheet visible={removing !== null} onClose={() => { if (!busy) setRemoving(null); }} autoHeight mask handler title="Gỡ phân công">
      <div className="sheet-form form workforce-sheet"><p>Gỡ công việc của {removing?.employeeName} trong ngày này?</p><FormError text={error} />
        <Button size="large" fullWidth disabled={busy} onClick={() => removing && void run(() => cancelWork(removing.id))}>Xác nhận gỡ</Button></div>
    </Sheet>
  </ManagePage>;
}
