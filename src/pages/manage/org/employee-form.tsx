import { useEffect, useState } from "react";
import { Button, Input, Select, useNavigate, useParams } from "zmp-ui";

import FormError from "@/components/form-error";
import { Loadable, ManagePage, Section } from "@/components/manage/ui";
import { useLoad } from "@/hooks/use-load";
import { errorText, MESSAGES } from "@/services/acs/messages";
import { createEmployee, type EmployeeView, getEmployee, lookupZones, type SaveEmployee, updateEmployee, type ZoneLookupItem } from "@/services/organization";

import DateField from "@/components/manage/date-field";

type Form = {
  fullName: string;
  phoneNumber: string;
  birthday: string | null;
  address: string;
  area: string;
  ward: string;
  otherInformation: string;
  notes: string;
  workingZoneIds: string[];
  bankName: string;
  accountNumber: string;
  accountHolderName: string;
};

function formFrom(e: EmployeeView | null): Form {
  return {
    fullName: e?.fullName ?? "",
    phoneNumber: e?.phoneNumber ?? "",
    birthday: e?.birthday ?? null,
    address: e?.address ?? "",
    area: e?.area ?? "",
    ward: e?.ward ?? "",
    otherInformation: e?.otherInformation ?? "",
    notes: e?.notes ?? "",
    workingZoneIds: e?.workingZones.map((z) => z.id) ?? [],
    bankName: e?.bankAccount?.bankName ?? "",
    accountNumber: e?.bankAccount?.accountNumber ?? "",
    accountHolderName: e?.bankAccount?.accountHolderName ?? "",
  };
}

const opt = (text: string) => text.trim() || null;

/**
 * Thêm hoặc sửa hồ sơ nhân viên (`/manage/employees/new`, `/manage/employees/:id/edit`). Tạo tài khoản đăng nhập
 * cho nhân viên làm trên bản web; ở đây giữ nguyên tài khoản đã gắn.
 */
function EmployeeFormPage() {
  const { id } = useParams();
  const editing = Boolean(id);
  const navigate = useNavigate();
  const { data, error, reload } = useLoad(async () => {
    const [employee, zones] = await Promise.all([id ? getEmployee(id) : Promise.resolve(null), lookupZones()]);
    return { employee, zones };
  }, [id]);

  return (
    <ManagePage title={editing ? "Sửa nhân viên" : "Thêm nhân viên"}>
      <Loadable data={data} error={error} reload={() => void reload()}>
        {({ employee, zones }) => (
          <EmployeeForm
            employee={employee}
            zones={zones}
            onSaved={(saved) => navigate(`/manage/employees/${saved.id}`, { replace: true })}
          />
        )}
      </Loadable>
    </ManagePage>
  );
}

function EmployeeForm({ employee, zones, onSaved }: { employee: EmployeeView | null; zones: ZoneLookupItem[]; onSaved: (e: EmployeeView) => void }) {
  const [form, setForm] = useState<Form>(() => formFrom(employee));
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => setForm(formFrom(employee)), [employee]);

  const set = <K extends keyof Form>(key: K) => (value: Form[K]) => setForm((f) => ({ ...f, [key]: value }));
  const text = (key: keyof Form) => (e: { target: { value: string } }) => set(key)(e.target.value as never);

  // Vùng đang dùng, cộng các vùng đã ngừng nhưng nhân viên vẫn được gán (để không mất khi lưu).
  const zoneOptions = zones.filter((z) => z.statusId === 101 || form.workingZoneIds.includes(z.id));

  const save = async () => {
    if (!form.fullName.trim()) {
      setError(MESSAGES.MSG01("Họ tên"));
      return;
    }
    const hasBank = form.bankName.trim() || form.accountNumber.trim() || form.accountHolderName.trim();
    const body: SaveEmployee = {
      fullName: form.fullName.trim(),
      phoneNumber: opt(form.phoneNumber),
      birthday: form.birthday,
      address: opt(form.address),
      area: opt(form.area),
      ward: opt(form.ward),
      otherInformation: opt(form.otherInformation),
      notes: opt(form.notes),
      workingZoneIds: form.workingZoneIds,
      bankAccount: hasBank ? { bankName: opt(form.bankName), accountNumber: opt(form.accountNumber), accountHolderName: opt(form.accountHolderName) } : null,
      accountId: employee?.account?.id ?? null,
      rowVersion: employee?.rowVersion ?? null,
    };
    setBusy(true);
    setError("");
    try {
      const saved = employee ? await updateEmployee(employee.id, body) : await createEmployee(body);
      onSaved(saved.employee);
    } catch (err) {
      setError(errorText(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="form">
      <Input label="Họ tên" value={form.fullName} onChange={text("fullName")} maxLength={200} disabled={busy} />
      <Input label="Số điện thoại" value={form.phoneNumber} onChange={text("phoneNumber")} inputMode="tel" maxLength={20} disabled={busy} helperText="Số Zalo của nhân viên, dùng để liên kết tài khoản." />
      <DateField label="Ngày sinh" value={form.birthday} onChange={set("birthday")} disabled={busy} startYear={1940} endYear={new Date().getFullYear()} />
      <Input label="Địa chỉ" value={form.address} onChange={text("address")} maxLength={500} disabled={busy} />
      <div className="two-col">
        <Input label="Phường/xã" value={form.ward} onChange={text("ward")} maxLength={200} disabled={busy} />
        <Input label="Khu vực" value={form.area} onChange={text("area")} maxLength={200} disabled={busy} />
      </div>
      <Select
        label="Vùng làm việc"
        placeholder="Chọn vùng nuôi"
        multiple
        closeOnSelect={false}
        mask
        value={form.workingZoneIds}
        onChange={(v) => set("workingZoneIds")(((Array.isArray(v) ? v : []) as (string | number)[]).map(String))}
        disabled={busy}
      >
        {zoneOptions.map((z) => (
          <Select.Option key={z.id} value={z.id} title={`${z.name ?? z.code}${z.statusId === 101 ? "" : " (ngừng dùng)"}`} />
        ))}
      </Select>
      <Section title="Tài khoản ngân hàng">
        <div className="form">
          <Input label="Ngân hàng" value={form.bankName} onChange={text("bankName")} maxLength={200} disabled={busy} />
          <Input label="Số tài khoản" value={form.accountNumber} onChange={text("accountNumber")} inputMode="numeric" maxLength={50} disabled={busy} />
          <Input label="Chủ tài khoản" value={form.accountHolderName} onChange={text("accountHolderName")} maxLength={200} disabled={busy} />
        </div>
      </Section>
      <Input.TextArea label="Thông tin khác" value={form.otherInformation} onChange={text("otherInformation")} maxLength={1000} showCount disabled={busy} />
      <Input.TextArea label="Ghi chú" value={form.notes} onChange={text("notes")} maxLength={1000} showCount disabled={busy} />
      <FormError text={error} />
      <Button fullWidth size="large" loading={busy} disabled={busy} onClick={() => void save()}>
        Lưu
      </Button>
    </div>
  );
}

export default EmployeeFormPage;
