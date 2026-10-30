import { newOperationId } from "@/shared/lib/operation-id";
import { useEffect, useState } from "react";
import { Button, Input, Sheet } from "zmp-ui";
import FormError from "@/shared/ui/form-error";
import DateField from "@/shared/ui/date-field";
import { Badge, Chips, Empty, Facts, Loadable, ManagePage, Row, Rows, Section } from "@/shared/ui/ui";
import WorkforceGate from "@/features/workforce/components/workforce-gate";
import { useLoad } from "@/shared/hooks/use-load";
import { errorText } from "@/shared/lib/messages";

import { date, dateTime, num, todayIso } from "@/shared/lib/format";
import { attendanceQr, cancelLeave, myWork, requestLeave, type LeaveRow } from "@/features/workforce/api/workforce";

export default function MyWorkPage() { return <WorkforceGate mode="personal"><MyWorkContent /></WorkforceGate>; }

function MyWorkContent() {
  const [month, setMonth] = useState(() => todayIso().slice(0, 7));
  const [tab, setTab] = useState<"work" | "attendance" | "requests">("work");
  const [from, setFrom] = useState(todayIso);
  const [to, setTo] = useState(todayIso);
  const [reason, setReason] = useState("");
  const [operationId, setOperationId] = useState(newOperationId);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [cancelling, setCancelling] = useState<LeaveRow | null>(null);
  const [qr, setQr] = useState<{ image: string; expiresAt: string } | null>(null);
  const [now, setNow] = useState(Date.now);
  const lastDay = new Date(Number(month.slice(0, 4)), Number(month.slice(5, 7)), 0).getDate();
  const data = useLoad(() => myWork(month + "-01", month + "-" + lastDay), [month, lastDay]);
  useEffect(() => { const timer = window.setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(timer); }, []);
  const send = async () => {
    if (!reason.trim() || !from || to < from) { setError("Chọn đúng khoảng ngày nghỉ và nhập lý do."); return; }
    setBusy(true); setError("");
    try {
      await requestLeave({ from, to, reason: reason.trim(), clientOperationId: operationId });
      setOperationId(newOperationId()); setReason(""); await data.reload();
    } catch (e) { setError(errorText(e)); } finally { setBusy(false); }
  };
  const showQr = async () => {
    setBusy(true); setError(""); setQr(null);
    try {
      const code = await attendanceQr();
      const QRCode = await import("qrcode");
      setQr({ image: await QRCode.toDataURL(code.code, { width: 320, margin: 4 }), expiresAt: code.expiresAt });
    } catch (e) { setError(errorText(e)); } finally { setBusy(false); }
  };
  return <ManagePage title="Công việc của tôi">
    <Loadable data={data.data} error={data.error} reload={() => void data.reload()}>{(work) => !work.employeeId
      ? <Empty title="Chưa liên kết hồ sơ nhân viên" text="Nhờ Chủ HTX gắn tài khoản này với hồ sơ nhân viên của bạn." />
      : <>
        <div className="card form">
          <p className="block__title">{work.name}</p>
          <p className="form__hint">Đưa mã QR cho Quản lý vùng quét khi bắt đầu và kết thúc làm việc tại bè.</p>
          <Button size="large" fullWidth disabled={busy} onClick={() => void showQr()}>Hiện mã chấm công</Button>
          {qr && <div className="attendance-qr">{Date.parse(qr.expiresAt) > now
            ? <><img src={qr.image} alt="Mã QR chấm công cá nhân" /><p>Còn {Math.ceil((Date.parse(qr.expiresAt) - now) / 1000)} giây</p></>
            : <p role="status">Mã đã hết hạn. Bấm “Hiện mã chấm công” để lấy mã mới.</p>}</div>}
        </div>
        <Input label="Tháng" type={"month" as never} value={month} onChange={(e) => { if (/^\d{4}-\d{2}$/.test(e.target.value)) setMonth(e.target.value); }} />
        <Chips options={[["work", "Phân công"], ["attendance", "Chấm công"], ["requests", "Nghỉ phép"]]} value={tab} onChange={setTab} />
        {tab === "work" && <Section title="Phân công trong tháng">{work.assignments.length ? <Rows>{work.assignments.map((a) =>
          <Row key={a.id} title={a.job} meta={date(a.date) + " · Bè " + (a.raftCode ?? "—")} badge={<Badge text={a.checkedOutAt ? "Đã ra ca" : a.checkedInAt ? "Đang làm" : "Chưa vào ca"} tone={a.checkedInAt ? "success" : "neutral"} />} />)}</Rows>
          : <Empty title="Chưa có phân công trong tháng này" />}</Section>}
        {tab === "attendance" && <Section title="Công đã ghi nhận">{work.attendance.length ? work.attendance.map((a) => <div className="card form" key={a.date}>
          <p className="block__title">{date(a.date)}</p>
          <Badge text={a.complete ? "Đủ giờ vào / ra" : "Thiếu giờ vào hoặc ra"} tone={a.complete ? "success" : "warning"} />
          <Facts items={[["Vào", dateTime(a.checkedInAt)], ["Ra", dateTime(a.checkedOutAt)], ...a.jobs.map((j): [string, string] => [j.job, num(j.hours, "giờ")])]} />
          {a.periods.map((p, i) => <p className="form__hint" key={i}>{p.job} · bè {p.raft} · {dateTime(p.startsAt)} → {dateTime(p.endsAt)}</p>)}
          {!a.complete && <p className="form__hint">Liên hệ Chủ HTX để kiểm tra giờ bị thiếu. Ngày này chưa tính giờ công.</p>}
        </div>) : <Empty title="Chưa có chấm công trong tháng này" />}</Section>}
        {tab === "requests" && <>
          <Section title="Gửi yêu cầu nghỉ phép"><div className="card form">
            <DateField label="Từ ngày" value={from} onChange={setFrom} />
            <DateField label="Đến ngày" value={to} onChange={setTo} />
            <Input.TextArea label="Lý do" maxLength={500} value={reason} onChange={(e) => setReason(e.target.value)} disabled={busy} />
            <Button fullWidth size="large" loading={busy} disabled={busy} onClick={() => void send()}>Gửi Chủ HTX</Button>
          </div></Section>
          <Section title="Yêu cầu đã gửi">{work.requests.length ? <Rows>{work.requests.map((x) => <Row key={x.id}
            title={date(x.from) + " – " + date(x.to)} meta={<>{x.reason}{x.response && <><br />Phản hồi: {x.response}</>}</>}
            onClick={x.approved === null && !x.cancelledAt ? () => { setCancelling(x); setError(""); } : undefined}
            badge={<Badge text={x.cancelledAt ? "Đã hủy" : x.approved === null ? "Chờ duyệt · bấm để hủy" : x.approved ? "Đã duyệt" : "Từ chối"} tone={x.approved === null ? "warning" : x.approved ? "success" : "danger"} />} />)}</Rows>
            : <Empty title="Chưa gửi yêu cầu nào" />}</Section>
        </>}
        <FormError text={error} />
        <Button fullWidth size="large" variant="secondary" disabled={busy} onClick={() => void data.reload()}>Tải lại</Button>
        <Sheet visible={cancelling !== null} onClose={() => { if (!busy) setCancelling(null); }} autoHeight mask handler title="Hủy yêu cầu nghỉ phép">
          <div className="sheet-form form workforce-sheet"><p>Hủy yêu cầu từ {date(cancelling?.from)} đến {date(cancelling?.to)}?</p><FormError text={error} />
            <Button fullWidth size="large" disabled={busy} loading={busy} onClick={() => {
              if (!cancelling || busy) return;
              setBusy(true); setError("");
              void cancelLeave(cancelling.id).then(async () => { setCancelling(null); await data.reload(); })
                .catch(e => setError(errorText(e))).finally(() => setBusy(false));
            }}>Xác nhận hủy yêu cầu</Button>
          </div>
        </Sheet>
      </>}</Loadable>
  </ManagePage>;
}
