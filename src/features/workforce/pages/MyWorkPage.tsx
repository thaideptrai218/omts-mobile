import type { AttendanceDay } from "@/features/workforce/models/Attendance";
import type { EmployeeRequest, EmployeeRequestType, SubmitEmployeeRequest } from "@/features/workforce/models/EmployeeRequest";
import { newOperationId } from "@/utils/operationId";
import { useCallback, useEffect, useRef, useState } from "react";
import { Button, Input } from "zmp-ui";
import FormError from "@/components/FormError/FormError";
import DateField from "@/components/DateField/DateField";
import { Badge } from "@/components/Badge/Badge";
import { Chips } from "@/components/Chips/Chips";
import { ConfirmSheet } from "@/components/ConfirmSheet/ConfirmSheet";
import { Empty } from "@/components/Empty/Empty";
import { Facts } from "@/components/Facts/Facts";
import { Loadable } from "@/components/Loadable/Loadable";
import { ManagePage } from "@/components/ManagePage/ManagePage";
import { Row } from "@/components/Row/Row";
import { Rows } from "@/components/Rows/Rows";
import { Section } from "@/components/Section/Section";
import WorkforceGate from "@/features/workforce/components/WorkforceGate/WorkforceGate";
import MyPurchaseShifts from "@/features/workforce/components/MyPurchaseShifts/MyPurchaseShifts";
import NativePicker from "@/features/workforce/components/NativePicker/NativePicker";
import { useLoad } from "@/hooks/useLoad";
import { errorText } from "@/utils/errorText";
import { isApiError } from "@/services/errors";
import { date, dateTime, num, todayIso } from "@/utils/format";
import { attendanceQr, cancelRequest, myWork, submitRequest } from "@/features/workforce/services/workforceService";
import { attendanceStatus, clock, REQUEST_STATUS, REQUEST_TYPE_TEXT, requestDays, requestStatus } from "@/features/workforce/utils/workText";
import "@/features/workforce/styles/workforce.scss";

const REQUEST_TYPES: [EmployeeRequestType, string][] = [["Leave", "Nghỉ phép"], ["MissedCheckIn", "Quên giờ vào"], ["MissedCheckOut", "Quên giờ ra"]];

export default function MyWorkPage() { return <WorkforceGate mode="personal"><MyWorkContent /></WorkforceGate>; }

/**
 * Công việc của tôi (LABOR-08): phân công, ngày công kèm giờ theo loại việc, yêu cầu đã gửi; mã QR chấm công đổi mỗi 60 giây
 * (LABOR-07); gửi hoặc hủy yêu cầu nghỉ phép, quên giờ vào, quên giờ ra (LABOR-10). Server chỉ trả bản ghi của chính
 * người đang đăng nhập (BR-LABOR-09).
 */
function MyWorkContent() {
  const [month, setMonth] = useState(() => todayIso().slice(0, 7));
  const [tab, setTab] = useState<"work" | "attendance" | "requests">("work");
  const [type, setType] = useState<EmployeeRequestType>("Leave");
  const [from, setFrom] = useState(todayIso);
  const [to, setTo] = useState(todayIso);
  const [day, setDay] = useState(todayIso);
  const [time, setTime] = useState("");
  const [reason, setReason] = useState("");
  const [operationId, setOperationId] = useState(newOperationId);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [sent, setSent] = useState("");
  const [cancelling, setCancelling] = useState<EmployeeRequest | null>(null);
  const [qrOn, setQrOn] = useState(false);
  const [qr, setQr] = useState<{ image: string; until: number } | null>(null);
  const [qrError, setQrError] = useState("");
  const [now, setNow] = useState(Date.now);
  const fetching = useRef(false);
  const lastDay = new Date(Number(month.slice(0, 4)), Number(month.slice(5, 7)), 0).getDate();
  const data = useLoad(() => myWork(month + "-01", month + "-" + lastDay), [month, lastDay]);
  useEffect(() => { const timer = window.setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(timer); }, []);

  // Hạn của mã tính theo `secondsValid` từ lúc nhận, không theo đồng hồ máy, để máy chạy lệch giờ không xin mã liên tục.
  const loadQr = useCallback(async () => {
    if (fetching.current) return;
    fetching.current = true;
    setQrError("");
    try {
      const code = await attendanceQr();
      const QRCode = await import("qrcode");
      setQr({ image: await QRCode.toDataURL(code.code, { width: 320, margin: 4 }), until: Date.now() + code.secondsValid * 1000 });
    } catch (e) {
      setQrOn(false); setQr(null); setQrError(errorText(e));
    } finally { fetching.current = false; }
  }, []);
  // Mã đang hiện mà hết hạn thì tự xin mã tiếp theo (LABOR-07); rời màn hoặc bấm "Ẩn mã" thì dừng.
  useEffect(() => { if (qrOn && (!qr || qr.until <= now)) void loadQr(); }, [qrOn, qr, now, loadQr]);

  const send = async () => {
    const text = reason.trim();
    if (type === "Leave" ? !from || !to || to < from : !day || day > todayIso() || !time) {
      setError(type === "Leave" ? "Chọn đúng khoảng ngày nghỉ: đến ngày không được trước từ ngày." : "Chọn ngày (hôm nay hoặc trước đó) và giờ cần ghi.");
      return;
    }
    if (!text) { setError("Nhập lý do."); return; }
    const body: SubmitEmployeeRequest = type === "Leave"
      ? { type, from, to, reason: text, clientOperationId: operationId }
      : { type, day, requestedTime: time, reason: text, clientOperationId: operationId };
    setBusy(true); setError(""); setSent("");
    try {
      await submitRequest(body);
      setOperationId(newOperationId()); setReason(""); setTime("");
      setSent("Đã gửi yêu cầu đến Chủ HTX. Kết quả hiện ở danh sách bên dưới khi Chủ HTX duyệt.");
      await data.reload();
    } catch (e) {
      // MSG-GEN-02 (mã cũ MSG03): đã có yêu cầu cùng loại đang chờ duyệt cho những ngày này.
      setError(isApiError(e, "MSG03") || isApiError(e, "MSG-GEN-02")
        ? "Bạn đã có yêu cầu cùng loại đang chờ duyệt cho những ngày này. Chờ Chủ HTX duyệt, hoặc hủy yêu cầu đó rồi gửi lại."
        : errorText(e));
    } finally { setBusy(false); }
  };
  /** Ngày thiếu giờ: mở sẵn biểu mẫu quên giờ vào hoặc quên giờ ra cho ngày đó. */
  const fix = (a: AttendanceDay) => {
    setType(a.checkedInAt ? "MissedCheckOut" : "MissedCheckIn"); setDay(a.date); setTime(""); setError(""); setSent(""); setTab("requests");
  };

  return <ManagePage title="Công việc của tôi">
    <Loadable data={data.data} error={data.error} reload={() => void data.reload()}>{(work) => !work.employeeId
      ? <Empty title="Chưa liên kết hồ sơ nhân viên" text="Nhờ Chủ HTX gắn tài khoản này với hồ sơ nhân viên của bạn." />
      : <>
        <div className="card form">
          <p className="block__title">{work.name}</p>
          <p className="form__hint">Đưa mã QR cho Quản lý vùng quét khi bắt đầu và kết thúc làm việc tại bè. Mã tự đổi mỗi phút.</p>
          {qrOn
            ? <Button size="large" fullWidth variant="secondary" onClick={() => { setQrOn(false); setQr(null); }}>Ẩn mã chấm công</Button>
            : <Button size="large" fullWidth onClick={() => { setQrError(""); setQrOn(true); }}>Hiện mã chấm công</Button>}
          {qrOn && <div className="attendance-qr">{qr && qr.until > now
            ? <><img src={qr.image} alt="Mã QR chấm công cá nhân" /><p>Còn {Math.ceil((qr.until - now) / 1000)} giây</p></>
            : <p role="status">Đang lấy mã mới...</p>}</div>}
          <FormError text={qrError} />
        </div>
        <div className="button-stack"><NativePicker label="Tháng" type="month" hint="Bấm vào ô để chọn tháng." value={month} onChange={(value) => { if (/^\d{4}-\d{2}$/.test(value)) setMonth(value); }} /></div>
        <Chips options={[["work", "Phân công"], ["attendance", "Chấm công"], ["requests", "Yêu cầu"]]} value={tab} onChange={setTab} />
        {tab === "work" && <><MyPurchaseShifts key={month} from={month + "-01"} to={month + "-" + lastDay} /><Section title="Phân công trong tháng">{work.assignments.length ? <Rows>{work.assignments.map((a) =>
          <Row key={a.id} title={a.job} meta={date(a.date) + " · Bè " + (a.raftCode ?? "—")} badge={<Badge {...attendanceStatus(a)} />} />)}</Rows>
          : <Empty title="Chưa có phân công trong tháng này" />}</Section></>}
        {tab === "attendance" && <Section title="Công đã ghi nhận">{work.attendance.length ? <div className="workforce-cards">{work.attendance.map((a) => <div className="card form" key={a.date}>
          <p className="block__title">{date(a.date)}</p>
          <div>{a.complete ? <Badge text="Đủ giờ vào và ra" tone="success" />
            : a.date === todayIso() && a.checkedInAt ? <Badge text="Đang làm" tone="neutral" />
              : <Badge text={a.checkedInAt ? "Thiếu giờ ra" : "Thiếu giờ vào"} tone="warning" />}</div>
          <Facts items={[["Vào", clock(a.checkedInAt)], ["Ra", clock(a.checkedOutAt)], ...a.jobs.map((j): [string, string] => [j.job, num(j.hours, "giờ")])]} />
          {a.periods.map((p, i) => <p className="form__hint" key={i}>{p.job} · bè {p.raft ?? "—"} · {clock(p.startsAt)} đến {clock(p.endsAt)} ({num(p.minutes, "phút")})</p>)}
          {a.complete && !a.jobs.length && <p className="form__hint">Tính một ngày công.</p>}
          {!a.complete && a.date === todayIso() && a.checkedInAt && !a.checkedOutAt && <p className="form__hint">Đang làm. Nhờ Quản lý vùng ghi giờ ra khi kết thúc.</p>}
          {!a.complete && !(a.date === todayIso() && a.checkedInAt && !a.checkedOutAt) && <>
            <p className="form__hint">Ngày này chưa tính công. Nếu bạn quên chấm công, gửi yêu cầu để Chủ HTX ghi bù giờ.</p>
            <Button fullWidth size="large" variant="secondary" disabled={busy} onClick={() => fix(a)}>{a.checkedInAt ? "Gửi yêu cầu bù giờ ra" : "Gửi yêu cầu bù giờ vào"}</Button>
          </>}
        </div>)}</div> : <Empty title="Chưa có chấm công trong tháng này" />}</Section>}
        {tab === "requests" && <>
          <Section title="Gửi yêu cầu"><div className="card form">
            <Chips options={REQUEST_TYPES} value={type} onChange={(value) => { setType(value); setError(""); setSent(""); }} />
            {type === "Leave" ? <>
              <DateField label="Từ ngày (bắt buộc)" value={from} onChange={setFrom} />
              <DateField label="Đến ngày (bắt buộc)" value={to} onChange={setTo} />
            </> : <>
              <DateField label="Ngày quên chấm công (bắt buộc)" value={day} onChange={setDay} />
              <NativePicker label={type === "MissedCheckIn" ? "Giờ vào thực tế (bắt buộc)" : "Giờ ra thực tế (bắt buộc)"} type="time" hint="Bấm vào ô để chọn giờ." value={time} disabled={busy} onChange={setTime} />
            </>}
            <Input.TextArea label="Lý do (bắt buộc)" maxLength={500} value={reason} onChange={(e) => { setReason(e.target.value); setSent(""); }} disabled={busy} />
            <FormError text={cancelling ? "" : error} />
            <Button fullWidth size="large" loading={busy} disabled={busy} onClick={() => void send()}>Gửi yêu cầu</Button>
            {sent && <p className="status-note" role="status">{sent}</p>}
          </div></Section>
          <Section title="Yêu cầu đã gửi">{work.requests.length ? <div className="workforce-cards">{work.requests.map((x) => <div className="card form" key={x.id}>
            <p className="block__title">{REQUEST_TYPE_TEXT[x.type]}: {requestDays(x)}</p>
            <div><Badge {...requestStatus(x)} /></div>
            <Facts items={[["Lý do", x.reason], ["Gửi lúc", dateTime(x.sentAt)], ...(x.response ? [["Phản hồi", x.response] as [string, string]] : [])]} />
            {x.statusId === REQUEST_STATUS.awaiting && <Button fullWidth size="large" variant="secondary" disabled={busy} onClick={() => { setCancelling(x); setError(""); }}>Hủy yêu cầu này</Button>}
          </div>)}</div>
            : <Empty title="Chưa gửi yêu cầu nào trong tháng này" />}</Section>
        </>}
        <div className="button-stack"><Button fullWidth size="large" variant="secondary" disabled={busy} onClick={() => void data.reload()}>Tải lại</Button></div>
        <ConfirmSheet visible={cancelling !== null} title="Hủy yêu cầu" danger busy={busy}
          message={<><p>Hủy yêu cầu {cancelling ? `${REQUEST_TYPE_TEXT[cancelling.type].toLowerCase()} ${requestDays(cancelling)}` : ""}? Yêu cầu đã hủy vẫn nằm trong danh sách, không khôi phục được.</p><FormError text={error} /></>}
          confirmText="Xác nhận hủy yêu cầu" cancelText="Không, giữ yêu cầu"
          onClose={() => { if (!busy) { setCancelling(null); setError(""); } }}
          onConfirm={() => {
            if (!cancelling || busy) return;
            setBusy(true); setError("");
            // LABOR-10.2: Chủ HTX đã duyệt hoặc từ chối trước thì server trả MSG-LABOR-26; tải lại để thấy kết quả.
            void cancelRequest(cancelling.id).then(async () => { setCancelling(null); await data.reload(); })
              .catch(e => { setError(errorText(e)); if (isApiError(e, "MSG-LABOR-26")) void data.reload(); })
              .finally(() => setBusy(false));
          }} />
      </>}</Loadable>
  </ManagePage>;
}
