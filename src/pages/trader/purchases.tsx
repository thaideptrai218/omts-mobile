import { FormEvent, useRef, useState } from "react";
import { Button, Input, Select } from "zmp-ui";
import FormError from "@/components/form-error";
import DateField from "@/components/manage/date-field";
import { PurchaseBadge, PurchaseFacts, PurchasePager, PURCHASE_FILTERS } from "@/components/manage/purchase-request";
import SalesGate from "@/components/manage/sales-gate";
import { Chips, Empty, Facts, Loadable, ManagePage, ReasonSheet, Row, Rows } from "@/components/manage/ui";
import { useLoad } from "@/hooks/use-load";
import { errorText } from "@/services/acs/messages";
import { date, num } from "@/services/format";
import { cancelPurchaseRequest, getPurchaseRequest, listPurchaseRequests, listSalesProducts, newPurchaseDraft, submitPurchaseRequest, validatePurchaseDraft, type PurchaseFilter, type PurchaseRequest } from "@/services/sales";

export default function TraderPurchasesPage() { return <SalesGate mode="trader"><PurchaseWorkspace /></SalesGate>; }
function PurchaseWorkspace() {
  const [filter, setFilter] = useState<PurchaseFilter>("ALL"); const [page, setPage] = useState(1);
  const list = useLoad(() => listPurchaseRequests(true, filter, page), [filter, page]);
  const products = useLoad(() => listSalesProducts(), []);
  const [view, setView] = useState<"list" | "form" | "review" | "detail">("list");
  const [draft, setDraft] = useState(newPurchaseDraft); const [selected, setSelected] = useState<PurchaseRequest | null>(null);
  const [cancel, setCancel] = useState(false); const [busy, setBusy] = useState(false); const lock = useRef(false);
  const [error, setError] = useState(""); const [notice, setNotice] = useState("");
  const change = (patch: Partial<typeof draft>) => { setDraft(d => ({ ...d, ...patch })); setError(""); };
  const review = (event: FormEvent) => {
    event.preventDefault(); const problem = validatePurchaseDraft(draft, products.data ?? []); setError(problem); if (!problem) setView("review");
  };
  const open = async (row: PurchaseRequest) => {
    if (lock.current) return; lock.current = true; setBusy(true); setError(""); setNotice("");
    try { setSelected(await getPurchaseRequest(true, row.id)); setView("detail"); }
    catch (e) { setError(errorText(e)); } finally { lock.current = false; setBusy(false); }
  };
  const send = async () => {
    if (lock.current) return;
    const problem = validatePurchaseDraft(draft, products.data ?? []); if (problem) { setError(problem); return; }
    lock.current = true; setBusy(true); setError("");
    try {
      const row = await submitPurchaseRequest(draft); setSelected(row); setDraft(newPurchaseDraft()); setView("detail");
      setNotice("Đã gửi yêu cầu mua đến Chủ HTX."); await list.reload();
    } catch (e) { setError(errorText(e)); } finally { lock.current = false; setBusy(false); }
  };
  const doCancel = async (reason: string) => {
    if (!selected || lock.current) return false; lock.current = true; setBusy(true); setError("");
    try { setSelected(await cancelPurchaseRequest(selected, reason)); setNotice("Đã hủy yêu cầu mua."); await list.reload(); return true; }
    catch (e) { setError(errorText(e)); return false; } finally { lock.current = false; setBusy(false); }
  };
  const back = () => { setView("list"); setError(""); setNotice(""); void list.reload(); };
  return <ManagePage title={view === "form" ? "Tạo yêu cầu mua" : view === "review" ? "Kiểm tra yêu cầu mua" : "Mua hàng của tôi"}>
    {notice && <p className="card form" role="status">{notice}</p>}<FormError text={error} />
    {view === "list" && <>
      <Button fullWidth size="large" disabled={busy} onClick={() => { setView("form"); setError(""); setNotice(""); void products.reload(); }}>Tạo yêu cầu mua</Button>
      <Chips options={PURCHASE_FILTERS} value={filter} onChange={value => { setFilter(value); setPage(1); }} />
      <Loadable data={list.data} error={list.error} reload={() => void list.reload()}>{data => <>
        {data.items.length ? <Rows>{data.items.map(row => <Row key={row.id} title={`${row.code} · ${row.productName}`} meta={`${num(row.requestedCages, "lồng")} · nhận ${date(row.requestedPickupDate)}`} badge={<PurchaseBadge status={row.status} />} onClick={() => void open(row)} />)}</Rows> : <Empty icon="zi-note" title="Chưa có yêu cầu mua" text="Chọn sản phẩm, nhập số lồng và gửi yêu cầu đến HTX." />}
        <PurchasePager page={page} total={data.total} onChange={setPage} />
      </>}</Loadable>
      {list.data && list.error && <FormError text={list.error} />}
      <Button fullWidth size="large" variant="secondary" disabled={busy} onClick={() => void list.reload()}>Tải lại</Button>
    </>}
    {view === "form" && <Loadable data={products.data} error={products.error} reload={() => void products.reload()}>{options => options.length ? <form className="card form" onSubmit={review} noValidate>
      <p className="form__intro">Đặt mua theo số lồng. Chủ HTX sẽ xác nhận số lồng và ngày nhận.</p>
      <Select label="Sản phẩm" placeholder="Chọn sản phẩm" value={draft.productId} onChange={v => change({ productId: String(v) })} closeOnSelect>{options.map(p => <Select.Option key={p.id} value={p.id} title={p.name} />)}</Select>
      <Input label="Số lồng đặt mua" placeholder="Ví dụ: 20" inputMode="numeric" value={draft.cages} onChange={e => change({ cages: e.target.value })} />
      <DateField label="Ngày nhận hàng dự kiến" value={draft.pickupDate} onChange={pickupDate => change({ pickupDate })} />
      <Input.TextArea label="Ghi chú (không bắt buộc)" value={draft.note} maxLength={500} showCount onChange={e => change({ note: e.target.value })} />
      <FormError text={error} /><Button htmlType="submit" fullWidth size="large">Kiểm tra yêu cầu</Button>
      <Button fullWidth size="large" variant="secondary" onClick={back}>Về danh sách</Button>
    </form> : <><Empty title="HTX chưa có sản phẩm đang bán" text="Chủ HTX cần thêm sản phẩm ở mục Sản phẩm bán." /><Button fullWidth size="large" variant="secondary" onClick={back}>Về danh sách</Button></>}</Loadable>}
    {view === "review" && <>
      <Facts items={[["Sản phẩm", products.data?.find(p => p.id === draft.productId)?.name], ["Số lồng đặt mua", num(Number(draft.cages), "lồng")], ["Ngày nhận dự kiến", date(draft.pickupDate)], ["Ghi chú", draft.note || "Không có"]]} />
      <div className="card form"><p className="form__hint">Bấm gửi để lưu yêu cầu và chuyển đến Chủ HTX chờ phản hồi.</p>
        <Button fullWidth size="large" loading={busy} disabled={busy} onClick={() => void send()}>Gửi yêu cầu mua</Button>
        <Button fullWidth size="large" variant="secondary" disabled={busy} onClick={() => { setView("form"); setError(""); }}>Sửa thông tin</Button>
      </div>
    </>}
    {view === "detail" && selected && <><PurchaseFacts row={selected} />
      {selected.status === "AWAITING_RESPONSE" || selected.status === "ACCEPTED" ? <Button fullWidth size="large" variant="secondary" disabled={busy} onClick={() => setCancel(true)}>Hủy yêu cầu mua</Button> : null}
      <Button fullWidth size="large" variant="secondary" disabled={busy} onClick={() => void open(selected)}>Cập nhật phản hồi</Button>
      <Button fullWidth size="large" variant="secondary" disabled={busy} onClick={back}>Về danh sách</Button>
    </>}
    <ReasonSheet visible={cancel} title="Hủy yêu cầu mua" intro="HTX sẽ nhận thông báo hủy yêu cầu này." confirmText="Xác nhận hủy" busy={busy} onClose={() => { if (!busy) setCancel(false); }} onConfirm={doCancel}><FormError text={error} /></ReasonSheet>
  </ManagePage>;
}
