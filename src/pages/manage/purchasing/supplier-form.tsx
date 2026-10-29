import { useEffect, useState } from "react";
import { Button, Input, Select, useNavigate, useParams } from "zmp-ui";

import FormError from "@/components/form-error";
import { Loadable, ManagePage } from "@/components/manage/ui";
import { useLoad } from "@/hooks/use-load";
import { errorText, MESSAGES } from "@/services/acs/messages";
import { SUPPLIER_TYPE } from "@/services/labels";
import { createSupplier, getSupplier, updateSupplier, type SupplierType, type SupplierView } from "@/services/purchasing";

const PHONE = /^0\d{9}$/;

/** Thêm hoặc sửa nhà cung cấp (`/manage/suppliers/new`, `/manage/suppliers/:id/edit`). */
function SupplierFormPage() {
  const { id } = useParams();
  const { data, error, reload } = useLoad<SupplierView | "new">(() => (id ? getSupplier(id) : Promise.resolve("new")), [id]);

  return (
    <ManagePage title={id ? "Sửa nhà cung cấp" : "Thêm nhà cung cấp"}>
      <Loadable data={data} error={error} reload={() => void reload()}>
        {(s) => <SupplierForm supplier={s === "new" ? null : s} />}
      </Loadable>
    </ManagePage>
  );
}

function SupplierForm({ supplier }: { supplier: SupplierView | null }) {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [type, setType] = useState<SupplierType>("Seed");
  const [phone, setPhone] = useState("");
  const [contacts, setContacts] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!supplier) return;
    setName(supplier.name ?? "");
    setType(supplier.supplierType);
    setPhone(supplier.phoneNumber ?? "");
    setContacts(supplier.otherContacts ?? "");
  }, [supplier]);

  const save = async () => {
    if (!name.trim()) {
      setError(MESSAGES.MSG01("Tên nhà cung cấp"));
      return;
    }
    if (phone.trim() && !PHONE.test(phone.trim())) {
      setError(MESSAGES.MSG01("Số điện thoại"));
      return;
    }
    setError("");
    setBusy(true);
    const body = {
      name: name.trim(),
      supplierType: type,
      phoneNumber: phone.trim() || null,
      otherContacts: contacts.trim() || null,
      rowVersion: supplier?.rowVersion,
    };
    try {
      const saved = supplier ? await updateSupplier(supplier.id, body) : await createSupplier(body);
      navigate(`/manage/suppliers/${saved.id}`, { replace: true });
    } catch (err) {
      setError(errorText(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="form card">
      <Input label="Tên nhà cung cấp" value={name} onChange={(e) => setName(e.target.value)} maxLength={200} disabled={busy} />
      <Select label="Loại" value={type} onChange={(v) => setType(v as SupplierType)} closeOnSelect disabled={busy}>
        {(Object.keys(SUPPLIER_TYPE) as SupplierType[]).map((k) => (
          <Select.Option key={k} value={k} title={SUPPLIER_TYPE[k]} />
        ))}
      </Select>
      <Input label="Số điện thoại" value={phone} inputMode="tel" onChange={(e) => setPhone(e.target.value)} maxLength={10} disabled={busy} />
      <Input.TextArea label="Liên hệ khác (địa chỉ, người liên hệ…)" value={contacts} onChange={(e) => setContacts(e.target.value)} maxLength={500} showCount disabled={busy} />
      <FormError text={error} />
      <Button fullWidth size="large" loading={busy} disabled={busy} onClick={() => void save()}>
        Lưu
      </Button>
    </div>
  );
}

export default SupplierFormPage;
