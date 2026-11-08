import type { MyPurchaseShift } from "@/features/sales/models/PurchaseStaffing";
import { useRef, useState } from "react";
import { Button, Input, Sheet } from "zmp-ui";
import { Badge } from "@/components/Badge/Badge";
import { Empty } from "@/components/Empty/Empty";
import FormError from "@/components/FormError/FormError";
import { Loadable } from "@/components/Loadable/Loadable";
import { Section } from "@/components/Section/Section";
import { useLoad } from "@/hooks/useLoad";
import { myPurchaseShifts, respondPurchaseShift } from "@/features/sales/services/purchaseStaffingService";
import { date } from "@/utils/format";
import { errorText } from "@/utils/errorText";

export default function MyPurchaseShifts({ from, to }: { from: string; to: string }) {
  const data = useLoad(() => myPurchaseShifts(from, to), [from, to]);
  const [choice, setChoice] = useState<{ row: MyPurchaseShift; approved: boolean } | null>(null);
  const [reason, setReason] = useState(""); const [error, setError] = useState(""); const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false); const lock = useRef(false);
  const choose = (row: MyPurchaseShift, approved: boolean) => { setChoice({ row, approved }); setReason(""); setError(""); setNotice(""); };
  const save = async () => {
    if (!choice || lock.current) return;
    if (!choice.approved && !reason.trim()) { setError("Nhập lý do không tham gia ca này."); return; }
    lock.current = true; setBusy(true); setError("");
    try {
      await respondPurchaseShift(choice.row, { approved: choice.approved, reason: reason.trim() });
      setChoice(null); setNotice("Đã gửi phản hồi ca cho Chủ HTX."); await data.reload();
    } catch (e) { setError(errorText(e)); } finally { lock.current = false; setBusy(false); }
  };
  return <Section title="Lời mời ca cho đơn hàng">
    {notice && <p className="card form" role="status">{notice}</p>}
    <Loadable data={data.data} error={data.error} reload={() => void data.reload()}>{items => items.length ? items.map(row => {
      const closed = row.requestStatus === "CANCELLED" || row.requestStatus === "DECLINED";
      const label = closed ? "Đơn đã đóng" : row.approved === false ? "Bạn đã từ chối" : row.approved
        ? row.requestStatus === "ACCEPTED" ? "Đã xác nhận ca" : "Đã đồng ý · chờ Chủ HTX nhận đơn"
        : row.canRespond ? "Chờ bạn phản hồi" : "Đã đủ người hoặc đã hết hạn phản hồi";
      return <div className="card form" key={row.id}>
        <p className="block__title">{row.requestCode} · {row.productName}</p>
        <Badge text={label} tone={closed ? "neutral" : row.approved === false ? "danger" : row.approved ? "success" : "warning"} />
        <p>Ngày làm: {date(row.workDate)} · {row.cages} lồng</p>
        <p>Cần {row.requiredEmployees} người · Đã đồng ý {row.approvedEmployees} người</p>
        {row.note && <p>Nội dung ca: {row.note}</p>}{row.reason && <p>Phản hồi của bạn: {row.reason}</p>}
        {row.canRespond && <div className="action-row"><Button size="large" disabled={busy} onClick={() => choose(row, true)}>Đồng ý ca</Button>
          <Button size="large" variant="secondary" disabled={busy} onClick={() => choose(row, false)}>Từ chối ca</Button></div>}
      </div>;
    }) : <Empty title="Chưa có lời mời ca trong tháng này" />}</Loadable>
    <FormError text={error || data.error} />
    <Button fullWidth size="large" variant="secondary" disabled={busy} onClick={() => void data.reload()}>Cập nhật lời mời ca</Button>
    <Sheet visible={choice !== null} onClose={() => { if (!busy) setChoice(null); }} autoHeight mask handler title={choice?.approved ? "Đồng ý tham gia ca" : "Từ chối tham gia ca"}>
      <div className="sheet-form form workforce-sheet"><p>{choice?.row.requestCode} · {date(choice?.row.workDate)}</p>
        <p>{choice?.approved ? "Bạn xác nhận tham gia ca trong ngày này. Chủ HTX sẽ quyết định nhận đơn sau khi đủ người đồng ý." : "Chủ HTX sẽ đọc lý do để sắp xếp nhân lực hoặc từ chối đơn."}</p>
        <Input.TextArea label={choice?.approved ? "Lời nhắn (không bắt buộc)" : "Lý do từ chối ca"} value={reason} maxLength={500} showCount disabled={busy} onChange={e => setReason(e.target.value)} />
        <FormError text={error} /><Button fullWidth size="large" loading={busy} disabled={busy} onClick={() => void save()}>Gửi phản hồi ca</Button>
      </div>
    </Sheet>
  </Section>;
}
