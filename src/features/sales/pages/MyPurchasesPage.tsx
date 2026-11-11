import type { TraderPurchaseRequest } from "@/features/sales/models/PurchaseRequest";
import { FormEvent, useEffect, useRef, useState } from "react";
import { Button, Input, Select, useLocation } from "zmp-ui";
import FormError from "@/components/FormError/FormError";
import DateField from "@/components/DateField/DateField";
import { PurchaseBadge, PurchaseFacts, PurchasePager } from "@/features/sales/components/PurchaseRequest/PurchaseRequest";
import SalesGate from "@/features/sales/components/SalesGate/SalesGate";
import { Empty } from "@/components/Empty/Empty";
import { Facts } from "@/components/Facts/Facts";
import { Loadable } from "@/components/Loadable/Loadable";
import { ManagePage } from "@/components/ManagePage/ManagePage";
import { ReasonSheet } from "@/components/ReasonSheet/ReasonSheet";
import { Row } from "@/components/Row/Row";
import { Rows } from "@/components/Rows/Rows";
import { useLoad } from "@/hooks/useLoad";
import { errorText } from "@/utils/errorText";
import { date, num } from "@/utils/format";
import { cancelPurchaseRequest, getMyPurchaseRequest, listMyPurchases, listSalesProducts, newPurchaseDraft, submitPurchaseRequest, validatePurchaseDraft } from "@/features/sales/services/salesService";
import "@/features/sales/styles/sales.scss";

export default function TraderPurchasesPage() { return <SalesGate mode="trader"><PurchaseWorkspace /></SalesGate>; }
function PurchaseWorkspace() {
  const openId = new URLSearchParams(useLocation().search).get("open");
  const [page, setPage] = useState(1);
  const list = useLoad(() => listMyPurchases(page), [page]);
  const products = useLoad(() => listSalesProducts(), []);
  const [view, setView] = useState<"list" | "form" | "review" | "detail">("list");
  const [draft, setDraft] = useState(newPurchaseDraft); const [selected, setSelected] = useState<TraderPurchaseRequest | null>(null);
  const [cancel, setCancel] = useState(false); const [busy, setBusy] = useState(false); const lock = useRef(false);
  const [error, setError] = useState(""); const [notice, setNotice] = useState("");
  const change = (patch: Partial<typeof draft>) => { setDraft(d => ({ ...d, ...patch })); setError(""); };
  const review = (event?: FormEvent) => {
    event?.preventDefault(); const problem = validatePurchaseDraft(draft, products.data ?? []); setError(problem); if (!problem) setView("review");
  };
  const open = async (id: string) => {
    if (lock.current) return; lock.current = true; setBusy(true); setError(""); setNotice("");
    try { setSelected(await getMyPurchaseRequest(id)); setView("detail"); }
    catch (e) { setError(errorText(e)); } finally { lock.current = false; setBusy(false); }
  };
  // Mở thẳng yêu cầu khi đi từ thông báo HTX phản hồi (`?open=<id>`).
  useEffect(() => { if (openId) void open(openId); }, [openId]);
  const send = async () => {
    if (lock.current) return;
    const problem = validatePurchaseDraft(draft, products.data ?? []); if (problem) { setError(problem); return; }
    lock.current = true; setBusy(true); setError("");
    try {
      const row = await submitPurchaseRequest(draft); setSelected(row.request); setDraft(newPurchaseDraft()); setView("detail");
      setNotice("Đã gửi yêu cầu mua đến Chủ HTX."); await list.reload();
    } catch (e) { setError(errorText(e)); } finally { lock.current = false; setBusy(false); }
  };
  const doCancel = async (reason: string) => {
    if (!selected || lock.current) return false; lock.current = true; setBusy(true); setError("");
    try { setSelected(await cancelPurchaseRequest(selected, reason)); setNotice("Đã hủy yêu cầu mua."); await list.reload(); return true; }
    catch (e) { setError(errorText(e)); return false; } finally { lock.current = false; setBusy(false); }
  };
  const back = () => { setView("list"); setError(""); setNotice(""); void list.reload(); };
  /** "Quay lại" lùi về bước trước trên cùng màn: Kiểm tra về Nhập, Nhập và Chi tiết về Danh sách. */
  const goBack = () => { if (lock.current) return; if (view === "review") { setView("form"); setError(""); return; } back(); };
  const footer = view === "list"
    ? <Button fullWidth size="large" disabled={busy} onClick={() => { setView("form"); setError(""); setNotice(""); void products.reload(); }}>Tạo yêu cầu mua</Button>
    : view === "form" && products.data?.length ? <Button fullWidth size="large" onClick={() => review()}>Kiểm tra yêu cầu</Button>
    : view === "review" ? <div className="sheet-actions">
        <Button fullWidth size="large" loading={busy} disabled={busy} onClick={() => void send()}>Gửi yêu cầu mua</Button>
        <Button fullWidth size="large" variant="secondary" disabled={busy} onClick={() => { setView("form"); setError(""); }}>Sửa thông tin</Button>
      </div>
    : undefined;
  return <ManagePage title={view === "form" ? "Tạo yêu cầu mua" : view === "review" ? "Kiểm tra yêu cầu mua" : "Mua hàng của tôi"} footer={footer} onBack={view === "list" ? undefined : goBack}>
    {notice && <p className="card form sales-notice" role="status">{notice}</p>}{view !== "form" && !cancel && <FormError text={error} />}
    {view === "list" && <>
      <Loadable data={list.data} error={list.error} reload={() => void list.reload()}>{data => <>
        {data.requests.length ? <Rows>{data.requests.map(row => <Row key={row.id} title={`${row.productName} · ${num(row.requestedCages, "lồng")}`} meta={`Nhận ${date(row.pickupDate)} · mã …${row.code.slice(-6)}`} badge={<PurchaseBadge statusId={row.statusId} fulfilled={row.fulfilled} />} onClick={() => void open(row.id)} />)}</Rows> : <Empty icon="zi-note" title="Chưa có yêu cầu mua" text="Chọn sản phẩm, nhập số lồng và gửi yêu cầu đến HTX." />}
        <PurchasePager page={page} total={data.total} onChange={setPage} />
      </>}</Loadable>
      {list.data && list.error && <FormError text={list.error} />}
      <div className="button-stack"><Button fullWidth size="large" variant="secondary" disabled={busy} onClick={() => void list.reload()}>Tải lại</Button></div>
    </>}
    {view === "form" && <Loadable data={products.data} error={products.error} reload={() => void products.reload()}>{options => options.length ? <form className="card form" onSubmit={review} noValidate>
      <p className="form__intro">Đặt mua theo số lồng. Chủ HTX sẽ kiểm tra nhân viên đồng ý ca trước khi nhận đơn.</p>
      <Select label="Sản phẩm (bắt buộc)" placeholder="Chọn sản phẩm" value={draft.productId} onChange={v => change({ productId: String(v) })} closeOnSelect>{options.map(p => <Select.Option key={p.id} value={p.id} title={p.name} />)}</Select>
      <Input label="Số lồng đặt mua (bắt buộc)" placeholder="Ví dụ: 20" inputMode="numeric" value={draft.cages} onChange={e => change({ cages: e.target.value })} />
      <DateField label="Ngày nhận hàng dự kiến (bắt buộc)" value={draft.pickupDate} onChange={pickupDate => change({ pickupDate })} />
      <Input.TextArea label="Ghi chú (không bắt buộc)" value={draft.note} maxLength={500} showCount onChange={e => change({ note: e.target.value })} />
      <FormError text={error} />
    </form> : <Empty title="HTX chưa có sản phẩm đang bán" text="Chủ HTX cần thêm sản phẩm ở mục Sản phẩm bán." action={<Button fullWidth size="large" variant="secondary" onClick={back}>Về danh sách</Button>} />}</Loadable>}
    {view === "review" && <>
      <Facts items={[["Sản phẩm", products.data?.find(p => p.id === draft.productId)?.name], ["Số lồng đặt mua", num(Number(draft.cages), "lồng")], ["Ngày nhận dự kiến", date(draft.pickupDate)], ["Ghi chú", draft.note || "Không có"]]} />
      <div className="button-stack"><p className="form__hint">Bấm gửi để lưu yêu cầu và chuyển đến Chủ HTX chờ phản hồi.</p></div>
    </>}
    {view === "detail" && selected && <><PurchaseFacts row={selected} /><div className="button-stack">
      {selected.canCancel ? <Button fullWidth size="large" variant="secondary" disabled={busy} onClick={() => setCancel(true)}>Hủy yêu cầu mua</Button> : null}
      <Button fullWidth size="large" variant="secondary" disabled={busy} onClick={() => void open(selected.id)}>Cập nhật phản hồi</Button></div>
    </>}
    <ReasonSheet visible={cancel} title="Hủy yêu cầu mua" intro="HTX sẽ nhận thông báo hủy yêu cầu này." confirmText="Xác nhận hủy" danger busy={busy} onClose={() => { if (!busy) setCancel(false); }} onConfirm={doCancel}><FormError text={error} /></ReasonSheet>
  </ManagePage>;
}
