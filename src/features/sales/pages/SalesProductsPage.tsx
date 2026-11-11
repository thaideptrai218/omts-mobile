import type { SalesProduct } from "@/features/sales/models/SalesProduct";
import { FormEvent, useRef, useState } from "react";
import { Button, Checkbox, Input } from "zmp-ui";
import FormError from "@/components/FormError/FormError";
import SalesGate from "@/features/sales/components/SalesGate/SalesGate";
import { Badge } from "@/components/Badge/Badge";
import { ConfirmSheet } from "@/components/ConfirmSheet/ConfirmSheet";
import { Empty } from "@/components/Empty/Empty";
import { Loadable } from "@/components/Loadable/Loadable";
import { ManagePage } from "@/components/ManagePage/ManagePage";
import { Row } from "@/components/Row/Row";
import { Rows } from "@/components/Rows/Rows";
import { useLoad } from "@/hooks/useLoad";
import { errorText } from "@/utils/errorText";
import { listSalesProducts, saveSalesProduct } from "@/features/sales/services/salesService";
import "@/features/sales/styles/sales.scss";

export default function SalesProductsPage() { return <SalesGate mode="owner"><Products /></SalesGate>; }
function Products() {
  const list = useLoad(() => listSalesProducts(true), []);
  const [editing, setEditing] = useState<SalesProduct | "new" | null>(null);
  const [code, setCode] = useState(""); const [name, setName] = useState(""); const [description, setDescription] = useState(""); const [inUse, setInUse] = useState(true);
  const [error, setError] = useState(""); const [notice, setNotice] = useState(""); const [busy, setBusy] = useState(false); const lock = useRef(false);
  const [leaving, setLeaving] = useState(false);
  const open = (product: SalesProduct | "new") => {
    setEditing(product); setCode(product === "new" ? "" : product.code); setName(product === "new" ? "" : product.name);
    setDescription(product === "new" ? "" : product.description ?? ""); setInUse(product === "new" || product.inUse); setError(""); setNotice("");
  };
  const save = async (event?: FormEvent) => {
    event?.preventDefault(); if (!editing || lock.current) return;
    if (!code.trim() || !name.trim()) { setError("Nhập mã và tên sản phẩm."); return; }
    lock.current = true; setBusy(true); setError("");
    try {
      await saveSalesProduct(editing === "new" ? null : editing.id, { code: code.trim(), name: name.trim(), description: description.trim(), inUse, rowVersion: editing === "new" ? undefined : editing.rowVersion });
      setEditing(null); setNotice("Đã lưu sản phẩm."); await list.reload();
    } catch (e) { setError(errorText(e)); } finally { lock.current = false; setBusy(false); }
  };
  /** Có sửa so với lúc mở form hay chưa, để "Quay lại" không âm thầm bỏ phần đã nhập. */
  const dirty = !!editing && (editing === "new"
    ? code !== "" || name !== "" || description !== "" || !inUse
    : code !== editing.code || name !== editing.name || description !== (editing.description ?? "") || inUse !== editing.inUse);
  const goBack = () => { if (lock.current) return; if (dirty) setLeaving(true); else { setEditing(null); setError(""); } };
  const footer = editing
    ? <Button fullWidth size="large" loading={busy} disabled={busy} onClick={() => void save()}>Lưu sản phẩm</Button>
    : <Button fullWidth size="large" onClick={() => open("new")}>Thêm sản phẩm</Button>;
  return <ManagePage title={editing === "new" ? "Thêm sản phẩm" : editing ? "Sửa sản phẩm" : "Sản phẩm bán"} footer={footer} onBack={editing ? goBack : undefined}>
    {notice && <p className="card form sales-notice" role="status">{notice}</p>}
    {editing ? <form className="card form" onSubmit={save} noValidate>
      <Input label="Mã sản phẩm (bắt buộc)" value={code} maxLength={50} disabled={busy} onChange={e => setCode(e.target.value)} />
      <Input label="Tên sản phẩm (bắt buộc)" value={name} maxLength={200} disabled={busy} onChange={e => setName(e.target.value)} />
      <Input.TextArea label="Mô tả" value={description} maxLength={2000} disabled={busy} onChange={e => setDescription(e.target.value)} />
      <Checkbox className="sales-option" value="in-use" checked={inUse} disabled={busy} onChange={e => setInUse(e.target.checked)}>Đang bán</Checkbox>
      <FormError text={error} />
    </form> : <>
      <div className="button-stack"><p className="form__hint">Thương lái chọn sản phẩm trong danh mục này và đặt mua theo số lồng.</p></div>
      <Loadable data={list.data} error={list.error} reload={() => void list.reload()}>{rows => rows.length ? <Rows>{rows.map(p => <Row key={p.id} title={p.name} meta={`${p.code}${p.description ? " · " + p.description : ""}`} badge={<Badge text={p.availableForPurchase ? "Đang bán" : p.inUse ? "Ngoài thời gian bán" : "Ngừng bán"} tone={p.availableForPurchase ? "success" : "neutral"} />} onClick={() => open(p)} />)}</Rows> : <Empty title="Chưa có sản phẩm" />}</Loadable>
      {list.data && list.error && <FormError text={list.error} />}
      <div className="button-stack"><Button fullWidth size="large" variant="secondary" onClick={() => void list.reload()}>Tải lại</Button></div>
    </>}
    <ConfirmSheet visible={leaving} title="Bỏ phần đang sửa?" message="Những gì bạn vừa nhập chưa được lưu và sẽ mất." confirmText="Bỏ phần đang sửa" cancelText="Tiếp tục sửa" danger
      onClose={() => setLeaving(false)} onConfirm={() => { setLeaving(false); setEditing(null); setError(""); }} />
  </ManagePage>;
}
