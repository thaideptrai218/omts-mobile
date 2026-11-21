import type { AttendanceRoundingUnit, AttendanceSettingsVersion } from "@/features/workforce/models/Attendance";
import { useEffect, useState } from "react";
import { Button, Input, Select } from "zmp-ui";
import FormError from "@/components/FormError/FormError";
import DateField from "@/components/DateField/DateField";
import { Badge } from "@/components/Badge/Badge";
import { ConfirmSheet } from "@/components/ConfirmSheet/ConfirmSheet";
import { Empty } from "@/components/Empty/Empty";
import { Facts } from "@/components/Facts/Facts";
import { Loadable } from "@/components/Loadable/Loadable";
import { ManagePage } from "@/components/ManagePage/ManagePage";
import { Row } from "@/components/Row/Row";
import { Rows } from "@/components/Rows/Rows";
import { Section } from "@/components/Section/Section";
import WorkforceGate from "@/features/workforce/components/WorkforceGate/WorkforceGate";
import NativePicker from "@/features/workforce/components/NativePicker/NativePicker";
import { useLoad } from "@/hooks/useLoad";
import { isApiError } from "@/services/errors";
import { errorText } from "@/utils/errorText";
import { date, money, parseNumber, todayIso } from "@/utils/format";
import { addJobType, attendanceSettings, jobTypes, saveAttendanceSettings } from "@/features/workforce/services/workforceService";
import "@/features/workforce/styles/workforce.scss";

const ROUNDING: [AttendanceRoundingUnit, string][] = [["None", "Không làm tròn"], ["Minutes15", "15 phút"], ["Minutes30", "30 phút"], ["Hour1", "1 giờ"]];
const JOB_IN_USE = 101;
const roundingText = (unit: AttendanceRoundingUnit) => unit === "None" ? "Không làm tròn" : `Làm tròn xuống ${ROUNDING.find(r => r[0] === unit)?.[1] ?? unit}`;
const breakText = (v: Pick<AttendanceSettingsVersion, "breakStart" | "breakEnd">) =>
  v.breakStart ? `Nghỉ ${v.breakStart.slice(0, 5)} – ${v.breakEnd?.slice(0, 5) ?? "—"}` : "Không trừ giờ nghỉ";

export default function SettingsPage() { return <WorkforceGate mode="owner"><SettingsContent /></WorkforceGate>; }

/**
 * Cài đặt chấm công (LABOR-15, chỉ Chủ HTX): giờ nghỉ và đơn vị làm tròn từ một ngày, các phiên bản cũ được giữ. Loại việc
 * (LABOR-11.1): xem danh sách và thêm loại việc mới cùng tiền công mỗi giờ đầu tiên.
 */
function SettingsContent() {
  const settings = useLoad(attendanceSettings, []);
  const jobs = useLoad(jobTypes, []);
  const [name, setName] = useState("");
  const [rate, setRate] = useState("");
  const [rateFrom, setRateFrom] = useState(todayIso);
  const [effective, setEffective] = useState(todayIso);
  const [breakFrom, setBreakFrom] = useState("");
  const [breakTo, setBreakTo] = useState("");
  const [round, setRound] = useState<AttendanceRoundingUnit>("None");
  const [prefilled, setPrefilled] = useState(false);
  const [asking, setAsking] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [place, setPlace] = useState<"job" | "settings">("job");
  // Điền sẵn cài đặt đang áp dụng một lần, để Chủ HTX chỉ sửa phần cần đổi.
  useEffect(() => {
    const current = settings.data?.current;
    if (!current || prefilled) return;
    setPrefilled(true);
    setBreakFrom(current.breakStart?.slice(0, 5) ?? ""); setBreakTo(current.breakEnd?.slice(0, 5) ?? ""); setRound(current.roundingUnit);
  }, [settings.data, prefilled]);

  const fail = (where: "job" | "settings", text: string) => { setPlace(where); setSuccess(""); setError(text); };
  const run = async (where: "job" | "settings", message: string, fn: () => Promise<unknown>) => {
    if (busy) return;
    setBusy(true); setPlace(where); setError(""); setSuccess("");
    try { await fn(); setSuccess(message); await Promise.all([settings.reload(), jobs.reload()]); }
    catch (e) {
      // MSG-GEN-02 (mã cũ MSG03): tên loại việc đã có, không phân biệt chữ hoa, chữ thường (BR-LABOR-12).
      setError(where === "job" && (isApiError(e, "MSG03") || isApiError(e, "MSG-GEN-02")) ? "Đã có loại việc trùng tên này." : errorText(e));
      if (isApiError(e, "MSG06")) void settings.reload();
    } finally { setBusy(false); }
  };
  /** Kết quả hiện ngay dưới nút vừa bấm, không nằm cuối trang nơi người dùng không nhìn thấy. */
  const result = (where: "job" | "settings") => place === where && <><FormError text={error} />{success && <p className="status-note" role="status">{success}</p>}</>;
  const addJob = () => {
    const hourly = parseNumber(rate);
    if (!name.trim() || hourly === null || hourly <= 0 || !Number.isInteger(hourly) || !rateFrom) {
      fail("job", "Nhập tên loại việc, tiền công mỗi giờ (số nguyên lớn hơn 0) và ngày áp dụng.");
      return;
    }
    void run("job", "Đã thêm loại việc.", async () => { await addJobType({ name: name.trim(), hourlyRate: hourly, effectiveFrom: rateFrom }); setName(""); setRate(""); });
  };
  // Hỏi lại (MSG-LABOR-35) trước khi lưu; server kiểm tra giờ nghỉ, ngày áp dụng và kỳ lương đã chốt.
  const ask = () => {
    if (!effective) { fail("settings", "Chọn ngày áp dụng."); return; }
    if (!!breakFrom !== !!breakTo || (breakFrom && breakTo <= breakFrom)) { fail("settings", "Chọn cả giờ bắt đầu nghỉ và giờ hết nghỉ (giờ hết nghỉ sau giờ bắt đầu), hoặc để trống cả hai."); return; }
    setError(""); setSuccess(""); setAsking(true);
  };
  const save = () => {
    const rowVersion = settings.data?.rowVersion;
    setAsking(false);
    if (!rowVersion) return;
    void run("settings", "Đã lưu cài đặt chấm công.", () => saveAttendanceSettings({ breakStart: breakFrom || null, breakEnd: breakTo || null, roundingUnit: round, effectiveFrom: effective, rowVersion }));
  };

  return <ManagePage title="Cài đặt chấm công">
    <Section title="Loại công việc"><div className="workforce-cards">
      <Loadable data={jobs.data} error={jobs.error} reload={() => void jobs.reload()}>{data => data.items.length ? <>
        <Rows>{data.items.map(j => {
          const shown = j.currentRate ?? j.otherRates[0] ?? null;
          return <Row key={j.id} title={j.name}
            meta={shown ? `${money(shown.hourlyRate)} mỗi giờ, ${j.currentRate ? "từ" : "sẽ áp dụng từ"} ${date(shown.effectiveFrom)}` : "Chưa có tiền công"}
            badge={<Badge text={j.statusId === JOB_IN_USE ? "Đang dùng" : "Ngừng dùng"} tone={j.statusId === JOB_IN_USE ? "success" : "neutral"} />} />;
        })}</Rows>
        {data.total > data.items.length && <p className="form__hint">Đang hiện {data.items.length} trên {data.total} loại việc.</p>}
      </> : <Empty title="Chưa có loại việc" />}</Loadable>
      <div className="card form">
        <Input label="Tên loại việc mới (bắt buộc)" value={name} disabled={busy} maxLength={100} onChange={e => setName(e.target.value)} />
        <Input label="Tiền công mỗi giờ, đồng (bắt buộc)" placeholder="Ví dụ: 40.000" inputMode="numeric" value={rate} disabled={busy} maxLength={15} onChange={e => setRate(e.target.value)} />
        <DateField label="Áp dụng tiền công từ ngày (bắt buộc)" value={rateFrom} onChange={setRateFrom} />
        <Button size="large" fullWidth disabled={busy} loading={busy && place === "job"} onClick={addJob}>Thêm loại việc</Button>
        {result("job")}
      </div>
    </div></Section>
    <Section title="Giờ nghỉ và làm tròn"><div className="workforce-cards">
      <p className="form__hint">Mặc định không trừ giờ nghỉ, không làm tròn. Giờ được cộng theo từng loại việc rồi làm tròn xuống một lần trong ngày. Phiên bản cũ được giữ lại.</p>
      <Loadable data={settings.data} error={settings.error} reload={() => void settings.reload()}>{data => <>
        <div className="card form"><Facts items={[
          ["Đang áp dụng", data.current.effectiveFrom ? "Từ " + date(data.current.effectiveFrom) : "Từ khi bắt đầu dùng OMTS"],
          ["Giờ nghỉ", breakText(data.current)],
          ["Làm tròn", roundingText(data.current.roundingUnit)],
        ]} /></div>
        <div className="card form">
          <DateField label="Áp dụng từ ngày" value={effective} onChange={setEffective} />
          <NativePicker label="Nghỉ từ (để trống nếu không nghỉ)" type="time" hint="Bấm vào ô để chọn giờ." value={breakFrom} disabled={busy} onChange={setBreakFrom} />
          <NativePicker label="Nghỉ đến (để trống nếu không nghỉ)" type="time" hint="Bấm vào ô để chọn giờ." value={breakTo} disabled={busy} onChange={setBreakTo} />
          <Select label="Đơn vị làm tròn xuống" value={round} onChange={v => setRound(String(v) as AttendanceRoundingUnit)} closeOnSelect>
            {ROUNDING.map(([value, title]) => <Select.Option key={value} value={value} title={title} />)}
          </Select>
          <Button fullWidth size="large" disabled={busy} loading={busy && place === "settings"} onClick={ask}>Lưu cài đặt</Button>
          {result("settings")}
        </div>
        {data.versions.length ? <Rows>{data.versions.map(v => <Row key={v.effectiveFrom ?? "setup"} title={v.effectiveFrom ? "Từ " + date(v.effectiveFrom) : "Lúc bắt đầu dùng OMTS"}
          meta={`${breakText(v)} · ${roundingText(v.roundingUnit)}`}
          badge={v.effectiveFrom && v.effectiveFrom > todayIso() ? <Badge text="Sắp áp dụng" tone="warning" />
            : v.effectiveFrom === data.current.effectiveFrom ? <Badge text="Đang áp dụng" tone="success" /> : undefined} />)}</Rows>
          : <Empty title="Chưa lưu phiên bản cài đặt nào" />}
      </>}</Loadable>
    </div></Section>
    <ConfirmSheet visible={asking} title="Lưu cài đặt chấm công?"
      message={<p>Từ ngày {date(effective)}: {breakText({ breakStart: breakFrom || null, breakEnd: breakTo || null })}, {roundingText(round).toLowerCase()}. Giờ công từ ngày này tính theo cài đặt mới; nếu ngày này đã có cài đặt thì cài đặt đó được thay.</p>}
      confirmText="Lưu cài đặt" cancelText="Không, quay lại"
      onClose={() => setAsking(false)} onConfirm={save} />
  </ManagePage>;
}
