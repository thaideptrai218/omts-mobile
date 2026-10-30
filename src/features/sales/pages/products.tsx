import { FormEvent, useRef, useState } from "react";
import { Button, Checkbox, Input } from "zmp-ui";
import FormError from "@/shared/ui/form-error";
import SalesGate from "@/features/sales/components/sales-gate";
import { Badge, Empty, Loadable, ManagePage, Row, Rows } from "@/shared/ui/ui";
import { useLoad } from "@/shared/hooks/use-load";
import { errorText } from "@/shared/lib/messages";
import { listSalesProducts, saveSalesProduct, type SalesProduct } from "@/features/sales/api/sales";

export default function SalesProductsPage() { return <SalesGate mode="owner"><Products /></SalesGate>; }
function Products() {
  const list = useLoad(() => listSalesProducts(true), []);
  const [editing, setEditing] = useState<SalesProduct | "new" | null>(null);
  const [code, setCode] = useState(""); const [name, setName] = useState(""); const [description, setDescription] = useState(""); const [inUse, setInUse] = useState(true);
  const [error, setError] = useState(""); const [notice, setNotice] = useState(""); const [busy, setBusy] = useState(false); const lock = useRef(false);
  const open = (product: SalesProduct | "new") => {
    setEditing(product); setCode(product === "new" ? "" : product.code); setName(product === "new" ? "" : product.name);
    setDescription(product === "new" ? "" : product.description ?? ""); setInUse(product === "new" || product.inUse); setError(""); setNotice("");
  };
  const save = async (event: FormEvent) => {
    event.preventDefault(); if (!editing || lock.current) return;
    if (!code.trim() || !name.trim()) { setError("Nhập mã và tên sản phẩm."); return; }
    lock.current = true; setBusy(true); setError("");
    try {
      await saveSalesProduct(editing === "new" ? null : editing.id, { code: code.trim(), name: name.trim(), description: description.trim(), inUse, rowVersion: editing === "new" ? undefined : editing.rowVersion });
      setEditing(null); setNotice("Đã lưu sản phẩm."); await list.reload();
    } catch (e) { setError(errorText(e)); } finally { lock.current = false; setBusy(false); }
  };
  return <ManagePage title="Sản phẩm bán">
    {notice && <p className="card form" role="status">{notice}</p>}
    {editing ? <form className="card form" onSubmit={save} noValidate>
      <Input label="Mã sản phẩm" value={code} maxLength={50} disabled={busy} onChange={e => setCode(e.target.value)} />
      <Input label="Tên sản phẩm" value={name} maxLength={200} disabled={busy} onChange={e => setName(e.target.value)} />
      <Input.TextArea label="Mô tả" value={description} maxLength={2000} disabled={busy} onChange={e => setDescription(e.target.value)} />
      <Checkbox value="in-use" checked={inUse} disabled={busy} onChange={e => setInUse(e.target.checked)}>Đang bán</Checkbox>
      <FormError text={error} /><Button htmlType="submit" fullWidth size="large" loading={busy} disabled={busy}>Lưu sản phẩm</Button>
      <Button fullWidth size="large" variant="secondary" disabled={busy} onClick={() => setEditing(null)}>Về danh sách</Button>
    </form> : <>
      <p className="form__hint">Thương lái chọn sản phẩm trong danh mục này và đặt mua theo số lồng.</p>
      <Button fullWidth size="large" onClick={() => open("new")}>Thêm sản phẩm</Button>
      <Loadable data={list.data} error={list.error} reload={() => void list.reload()}>{rows => rows.length ? <Rows>{rows.map(p => <Row key={p.id} title={p.name} meta={`${p.code}${p.description ? " · " + p.description : ""}`} badge={<Badge text={p.availableForPurchase ? "Đang bán" : p.inUse ? "Ngoài thời gian bán" : "Ngừng bán"} tone={p.availableForPurchase ? "success" : "neutral"} />} onClick={() => open(p)} />)}</Rows> : <Empty title="Chưa có sản phẩm" />}</Loadable>
      {list.data && list.error && <FormError text={list.error} />}
      <Button fullWidth size="large" variant="secondary" onClick={() => void list.reload()}>Tải lại</Button>
    </>}
  </ManagePage>;
}
