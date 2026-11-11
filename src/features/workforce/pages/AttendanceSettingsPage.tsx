import { useState } from "react";
import { Button, Input, Select } from "zmp-ui";
import FormError from "@/components/FormError/FormError";
import DateField from "@/components/DateField/DateField";
import { Empty } from "@/components/Empty/Empty";
import { Loadable } from "@/components/Loadable/Loadable";
import { ManagePage } from "@/components/ManagePage/ManagePage";
import { Row } from "@/components/Row/Row";
import { Rows } from "@/components/Rows/Rows";
import { Section } from "@/components/Section/Section";
import WorkforceGate from "@/features/workforce/components/WorkforceGate/WorkforceGate";
import NativePicker from "@/features/workforce/components/NativePicker/NativePicker";
import { useLoad } from "@/hooks/useLoad";
import { errorText } from "@/utils/errorText";
import { date, todayIso } from "@/utils/format";
import { attendanceSettings, createJob, saveAttendanceSettings, workLookups } from "@/features/workforce/services/workforceService";

export default function SettingsPage() { return <WorkforceGate mode="owner"><SettingsContent /></WorkforceGate>; }
function SettingsContent() {
  const settings = useLoad(attendanceSettings, []);
  const jobs = useLoad(() => workLookups(), []);
  const [name, setName] = useState("");
  const [effective, setEffective] = useState(todayIso);
  const [breakFrom, setBreakFrom] = useState("");
  const [breakTo, setBreakTo] = useState("");
  const [round, setRound] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [place, setPlace] = useState<"job" | "settings">("job");
  const run = async (where: "job" | "settings", message: string, fn: () => Promise<unknown>) => {
    if (busy) return;
    setBusy(true); setPlace(where); setError(""); setSuccess("");
    try { await fn(); setSuccess(message); await Promise.all([settings.reload(), jobs.reload()]); }
    catch (e) { setError(errorText(e)); } finally { setBusy(false); }
  };
  /** Kết quả hiện ngay dưới nút vừa bấm, không nằm cuối trang nơi người dùng không nhìn thấy. */
  const result = (where: "job" | "settings") => place === where && <><FormError text={error} />{success && <p className="status-note" role="status">{success}</p>}</>;
  return <ManagePage title="Cài đặt chấm công">
    <Section title="Loại công việc"><div className="workforce-cards">
      <Loadable data={jobs.data} error={jobs.error} reload={() => void jobs.reload()}>{data => data.jobs.length ? <Rows>{data.jobs.map(j => <Row key={j.id} title={j.name} />)}</Rows> : <Empty title="Chưa có loại việc" />}</Loadable>
      <div className="card form"><Input label="Tên loại việc mới (bắt buộc)" value={name} disabled={busy} maxLength={200} onChange={e => setName(e.target.value)} />
        <Button size="large" fullWidth disabled={busy || !name.trim()} onClick={() => void run("job", "Đã thêm loại việc.", async () => { await createJob(name.trim()); setName(""); })}>Thêm loại việc</Button>
        {result("job")}</div>
    </div></Section>
    <Section title="Giờ nghỉ và làm tròn"><div className="workforce-cards">
      <p className="form__hint">Mặc định không trừ giờ nghỉ, không làm tròn. Giờ được cộng theo từng loại việc rồi làm tròn xuống một lần trong ngày. Phiên bản cũ được giữ lại.</p>
      <div className="card form">
        <DateField label="Áp dụng từ ngày" value={effective} onChange={setEffective} />
        <NativePicker label="Nghỉ từ (để trống nếu không nghỉ)" type="time" hint="Bấm vào ô để chọn giờ." value={breakFrom} disabled={busy} onChange={setBreakFrom} />
        <NativePicker label="Nghỉ đến (để trống nếu không nghỉ)" type="time" hint="Bấm vào ô để chọn giờ." value={breakTo} disabled={busy} onChange={setBreakTo} />
        <Select label="Đơn vị làm tròn xuống" value={round} onChange={v => setRound(Number(v))} closeOnSelect>
          {[0, 15, 30, 60].map(v => <Select.Option key={v} value={v} title={v ? v + " phút" : "Không làm tròn"} />)}
        </Select>
        <Button fullWidth size="large" disabled={busy} onClick={() => void run("settings", "Đã lưu phiên bản cài đặt.", () => saveAttendanceSettings({ effectiveFrom: effective, breakFrom: breakFrom ? breakFrom + ":00" : null, breakTo: breakTo ? breakTo + ":00" : null, roundingMinutes: round }))}>Lưu phiên bản cài đặt</Button>
        {result("settings")}
      </div>
      <Loadable data={settings.data} error={settings.error} reload={() => void settings.reload()}>{rows => rows.length ? <Rows>{rows.map(s => <Row key={s.effectiveFrom} title={"Từ " + date(s.effectiveFrom)}
        meta={(s.breakFrom ? s.breakFrom.slice(0, 5) + " – " + s.breakTo?.slice(0, 5) : "Không nghỉ") + " · " + (s.roundingMinutes ? "Làm tròn " + s.roundingMinutes + " phút" : "Không làm tròn")} />)}</Rows> : <Empty title="Chưa có phiên bản cài đặt" />}</Loadable>
    </div></Section>
  </ManagePage>;
}
