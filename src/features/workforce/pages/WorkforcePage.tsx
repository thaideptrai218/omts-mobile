import type { StaffAttendance } from "@/features/workforce/models/Attendance";
import type { WorkRow } from "@/features/workforce/models/WorkAssignment";
import { useAtomValue } from "jotai";
import { useEffect, useState } from "react";
import { Button, Input, Select, Sheet, useNavigate, useSnackbar } from "zmp-ui";
import FormError from "@/components/FormError/FormError";
import DateField from "@/components/DateField/DateField";
import { Badge } from "@/components/Badge/Badge";
import { ConfirmSheet } from "@/components/ConfirmSheet/ConfirmSheet";
import { Empty } from "@/components/Empty/Empty";
import { Loadable } from "@/components/Loadable/Loadable";
import { ManagePage } from "@/components/ManagePage/ManagePage";
import { Section } from "@/components/Section/Section";
import NativePicker from "@/features/workforce/components/NativePicker/NativePicker";
import WorkforceGate from "@/features/workforce/components/WorkforceGate/WorkforceGate";
import { useLoad } from "@/hooks/useLoad";
import { errorText } from "@/utils/errorText";
import { listRafts, zoneLookup } from "@/features/farming/services/farmService";
import { date, todayIso } from "@/utils/format";
import {
  assignWork, changeCrew, checkIn, checkOut, crewStart, editWork, removeWork, staffCheckIn, staffCheckOut, staffList, workList, workLookups,
} from "@/features/workforce/services/workforceService";
import { attendanceStatus, clock } from "@/features/workforce/utils/workText";
import { isApiError } from "@/services/errors";
import { scanQr, ScanUnavailable } from "@/services/zaloService";
import { permissionsAtom } from "@/features/auth/state/authAtoms";
import "@/features/workforce/styles/workforce.scss";

/** Người được ghi giờ: một dòng phân công (LABOR-04.0, 04.1) hoặc một nhân viên chính thức (LABOR-04.7). */
type Mark = { id: string; staff: boolean; name: string; detail: string; out: boolean; checkedIn: boolean };
type Mode = "assign" | "edit" | "change" | "start";
type Choice = { id: string; name: string; note: string; disabled?: boolean };

const TITLE: Record<Mode, string> = { assign: "Phân công nhân viên", edit: "Đổi bè hoặc loại việc", change: "Đổi việc cho đội", start: "Ghi giờ bắt đầu của đội" };
const CONFIRM: Record<Mode, string> = { assign: "Xác nhận phân công", edit: "Lưu thay đổi", change: "Xác nhận đổi việc", start: "Ghi giờ vào cho đội" };
const ids = (value: unknown) => (Array.isArray(value) ? value.map(String) : []);

/** Câu báo sau khi vào ca, ra ca: MSG-LABOR-12 khi ra ca mà chưa có giờ vào (LABOR-04.6), còn lại MSG-GEN-05. */
function recordedText(r: Pick<WorkRow, "employeeName" | "checkedInAt" | "checkedOutAt" | "messageCode">, out: boolean) {
  return r.messageCode === "MSG-LABOR-12"
    ? `${r.employeeName} chưa có giờ vào hôm nay. Giờ ra lúc ${clock(r.checkedOutAt)} đã được lưu, nhưng ngày này chưa tính công cho tới khi Chủ HTX sửa giờ vào hoặc duyệt yêu cầu của nhân viên.`
    : `Đã ghi giờ ${out ? "ra" : "vào"} của ${r.employeeName} lúc ${clock(out ? r.checkedOutAt : r.checkedInAt)}.`;
}

export default function WorkforcePage() { return <WorkforceGate mode="manager"><BoardContent /></WorkforceGate>; }

/**
 * Bảng phân công và chấm công trong ngày (SCR-LABOR-02). Quản lý vùng làm trong vùng của bè, Chủ HTX mọi vùng; server kiểm
 * tra lại vùng của từng bản ghi. Phân công từ hôm nay trở đi (LABOR-02.0), đổi hoặc gỡ trước khi vào ca (LABOR-02.2), đổi việc
 * cho đội trong hôm nay (LABOR-02.1), vào ca và ra ca chỉ trong hôm nay bằng mã QR của nhân viên hoặc ghi thủ công
 * (LABOR-04.0, 04.1), giờ bắt đầu của đội kèm lý do (LABOR-04.8), nhân viên chính thức chấm công không cần bè (LABOR-04.7).
 */
function BoardContent() {
  const navigate = useNavigate();
  const permissions = useAtomValue(permissionsAtom)!;
  const can = (code: string, action: string, zone?: string) => permissions.isCooperativeOwner || permissions.functions.some(f =>
    f.function === code && f.actions.includes(action) && (!zone || f.allZones || f.zoneIds.includes(zone)));
  const [day, setDay] = useState(todayIso);
  const [zone, setZone] = useState("");
  const [raft, setRaft] = useState("");
  const [job, setJob] = useState("");
  const [selected, setSelected] = useState<string[]>([]);
  const [mode, setMode] = useState<Mode | null>(null);
  const [editing, setEditing] = useState<WorkRow | null>(null);
  const [moveAsk, setMoveAsk] = useState<string[] | null>(null);
  const [startTime, setStartTime] = useState("");
  const [reason, setReason] = useState("");
  const [mark, setMark] = useState<Mark | null>(null);
  const [removing, setRemoving] = useState<WorkRow | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const { openSnackbar } = useSnackbar();
  const today = day === todayIso();
  const seesStaff = can("ATTENDANCE", "View");
  const lookup = useLoad(() => workLookups(day), [day]);
  const zones = useLoad(zoneLookup, []);
  const rafts = useLoad(() => zone ? listRafts(zone, 101) : Promise.resolve([]), [zone]);
  const rows = useLoad(() => workList(day), [day]);
  const staff = useLoad(() => seesStaff ? staffList(day) : Promise.resolve([]), [day, seesStaff]);
  useEffect(() => {
    if (!zone && zones.data?.length) setZone((zones.data.find(z => can("WORK_ASSIGNMENTS", "Create", z.id)) ?? zones.data[0]).id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [zone, zones.data]);

  const open = (next: Mode, row?: WorkRow) => {
    setMode(next); setEditing(row ?? null); setSelected([]); setReason(""); setStartTime(""); setError("");
    setRaft(row?.raftId ?? ""); setJob(row?.jobTypeId ?? "");
    if (row) setZone(row.zoneId);
  };
  const close = () => { setMode(null); setEditing(null); setMoveAsk(null); setMark(null); setRemoving(null); setSelected([]); };
  /** Gửi một thao tác; `handled` trả true khi lỗi đã được xử lý riêng (ví dụ hỏi MSG-LABOR-06). */
  const run = async <T,>(fn: () => Promise<T>, done: (result: T) => { text: string; warning?: boolean }, handled?: (e: unknown) => boolean) => {
    if (busy) return;
    setBusy(true); setError("");
    try {
      const result = await fn();
      close();
      const message = done(result);
      openSnackbar({ text: message.text, type: message.warning ? "warning" : "success", duration: message.warning ? 8000 : 3000 });
      await Promise.all([rows.reload(), staff.reload(), lookup.reload()]);
    } catch (e) { if (!handled?.(e)) setError(errorText(e)); } finally { setBusy(false); }
  };
  // Người đã ở bè khác trong ngày mà chưa vào ca: server trả 409 MSG-LABOR-06, hỏi rồi gửi lại với moveExisting (LABOR-02.4).
  const assign = (moveExisting: boolean) => void run(
    () => assignWork({ date: day, raftId: raft, jobTypeId: job, employeeIds: selected, moveExisting }),
    r => ({ text: `Đã phân công ${r.length} người ngày ${date(day)}.` }),
    e => {
      if (moveExisting || !isApiError(e, "MSG-LABOR-06")) return false;
      setMoveAsk(ids(e.details.employeeIds));
      return true;
    });
  const save = () => {
    if (mode === "start") {
      if (!raft || !startTime || !reason.trim() || !selected.length) { setError("Chọn bè, giờ bắt đầu, nhập lý do và chọn ít nhất một người."); return; }
      void run(() => crewStart({ raftId: raft, startTime, reason: reason.trim(), employeeIds: selected }), r => ({ text: `Đã ghi giờ vào lúc ${startTime} cho ${r.length} người.` }));
      return;
    }
    if (!raft || !job || (mode !== "edit" && !selected.length)) { setError(mode === "edit" ? "Chọn bè và loại việc." : "Chọn bè, loại việc và ít nhất một nhân viên."); return; }
    if (mode === "edit" && editing) void run(() => editWork(editing.id, { raftId: raft, jobTypeId: job }), r => ({ text: `Đã đổi việc của ${r.employeeName}: ${r.job}, bè ${r.raftCode ?? "—"}.` }));
    else if (mode === "change") void run(() => changeCrew({ raftId: raft, jobTypeId: job, employeeIds: selected }), () => ({ text: `Đã đổi việc cho ${selected.length} người.` }));
    else assign(false);
  };
  const record = (qrCode: string | null) => {
    if (!mark) return;
    const { id, out, staff: isStaff } = mark;
    const body = { qrCode };
    void run((): Promise<WorkRow | StaffAttendance> => isStaff ? (out ? staffCheckOut(id, body) : staffCheckIn(id, body)) : (out ? checkOut(id, body) : checkIn(id, body)),
      r => ({ text: recordedText(r, out), warning: r.messageCode === "MSG-LABOR-12" }));
  };
  const scanAndRecord = async () => {
    let code: string;
    try { code = await scanQr(); } catch (e) {
      setError(e instanceof ScanUnavailable && !e.insideZalo ? "Chỉ quét được khi mở trong Zalo. Bạn có thể ghi thủ công." : "Chưa quét được mã. Bấm quét lại hoặc ghi thủ công.");
      return;
    }
    record(code);
  };

  // Bè có người chưa vào ca hôm nay, trong vùng được chấm công: nơi dùng được "Ghi giờ bắt đầu của đội".
  const startRafts = [...new Map((rows.data ?? [])
    .filter(a => a.raftId && !a.checkedInAt && !a.checkedOutAt && can("ATTENDANCE", "Create", a.zoneId))
    .map(a => [a.raftId as string, a.raftCode ?? "—"])).entries()];
  const choices: Choice[] = mode === "assign"
    // LABOR-02 bước 5: người làm được loại việc đã chọn đứng trước.
    ? [...(lookup.data?.employees ?? [])].sort((a, b) => Number(b.jobTypeIds.includes(job)) - Number(a.jobTypeIds.includes(job))).map(e => ({
      id: e.id,
      name: e.name,
      disabled: e.checkedIn,
      note: [e.code, e.type === "Staff" ? "Nhân viên chính thức" : "", job && e.jobTypeIds.includes(job) ? "Làm được loại việc này" : "",
        e.raftCode ? `Đang ở bè ${e.raftCode}` : "", e.onLeave ? "Đã duyệt nghỉ ngày này" : "",
        e.checkedIn ? "Đã vào ca, muốn chuyển thì dùng “Đổi việc cho đội”" : ""].filter(Boolean).join(" · "),
    }))
    : mode === "change" ? (rows.data ?? []).filter(a => !a.checkedOutAt).map(a => ({ id: a.employeeId, name: a.employeeName, note: `${a.job} · bè ${a.raftCode ?? "—"} · ${attendanceStatus(a).text}` }))
      : mode === "start" ? (rows.data ?? []).filter(a => a.raftId === raft && !a.checkedInAt && !a.checkedOutAt).map(a => ({ id: a.employeeId, name: a.employeeName, note: a.job }))
        : [];
  const moving = (moveAsk ?? []).map(id => lookup.data?.employees.find(e => e.id === id)).map(e => e ? `${e.name}${e.raftCode ? ` (bè ${e.raftCode})` : ""}` : "").filter(Boolean);
  const newRaft = rafts.data?.find(r => r.id === raft)?.code ?? "";

  return <ManagePage title="Phân công và chấm công">
    <DateField label="Ngày làm việc" value={day} onChange={value => { if (value) setDay(value); }} />
    <div className="action-row">
      {day >= todayIso() && can("WORK_ASSIGNMENTS", "Create") && <Button size="large" disabled={busy} onClick={() => open("assign")}>Phân công nhân viên</Button>}
      {day >= todayIso() && can("WORK_ASSIGNMENTS", "Create") && <Button size="large" variant="secondary" disabled={busy} onClick={() => navigate("/manage/work-plans")}>Kế hoạch và phân công</Button>}
      {today && can("WORK_ASSIGNMENTS", "Edit") && rows.data?.some(a => a.checkedInAt && !a.checkedOutAt) &&
        <Button size="large" variant="secondary" disabled={busy} onClick={() => open("change")}>Đổi việc cho đội</Button>}
      {today && startRafts.length > 0 && <Button size="large" variant="secondary" disabled={busy} onClick={() => open("start")}>Ghi giờ bắt đầu của đội</Button>}
    </div>
    <div className="button-stack"><p className="form__hint">Giờ vào, giờ ra lấy theo giờ máy chủ lúc bấm xác nhận tại bè. Quét mã QR chấm công trên điện thoại của nhân viên, hoặc ghi thủ công.</p></div>
    <Loadable data={rows.data} error={rows.error} reload={() => void rows.reload()}>{items => items.length
      ? <div className="workforce-cards">{items.map(a => <div className="card form" key={a.id}>
        <p className="block__title">{a.employeeName}{a.employeeCode ? ` · ${a.employeeCode}` : ""}</p>
        <p>{a.job} · bè {a.raftCode ?? "—"}</p>
        <div><Badge {...attendanceStatus(a)} />{a.onLeave && <> <Badge text="Đã duyệt nghỉ ngày này" tone="warning" /></>}</div>
        <p className="form__hint">Vào: {clock(a.checkedInAt)} · Ra: {clock(a.checkedOutAt)}</p>
        {today && can("ATTENDANCE", "Create", a.zoneId) && <div className="action-row">
          {!a.checkedInAt && !a.checkedOutAt && <Button size="large" disabled={busy} onClick={() => { setMark({ id: a.id, staff: false, name: a.employeeName, detail: `${a.job} · bè ${a.raftCode ?? "—"}`, out: false, checkedIn: false }); setError(""); }}>Vào ca</Button>}
          {!a.checkedOutAt && <Button size="large" variant="secondary" disabled={busy} onClick={() => { setMark({ id: a.id, staff: false, name: a.employeeName, detail: `${a.job} · bè ${a.raftCode ?? "—"}`, out: true, checkedIn: !!a.checkedInAt }); setError(""); }}>Ra ca</Button>}
        </div>}
        {!a.checkedInAt && !a.checkedOutAt && day >= todayIso() && <div className="action-row">
          {can("WORK_ASSIGNMENTS", "Edit", a.zoneId) && <Button size="large" variant="secondary" disabled={busy} onClick={() => open("edit", a)}>Đổi bè hoặc loại việc</Button>}
          {can("WORK_ASSIGNMENTS", "Delete", a.zoneId) && <Button size="large" variant="secondary" disabled={busy} onClick={() => { setRemoving(a); setError(""); }}>Gỡ phân công</Button>}
        </div>}
      </div>)}</div> : <Empty title="Chưa có phân công trong ngày" text="Chỉ hiển thị dữ liệu trong các vùng bạn có quyền." />}</Loadable>
    {seesStaff && <Loadable data={staff.data} error={staff.error} reload={() => void staff.reload()}>{items => items.length > 0 && <Section title="Nhân viên chính thức">
      <p className="form__hint">Chấm công không cần phân công bè, tính theo ngày công.</p>
      <div className="workforce-cards">{items.map(s => <div className="card form" key={s.employeeId}>
        <p className="block__title">{s.employeeName}{s.employeeCode ? ` · ${s.employeeCode}` : ""}</p>
        <div><Badge {...attendanceStatus(s)} />{s.onLeave && <> <Badge text="Đã duyệt nghỉ ngày này" tone="warning" /></>}</div>
        <p className="form__hint">Vào: {clock(s.checkedInAt)} · Ra: {clock(s.checkedOutAt)}</p>
        {today && can("ATTENDANCE", "Create") && <div className="action-row">
          {!s.checkedInAt && !s.checkedOutAt && <Button size="large" disabled={busy} onClick={() => { setMark({ id: s.employeeId, staff: true, name: s.employeeName, detail: "Nhân viên chính thức", out: false, checkedIn: false }); setError(""); }}>Vào ca</Button>}
          {!s.checkedOutAt && <Button size="large" variant="secondary" disabled={busy} onClick={() => { setMark({ id: s.employeeId, staff: true, name: s.employeeName, detail: "Nhân viên chính thức", out: true, checkedIn: !!s.checkedInAt }); setError(""); }}>Ra ca</Button>}
        </div>}
      </div>)}</div>
    </Section>}</Loadable>}
    <div className="button-stack">
      {(permissions.isCooperativeOwner || can("WORK_ASSIGNMENTS", "View")) && <Button fullWidth size="large" variant="secondary" disabled={busy} onClick={() => navigate("/manage/leave-requests")}>Yêu cầu của nhân viên</Button>}
      <Button fullWidth size="large" variant="secondary" disabled={busy} onClick={() => { void rows.reload(); void staff.reload(); }}>Tải lại</Button>
    </div>

    <Sheet visible={mode !== null && !moveAsk} onClose={() => { if (!busy) setMode(null); }} autoHeight mask handler title={mode ? TITLE[mode] : ""}>
      <div className="sheet-form form workforce-sheet">
        {editing && <p className="block__title">{editing.employeeName} · ngày {date(editing.date)}</p>}
        {mode === "change" && <p className="form__hint">Người đang làm chuyển sang việc mới từ bây giờ; người chưa vào ca được đổi phân công.</p>}
        {mode === "start" ? <>
          <p className="form__hint">Dùng khi bạn không có mặt ở bè lúc đội bắt đầu. Giờ vào của những người được chọn ghi theo giờ bạn nhập, kèm lý do.</p>
          <Section step={1} title="Bè của đội">
            <Select label="Bè (bắt buộc)" placeholder="Chọn bè" value={raft} onChange={v => { setRaft(String(v)); setSelected([]); }} closeOnSelect>
              {startRafts.map(([id, code]) => <Select.Option key={id} value={id} title={code} />)}
            </Select>
          </Section>
          <Section step={2} title="Giờ bắt đầu và lý do"><div className="form">
            <NativePicker label="Giờ đội bắt đầu (bắt buộc)" type="time" value={startTime} hint="Không được sau giờ hiện tại." disabled={busy} onChange={setStartTime} />
            <Input.TextArea label="Lý do (bắt buộc)" maxLength={1000} value={reason} disabled={busy} onChange={e => setReason(e.target.value)} />
          </div></Section>
        </> : <>
          <Section step={1} title="Nơi làm việc"><div className="form">
            <Loadable data={zones.data} error={zones.error} reload={() => void zones.reload()}>{items => <Select label="Vùng" value={zone} onChange={v => { setZone(String(v)); setRaft(""); }} closeOnSelect>
              {items.filter(z => can("WORK_ASSIGNMENTS", mode === "assign" ? "Create" : "Edit", z.id)).map(z => <Select.Option key={z.id} value={z.id} title={z.name ?? z.code ?? ""} />)}
            </Select>}</Loadable>
            <Loadable data={rafts.data} error={rafts.error} reload={() => void rafts.reload()}>{items => <Select label="Bè (bắt buộc)" placeholder="Chọn bè" value={raft} onChange={v => setRaft(String(v))} closeOnSelect>
              {items.map(r => <Select.Option key={r.id} value={r.id} title={r.code ?? ""} />)}
            </Select>}</Loadable>
          </div></Section>
          <Loadable data={lookup.data} error={lookup.error} reload={() => void lookup.reload()}>{data => <Section step={2} title="Loại việc"><div className="form">
            <Select label="Loại việc (bắt buộc)" placeholder="Chọn loại việc" value={job} onChange={v => setJob(String(v))} closeOnSelect>
              {data.jobs.map(j => <Select.Option key={j.id} value={j.id} title={j.name} />)}
            </Select>
            {!data.jobs.length && <p className="form__hint">Chủ HTX cần thêm loại việc trước.</p>}
          </div></Section>}</Loadable>
        </>}
        {mode !== "edit" && <Section step={3} title={mode === "start" ? "Chọn người đã có mặt (bắt buộc)" : "Chọn ít nhất một nhân viên (bắt buộc)"}>{choices.length
          ? <div className="crew-list">{choices.map(c => <label className="crew-choice" key={c.id}>
            <input type="checkbox" disabled={busy || c.disabled} checked={selected.includes(c.id)} onChange={event => setSelected(list => event.target.checked ? [...list, c.id] : list.filter(id => id !== c.id))} />
            <span>{c.name}{c.note && <span className="form__hint"> · {c.note}</span>}</span>
          </label>)}</div>
          : <p className="form__hint">{mode === "assign" && !lookup.data ? "Đang tải danh sách nhân viên..." : mode === "start" && !raft ? "Chọn bè trước." : "Chưa có nhân viên để chọn."}</p>}</Section>}
        <FormError text={error} />
        <div className="sheet-actions">
          <Button fullWidth size="large" disabled={busy} loading={busy} onClick={save}>{mode ? CONFIRM[mode] : ""}</Button>
          <Button fullWidth size="large" variant="secondary" disabled={busy} onClick={() => setMode(null)}>Không, quay lại</Button>
        </div>
      </div>
    </Sheet>
    <ConfirmSheet visible={moveAsk !== null} title="Chuyển sang bè khác?" busy={busy}
      message={<><p>{moving.length ? moving.join(", ") : "Có nhân viên"} đã được phân công bè khác ngày {date(day)} và chưa vào ca. Chuyển những người này sang bè {newRaft}?</p><FormError text={error} /></>}
      confirmText="Đồng ý chuyển" cancelText="Không, chọn lại"
      onClose={() => { if (!busy) { setMoveAsk(null); setError(""); } }}
      onConfirm={() => assign(true)} />
    <Sheet visible={mark !== null} onClose={() => { if (!busy) setMark(null); }} autoHeight mask handler title={mark?.out ? "Xác nhận ra ca" : "Xác nhận vào ca"}>
      <div className="sheet-form form workforce-sheet">
        <p className="block__title">{mark?.name}</p>
        <p>{mark?.detail}</p>
        {mark?.out && !mark.checkedIn && <p className="form__hint">Chưa có giờ vào. Giờ ra vẫn được lưu nhưng ngày này chưa tính công cho tới khi Chủ HTX sửa giờ vào hoặc duyệt yêu cầu của nhân viên.</p>}
        <FormError text={error} />
        <div className="sheet-actions">
          <Button size="large" fullWidth disabled={busy} loading={busy} onClick={() => void scanAndRecord()}>Quét mã QR của nhân viên</Button>
          <Button size="large" fullWidth variant="secondary" disabled={busy} onClick={() => record(null)}>Xác nhận ghi thủ công</Button>
          <Button size="large" fullWidth variant="secondary" disabled={busy} onClick={() => setMark(null)}>Không, quay lại</Button>
        </div>
      </div>
    </Sheet>
    <ConfirmSheet visible={removing !== null} title="Gỡ phân công" danger busy={busy}
      message={<><p>Gỡ công việc {removing?.job} ở bè {removing?.raftCode ?? "—"} của {removing?.employeeName} ngày {date(removing?.date)}?</p><FormError text={error} /></>}
      confirmText="Xác nhận gỡ" cancelText="Không, giữ phân công"
      onClose={() => { if (!busy) setRemoving(null); }}
      onConfirm={() => { const row = removing; if (row) void run(() => removeWork(row.id), () => ({ text: `Đã gỡ phân công của ${row.employeeName}.` })); }} />
  </ManagePage>;
}
