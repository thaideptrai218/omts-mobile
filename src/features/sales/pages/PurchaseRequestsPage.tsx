import type { PurchaseFilter, PurchaseRequest } from "@/features/sales/models/PurchaseRequest";
import { useAtomValue } from "jotai";
import { useRef, useState } from "react";
import { Button, Checkbox, Input, Sheet } from "zmp-ui";
import FormError from "@/components/FormError/FormError";
import { PurchaseBadge, PurchaseFacts, PurchasePager, PURCHASE_FILTERS } from "@/features/sales/components/PurchaseRequest/PurchaseRequest";
import SalesGate from "@/features/sales/components/SalesGate/SalesGate";
import PurchaseStaffing from "@/features/sales/components/PurchaseStaffing/PurchaseStaffing";
import { Chips } from "@/components/Chips/Chips";
import { Empty } from "@/components/Empty/Empty";
import { Loadable } from "@/components/Loadable/Loadable";
import { ManagePage } from "@/components/ManagePage/ManagePage";
import { Row } from "@/components/Row/Row";
import { Rows } from "@/components/Rows/Rows";
import { useLoad } from "@/hooks/useLoad";
import { errorText } from "@/utils/errorText";
import { date, num, todayIso } from "@/utils/format";
import { getPurchaseRequest, listPurchaseRequests, pickupDateError, respondPurchaseRequest, wholeCages } from "@/features/sales/services/salesService";
import { permissionsAtom } from "@/features/auth/state/authAtoms";

export default function PurchaseRequestsPage() { return <SalesGate mode="inbox"><Inbox /></SalesGate>; }
function Inbox() {
  const owner = useAtomValue(permissionsAtom)?.isCooperativeOwner;
  const [filter, setFilter] = useState<PurchaseFilter>("ALL"); const [page, setPage] = useState(1);
  const list = useLoad(() => listPurchaseRequests(false, filter, page), [filter, page]);
  const [selected, setSelected] = useState<PurchaseRequest | null>(null);
  const [decision, setDecision] = useState<boolean | null>(null); const [cages, setCages] = useState("");
  const [pickup, setPickup] = useState(todayIso); const [note, setNote] = useState(""); const [payLater, setPayLater] = useState(false);
  const [busy, setBusy] = useState(false); const lock = useRef(false);
  const [error, setError] = useState(""); const [notice, setNotice] = useState("");
  const open = async (row: PurchaseRequest) => {
    if (lock.current) return; lock.current = true; setBusy(true); setError(""); setNotice("");
    try { setSelected(await getPurchaseRequest(false, row.id)); }
    catch (e) { setError(errorText(e)); } finally { lock.current = false; setBusy(false); }
  };
  const choose = (accept: boolean) => {
    if (!selected || (accept && !selected.staffing?.hasEnoughStaff)) return;
    setDecision(accept); setCages(String(selected.staffing?.cages ?? selected.requestedCages));
    setPickup(selected.staffing?.pickupDate ?? selected.requestedPickupDate); setNote(""); setPayLater(false); setError("");
  };
  const save = async () => {
    if (!selected || decision === null || lock.current) return;
    const count = wholeCages(cages);
    if (decision && !selected.staffing?.hasEnoughStaff) { setError("Chưa đủ nhân viên đồng ý ca để nhận đơn."); return; }
    if (decision && (count === null || count > selected.requestedCages)) { setError("Số lồng chấp nhận phải là số nguyên từ 1 đến số lồng đặt mua."); return; }
    if (decision && pickupDateError(pickup)) { setError(pickupDateError(pickup)); return; }
    if (!decision && !note.trim()) { setError("Nhập lý do từ chối cho thương lái."); return; }
    lock.current = true; setBusy(true); setError("");
    try {
      setSelected(await respondPurchaseRequest(selected, { accept: decision, acceptedCages: decision ? count : null, pickupDate: decision ? pickup : null, allowPayLater: decision && payLater, note: note.trim() }));
      setDecision(null); setNotice("Đã gửi phản hồi cho thương lái."); await list.reload();
    } catch (e) { setError(errorText(e)); } finally { lock.current = false; setBusy(false); }
  };
  return <ManagePage title="Yêu cầu mua của thương lái">
    {notice && <p className="card form" role="status">{notice}</p>}<FormError text={error} />
    {selected ? <>
      <PurchaseFacts row={selected} />
      {owner && <PurchaseStaffing key={selected.id} row={selected} onUpdated={row => { setSelected(row); void list.reload(); }} />}
      {owner && (selected.status === "AWAITING_RESPONSE" || selected.status === "AWAITING_STAFF") && <div className="action-row"><Button size="large" disabled={busy || !selected.staffing?.hasEnoughStaff} onClick={() => choose(true)}>Chấp nhận đơn</Button><Button size="large" variant="secondary" disabled={busy} onClick={() => choose(false)}>Từ chối đơn</Button></div>}
      <Button fullWidth size="large" variant="secondary" disabled={busy} onClick={() => void open(selected)}>Cập nhật yêu cầu</Button>
      <Button fullWidth size="large" variant="secondary" disabled={busy} onClick={() => { setSelected(null); setError(""); setNotice(""); void list.reload(); }}>Về danh sách</Button>
    </> : <>
      <Chips options={PURCHASE_FILTERS} value={filter} onChange={v => { setFilter(v); setPage(1); }} />
      <Loadable data={list.data} error={list.error} reload={() => void list.reload()}>{data => <>
        {data.items.length ? <Rows>{data.items.map(row => <Row key={row.id} title={`${row.customerName} · ${row.productName}`} meta={`${row.code} · ${num(row.requestedCages, "lồng")} · ${date(row.requestedPickupDate)}`} badge={<PurchaseBadge status={row.status} />} onClick={() => void open(row)} />)}</Rows> : <Empty title="Chưa có yêu cầu mua ở trạng thái này" />}
        <PurchasePager page={page} total={data.total} onChange={setPage} />
      </>}</Loadable>
      {list.data && list.error && <FormError text={list.error} />}
      <Button fullWidth size="large" variant="secondary" disabled={busy} onClick={() => void list.reload()}>Tải lại</Button>
    </>}
    <Sheet visible={decision !== null} onClose={() => { if (!busy) setDecision(null); }} autoHeight mask handler title={decision ? "Chấp nhận yêu cầu mua" : "Từ chối yêu cầu mua"}>
      <div className="sheet-form form workforce-sheet"><p>{selected?.customerName} · {selected?.productName}</p>
        {decision && <><p>Nhận {num(Number(cages), "lồng")} · giao ngày {date(pickup)} theo ca đã xác nhận.</p>
          <Checkbox value="pay-later" checked={payLater} disabled={busy} onChange={e => setPayLater(e.target.checked)}>Cho phép trả sau</Checkbox></>}
        <Input.TextArea label={decision ? "Phản hồi (không bắt buộc)" : "Lý do từ chối"} value={note} maxLength={500} showCount disabled={busy} onChange={e => setNote(e.target.value)} />
        <FormError text={error} /><Button fullWidth size="large" disabled={busy} loading={busy} onClick={() => void save()}>Gửi phản hồi</Button>
      </div>
    </Sheet>
  </ManagePage>;
}
