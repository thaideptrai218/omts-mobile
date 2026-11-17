import type { SupplierType, SupplierView } from "@/features/purchasing/models/Supplier";
import { useEffect, useState } from "react";
import { Button, Input, Select, useNavigate, useParams } from "zmp-ui";

import FormError from "@/components/FormError/FormError";
import { Loadable } from "@/components/Loadable/Loadable";
import { ManagePage } from "@/components/ManagePage/ManagePage";
import { useLoad } from "@/hooks/useLoad";
import { errorText } from "@/utils/errorText";
import { MESSAGES } from "@/constants/messages";
import { SUPPLIER_TYPE } from "@/utils/labels";
import { createSupplier, getSupplier, updateSupplier } from "@/features/purchasing/services/purchasingService";

const PHONE = /^0\d{9}$/;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Thêm hoặc sửa nhà cung cấp (`/manage/suppliers/new`, `/manage/suppliers/:id/edit`). */
function SupplierFormPage() {
  const { id } = useParams();
  const { data, error, reload } = useLoad<SupplierView | "new">(() => (id ? getSupplier(id) : Promise.resolve("new")), [id]);

  const title = id ? "Sửa nhà cung cấp" : "Thêm nhà cung cấp";

  // Form đặt nút chính ở chân trang nên tự dựng ManagePage; khung dưới chỉ dùng khi đang tải hoặc lỗi.
  if (data !== null) return <SupplierForm title={title} supplier={data === "new" ? null : data} />;

  return (
    <ManagePage title={title}>
      <Loadable data={data} error={error} reload={() => void reload()}>
        {() => null}
      </Loadable>
    </ManagePage>
  );
}

function SupplierForm({ title, supplier }: { title: string; supplier: SupplierView | null }) {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [type, setType] = useState<SupplierType>("Seed");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [email, setEmail] = useState("");
  const [note, setNote] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!supplier) return;
    setName(supplier.name ?? "");
    setType(supplier.supplierType);
    setPhone(supplier.phoneNumber ?? "");
    setAddress(supplier.address ?? "");
    setEmail(supplier.email ?? "");
    setNote(supplier.note ?? "");
  }, [supplier]);

  const save = async () => {
    if (!name.trim()) {
      setError(MESSAGES.MSG01("Tên nhà cung cấp"));
      return;
    }
    if (!PHONE.test(phone.trim())) {
      setError(MESSAGES.MSG01("Số điện thoại"));
      return;
    }
    if (email.trim() && !EMAIL.test(email.trim())) {
      setError(MESSAGES.MSG01("Email"));
      return;
    }
    setError("");
    setBusy(true);
    const body = {
      name: name.trim(),
      supplierType: type,
      phoneNumber: phone.trim(),
      // Địa chỉ và email gửi gì backend lưu nấy, nên luôn gửi giá trị đang có trên form.
      address: address.trim() || null,
      email: email.trim() || null,
      note: note.trim() || null,
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
    <ManagePage
      title={title}
      footer={
        <Button fullWidth size="large" loading={busy} disabled={busy} onClick={() => void save()}>
          Lưu
        </Button>
      }
    >
      <div className="form card">
        <Input label="Tên nhà cung cấp (bắt buộc)" value={name} onChange={(e) => setName(e.target.value)} maxLength={200} disabled={busy} />
        <Select label="Loại" value={type} onChange={(v) => setType(v as SupplierType)} closeOnSelect disabled={busy}>
          {(Object.keys(SUPPLIER_TYPE) as SupplierType[]).map((k) => (
            <Select.Option key={k} value={k} title={SUPPLIER_TYPE[k]} />
          ))}
        </Select>
        <Input label="Số điện thoại (bắt buộc)" value={phone} inputMode="tel" onChange={(e) => setPhone(e.target.value)} maxLength={10} disabled={busy} />
        <Input.TextArea label="Địa chỉ" value={address} onChange={(e) => setAddress(e.target.value)} maxLength={500} showCount disabled={busy} />
        <Input label="Email" value={email} inputMode="email" onChange={(e) => setEmail(e.target.value)} maxLength={200} disabled={busy} />
        <Input.TextArea label="Ghi chú (người liên hệ, giờ nhận hàng…)" value={note} onChange={(e) => setNote(e.target.value)} maxLength={2000} showCount disabled={busy} />
        <FormError text={error} />
      </div>
    </ManagePage>
  );
}

export default SupplierFormPage;
