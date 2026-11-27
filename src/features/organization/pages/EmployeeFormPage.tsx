import type { EmployeeType, EmployeeView, EmployeeForm as Form, SaveEmployee } from "@/features/organization/models/Employee";
import type { ZoneLookupItem } from "@/features/organization/models/OrganizationZone";
import { useEffect, useState } from "react";
import { Button, Input, Select, useNavigate, useParams } from "zmp-ui";

import { ConfirmSheet } from "@/components/ConfirmSheet/ConfirmSheet";
import FormError from "@/components/FormError/FormError";
import { Loadable } from "@/components/Loadable/Loadable";
import { ManagePage } from "@/components/ManagePage/ManagePage";
import { Section } from "@/components/Section/Section";
import { useLoad } from "@/hooks/useLoad";
import { isApiError } from "@/services/errors";
import { errorText } from "@/utils/errorText";
import { MESSAGES } from "@/constants/messages";
import { createEmployee, getEmployee, lookupZones, updateEmployee } from "@/features/organization/services/organizationService";

import DateField from "@/components/DateField/DateField";

function formFrom(e: EmployeeView | null): Form {
  return {
    fullName: e?.fullName ?? "",
    employeeType: e?.employeeType ?? null,
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

const EMPLOYEE_TYPES: [EmployeeType, string][] = [
  ["SeasonalWorker", "Lao động thời vụ"],
  ["Staff", "Nhân viên"],
];

/**
 * Thêm hoặc sửa hồ sơ nhân viên (`/manage/employees/new`, `/manage/employees/:id/edit`). Tạo tài khoản đăng nhập
 * cho nhân viên làm trên bản web; ở đây giữ nguyên tài khoản đã gắn.
 */
function EmployeeFormPage() {
  const { id } = useParams();
  const editing = Boolean(id);
  const navigate = useNavigate();
  const { data, error, reload } = useLoad(async () => {
    const [employee, zones] = await Promise.all([id ? getEmployee(id) : Promise.resolve(null), lookupZones(true)]);
    return { employee, zones };
  }, [id]);
  const title = editing ? "Sửa nhân viên" : "Thêm nhân viên";

  // Nút Lưu nằm ở chân trang và cần dữ liệu của form, nên khi đã tải xong thì form tự dựng ManagePage của nó.
  if (data) {
    return (
      <EmployeeForm
        title={title}
        employee={data.employee}
        zones={data.zones}
        onSaved={(saved) => navigate(`/manage/employees/${saved.id}`, { replace: true })}
      />
    );
  }

  return (
    <ManagePage title={title}>
      <Loadable data={data} error={error} reload={() => void reload()}>
        {() => null}
      </Loadable>
    </ManagePage>
  );
}

function EmployeeForm({ title, employee, zones, onSaved }: { title: string; employee: EmployeeView | null; zones: ZoneLookupItem[]; onSaved: (e: EmployeeView) => void }) {
  const [form, setForm] = useState<Form>(() => formFrom(employee));
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  // Quản lý vùng thêm nhân viên: backend hỏi Chủ HTX đã trực tiếp đồng ý chưa (MSG-LABOR-01).
  const [askOwner, setAskOwner] = useState(false);

  useEffect(() => setForm(formFrom(employee)), [employee]);

  const set = <K extends keyof Form>(key: K) => (value: Form[K]) => setForm((f) => ({ ...f, [key]: value }));
  const text = (key: keyof Form) => (e: { target: { value: string } }) => set(key)(e.target.value as never);

  // Vùng đang dùng, cộng các vùng đã ngừng nhưng nhân viên vẫn được gán, để bỏ được vùng đó khỏi nhân viên.
  const zoneOptions = zones.filter((z) => z.statusId === 101 || form.workingZoneIds.includes(z.id));

  const save = async (ownerApproved = false) => {
    if (!form.fullName.trim()) {
      setError(MESSAGES.MSG01("Họ tên"));
      return;
    }
    if (!employee && !form.employeeType) {
      setError(MESSAGES.MSG01("Loại nhân viên"));
      return;
    }
    if (!employee && form.workingZoneIds.length === 0) {
      setError(MESSAGES.MSG01("Vùng làm việc"));
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
      employeeType: form.employeeType,
      // Loại việc thay cả danh sách khi sửa: gửi lại loại việc đang có (đặt ở màn bảng giá công hoặc trên web).
      jobTypeIds: employee?.jobTypes.map((j) => j.id) ?? [],
      ownerApproved,
      rowVersion: employee?.rowVersion ?? null,
    };
    setBusy(true);
    setError("");
    try {
      const saved = employee ? await updateEmployee(employee.id, body) : await createEmployee(body);
      onSaved(saved.employee);
    } catch (err) {
      if (!employee && isApiError(err, "MSG-LABOR-01")) setAskOwner(true);
      else setError(errorText(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <ManagePage
      title={title}
      footer={
        <Button fullWidth size="large" loading={busy} disabled={busy} onClick={() => void save(false)}>
          Lưu
        </Button>
      }
    >
      <Section step={1} title="Thông tin cá nhân">
        <div className="form">
          <Input label="Họ tên (bắt buộc)" value={form.fullName} onChange={text("fullName")} maxLength={100} disabled={busy} />
          <Select
            label={employee ? "Loại nhân viên" : "Loại nhân viên (bắt buộc)"}
            placeholder="Chọn loại"
            value={form.employeeType ?? undefined}
            onChange={(v) => set("employeeType")(String(v) as EmployeeType)}
            closeOnSelect
            disabled={busy}
          >
            {EMPLOYEE_TYPES.map(([key, label]) => (
              <Select.Option key={key} value={key} title={label} />
            ))}
          </Select>
          <Input label="Số điện thoại" value={form.phoneNumber} onChange={text("phoneNumber")} inputMode="tel" maxLength={20} disabled={busy} helperText="Số Zalo của nhân viên, dùng để liên kết tài khoản." />
          <DateField label="Ngày sinh" value={form.birthday} onChange={set("birthday")} disabled={busy} startYear={1940} endYear={new Date().getFullYear()} />
        </div>
      </Section>
      <Section step={2} title="Địa chỉ và vùng làm việc">
        <div className="form">
          <Input label="Địa chỉ" value={form.address} onChange={text("address")} maxLength={500} disabled={busy} />
          <Input label="Phường/xã" value={form.ward} onChange={text("ward")} maxLength={200} disabled={busy} />
          <Input label="Khu vực" value={form.area} onChange={text("area")} maxLength={200} disabled={busy} />
          <Select
            label={employee ? "Vùng làm việc" : "Vùng làm việc (bắt buộc)"}
            placeholder="Chọn vùng nuôi"
            multiple
            closeOnSelect={false}
            mask
            value={form.workingZoneIds}
            onChange={(v) => set("workingZoneIds")(((Array.isArray(v) ? v : []) as (string | number)[]).map(String))}
            disabled={busy}
          >
            {zoneOptions.map((z) => (
              <Select.Option key={z.id} value={z.id} title={z.name ?? z.code ?? ""} />
            ))}
          </Select>
        </div>
      </Section>
      <Section step={3} title="Tài khoản ngân hàng">
        <div className="form">
          <Input label="Ngân hàng" value={form.bankName} onChange={text("bankName")} maxLength={200} disabled={busy} />
          <Input label="Số tài khoản" value={form.accountNumber} onChange={text("accountNumber")} inputMode="numeric" maxLength={50} disabled={busy} />
          <Input label="Chủ tài khoản" value={form.accountHolderName} onChange={text("accountHolderName")} maxLength={200} disabled={busy} />
        </div>
      </Section>
      <Section step={4} title="Thông tin thêm">
        <div className="form">
          <Input.TextArea label="Thông tin khác" value={form.otherInformation} onChange={text("otherInformation")} maxLength={1000} showCount disabled={busy} />
          <Input.TextArea label="Ghi chú" value={form.notes} onChange={text("notes")} maxLength={1000} showCount disabled={busy} />
          <FormError text={error} />
        </div>
      </Section>
      <ConfirmSheet
        visible={askOwner}
        title="Chủ HTX đã đồng ý chưa?"
        message={`Chủ HTX đã trực tiếp đồng ý thêm ${form.fullName.trim()} làm nhân viên chưa?`}
        confirmText="Có, Chủ HTX đã đồng ý"
        cancelText="Chưa, quay lại"
        busy={busy}
        onClose={() => {
          setAskOwner(false);
          setError("Cần Chủ HTX đồng ý trước khi thêm nhân viên.");
        }}
        onConfirm={() => {
          setAskOwner(false);
          void save(true);
        }}
      />
    </ManagePage>
  );
}

export default EmployeeFormPage;
