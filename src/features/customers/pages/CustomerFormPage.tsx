import type { CustomerDraft, CustomerFormData, CustomerRequiredFields, CustomerType, CustomerView, Gender, SaveCustomer } from "@/features/customers/models/Customer";
import { useAtomValue } from "jotai";
import { useState } from "react";
import { Button, Input, Select, useNavigate, useParams, useSnackbar } from "zmp-ui";

import DateField from "@/components/DateField/DateField";
import FormError from "@/components/FormError/FormError";
import { Loadable } from "@/components/Loadable/Loadable";
import { ManagePage } from "@/components/ManagePage/ManagePage";
import { Section } from "@/components/Section/Section";
import { MESSAGES } from "@/constants/messages";
import { useLoad } from "@/hooks/useLoad";
import { isApiError } from "@/services/errors";
import { errorText } from "@/utils/errorText";
import { permissionsAtom } from "@/features/auth/state/authAtoms";
import { createCustomer, getCustomer, getCustomerSettings, listBanks, updateCustomer } from "@/features/customers/services/customerService";
import { CUSTOMER_TYPE_TEXT, GENDER_TEXT, normalizePhone } from "@/features/customers/utils/customerText";

const CODE = /^[A-Za-z0-9_.-]{1,30}$/;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const TAX_CODE = /^(\d{10}(-\d{3})?|\d{12})$/;
const IDENTITY = /^\d{12}$/;
const ACCOUNT_NUMBER = /^[0-9A-Za-z]{1,19}$/;

/** Thêm hoặc sửa hồ sơ khách hàng (`/manage/customers/new`, `/manage/customers/:id/edit`), SALE-04 bước 3 đến 7 và SALE-04.2. */
function CustomerFormPage() {
  const { id } = useParams();
  const permissions = useAtomValue(permissionsAtom);
  const isOwner = !!permissions?.isCooperativeOwner;
  const { data, error, reload } = useLoad<CustomerFormData>(async () => {
    const [customer, settings, banks] = await Promise.all([
      id ? getCustomer(id) : Promise.resolve(null),
      getCustomerSettings(),
      // Danh sách ngân hàng chỉ mở cho Chủ HTX; người khác giữ nguyên tài khoản ngân hàng đã có của hồ sơ.
      isOwner ? listBanks().catch(() => null) : Promise.resolve(null),
    ]);
    return { customer, settings, banks };
  }, [id, isOwner]);

  const title = id ? "Sửa khách hàng" : "Thêm khách hàng";

  // Form đặt nút chính ở chân trang nên tự dựng ManagePage; khung dưới chỉ dùng khi đang tải hoặc lỗi.
  if (data !== null) return <CustomerForm title={title} data={data} />;

  return (
    <ManagePage title={title}>
      <Loadable data={data} error={error} reload={() => void reload()}>
        {() => null}
      </Loadable>
    </ManagePage>
  );
}

function draftOf(c: CustomerView | null): CustomerDraft {
  return {
    name: c?.name ?? "",
    phoneNumber: c?.phoneNumber ?? "",
    code: c?.code ?? "",
    customerType: c?.customerType ?? "Individual",
    gender: c?.gender ?? "",
    birthDate: c?.birthDate ?? "",
    phoneNumber2: c?.phoneNumber2 ?? "",
    email: c?.email ?? "",
    facebook: c?.facebook ?? "",
    address: c?.address ?? "",
    province: c?.province ?? "",
    ward: c?.ward ?? "",
    companyName: c?.companyName ?? "",
    taxCode: c?.taxCode ?? "",
    identityNumber: c?.identityNumber ?? "",
    bankBin: c?.bankBin ?? "",
    bankAccountNumber: c?.bankAccountNumber ?? "",
    note: c?.note ?? "",
  };
}

const text = (value: string) => value.trim() || null;

/** Thân gửi API: lưu là thay toàn bộ hồ sơ, nên luôn gửi đủ mọi trường (trường trống là xóa). */
function bodyOf(d: CustomerDraft, customer: CustomerView | null): SaveCustomer {
  return {
    name: d.name.trim(),
    // Hồ sơ gắn tài khoản thương lái: gửi lại đúng số cũ, chỉ thương lái tự đổi được (BR-SALE-04).
    phoneNumber: customer?.phoneLocked ? customer.phoneNumber : text(d.phoneNumber),
    address: text(d.address),
    note: text(d.note),
    rowVersion: customer?.rowVersion,
    code: text(d.code),
    customerType: d.customerType,
    gender: d.gender || null,
    birthDate: d.birthDate || null,
    phoneNumber2: text(d.phoneNumber2),
    email: text(d.email),
    facebook: text(d.facebook),
    province: text(d.province),
    ward: text(d.ward),
    companyName: text(d.companyName),
    taxCode: text(d.taxCode),
    identityNumber: text(d.identityNumber),
    bankBin: text(d.bankBin),
    bankAccountNumber: text(d.bankAccountNumber),
  };
}

/** Kiểm tra tại chỗ theo đúng quy tắc của backend (CustomerEntries) để báo lỗi ngay; server vẫn kiểm tra lại. */
function check(d: CustomerDraft, required: CustomerRequiredFields, phoneLocked: boolean): string {
  const missing = (field: string) => MESSAGES.MSG01(field);
  if (!d.name.trim()) return missing("Tên khách hàng");
  if (!phoneLocked && !normalizePhone(d.phoneNumber)) return missing("Số điện thoại (10 số, bắt đầu bằng 0)");
  if (d.code.trim() && !CODE.test(d.code.trim())) return missing("Mã khách hàng (tối đa 30 chữ cái không dấu, số, dấu chấm, gạch)");
  if ((required.phoneNumber2 || d.phoneNumber2.trim()) && !normalizePhone(d.phoneNumber2)) return missing("Số điện thoại thứ hai");
  if ((required.email || d.email.trim()) && !EMAIL.test(d.email.trim())) return missing("Email");
  if (required.facebook && !d.facebook.trim()) return missing("Facebook");
  if (required.address && !d.address.trim()) return missing("Địa chỉ");
  if (required.address && !d.province.trim()) return missing("Tỉnh/thành phố");
  if (required.address && !d.ward.trim()) return missing("Phường/xã");
  if (required.gender && !d.gender) return missing("Giới tính");
  if (required.birthDate && !d.birthDate) return missing("Ngày sinh");
  if (d.identityNumber.trim() && !IDENTITY.test(d.identityNumber.trim())) return missing("Số CCCD (12 số)");
  if ((required.taxCode || d.taxCode.trim()) && !TAX_CODE.test(d.taxCode.trim())) return missing("Mã số thuế (10 số, 10 số kèm -3 số, hoặc 12 số)");
  const hasBank = !!d.bankBin || !!d.bankAccountNumber.trim();
  if ((required.bank || hasBank) && !d.bankBin) return missing("Ngân hàng");
  if ((required.bank || hasBank) && !ACCOUNT_NUMBER.test(d.bankAccountNumber.trim())) return missing("Số tài khoản ngân hàng");
  return "";
}

function CustomerForm({ title, data }: { title: string; data: CustomerFormData }) {
  const navigate = useNavigate();
  const { openSnackbar } = useSnackbar();
  const { customer, settings, banks } = data;
  const required = settings.requiredFields;
  const phoneLocked = !!customer?.phoneLocked;
  const [draft, setDraft] = useState<CustomerDraft>(() => draftOf(customer));
  const [error, setError] = useState("");
  const [existingId, setExistingId] = useState("");
  const [busy, setBusy] = useState(false);

  const set = (patch: Partial<CustomerDraft>) => {
    setDraft((d) => ({ ...d, ...patch }));
    setError("");
    setExistingId("");
  };
  const label = (name: string, on: boolean) => (on ? `${name} (bắt buộc)` : name);
  const showCompany = draft.customerType === "Company" || !!draft.companyName || !!draft.taxCode || required.taxCode;
  const thisYear = new Date().getFullYear();

  const save = async () => {
    const problem = check(draft, required, phoneLocked);
    if (problem) {
      setError(problem);
      return;
    }
    setError("");
    setExistingId("");
    setBusy(true);
    try {
      const body = bodyOf(draft, customer);
      const saved = customer ? await updateCustomer(customer.id, body) : await createCustomer(body);
      openSnackbar({ text: "Đã lưu hồ sơ khách hàng.", type: "success", duration: 4000 });
      navigate(`/manage/customers/${saved.customer.id}`, { replace: true });
    } catch (err) {
      setError(errorText(err));
      // MSG-GEN-02: số điện thoại hoặc mã đã thuộc hồ sơ khác; mở được hồ sơ đó thay vì tạo bản trùng (SALE-04.0.E2).
      const existing = isApiError(err) ? err.details.existingId : undefined;
      if (typeof existing === "string" && existing !== customer?.id) setExistingId(existing);
    } finally {
      setBusy(false);
    }
  };

  return (
    <ManagePage
      title={title}
      footer={
        <Button fullWidth size="large" loading={busy} disabled={busy} onClick={() => void save()}>
          Lưu hồ sơ
        </Button>
      }
    >
      <Section title="Thông tin chính">
        <div className="form card">
          <Input label="Tên khách hàng (bắt buộc)" value={draft.name} onChange={(e) => set({ name: e.target.value })} maxLength={200} disabled={busy} />
          <Input
            label={phoneLocked ? "Số điện thoại" : "Số điện thoại (bắt buộc)"}
            value={draft.phoneNumber}
            inputMode="tel"
            onChange={(e) => set({ phoneNumber: e.target.value })}
            maxLength={20}
            disabled={busy || phoneLocked}
            helperText={phoneLocked ? "Hồ sơ gắn tài khoản thương lái: chỉ thương lái tự đổi được số này." : undefined}
          />
          <Select label="Loại khách hàng" value={draft.customerType} onChange={(v) => set({ customerType: v as CustomerType })} closeOnSelect disabled={busy}>
            {(Object.keys(CUSTOMER_TYPE_TEXT) as CustomerType[]).map((k) => (
              <Select.Option key={k} value={k} title={CUSTOMER_TYPE_TEXT[k]} />
            ))}
          </Select>
          <Input
            label="Mã khách hàng"
            value={draft.code}
            onChange={(e) => set({ code: e.target.value })}
            maxLength={30}
            disabled={busy}
            helperText={customer ? "Để trống thì giữ mã cũ." : "Để trống thì hệ thống tự đặt mã."}
          />
        </div>
      </Section>

      <Section title="Liên hệ">
        <div className="form card">
          <Input label={label("Số điện thoại thứ hai", required.phoneNumber2)} value={draft.phoneNumber2} inputMode="tel" onChange={(e) => set({ phoneNumber2: e.target.value })} maxLength={20} disabled={busy} />
          <Input label={label("Email", required.email)} value={draft.email} inputMode="email" onChange={(e) => set({ email: e.target.value })} maxLength={254} disabled={busy} />
          <Input label={label("Facebook", required.facebook)} value={draft.facebook} onChange={(e) => set({ facebook: e.target.value })} maxLength={500} disabled={busy} />
          <Input label={label("Địa chỉ", required.address)} value={draft.address} onChange={(e) => set({ address: e.target.value })} maxLength={500} disabled={busy} />
          <Input label={label("Phường/xã", required.address)} value={draft.ward} onChange={(e) => set({ ward: e.target.value })} maxLength={100} disabled={busy} />
          <Input label={label("Tỉnh/thành phố", required.address)} value={draft.province} onChange={(e) => set({ province: e.target.value })} maxLength={100} disabled={busy} />
        </div>
      </Section>

      <Section title="Thông tin cá nhân">
        <div className="form card">
          <Select label={label("Giới tính", required.gender)} value={draft.gender} onChange={(v) => set({ gender: v as Gender | "" })} closeOnSelect disabled={busy}>
            <Select.Option value="" title="Không ghi" />
            {(Object.keys(GENDER_TEXT) as Gender[]).map((k) => (
              <Select.Option key={k} value={k} title={GENDER_TEXT[k]} />
            ))}
          </Select>
          <DateField label={label("Ngày sinh", required.birthDate)} value={draft.birthDate || null} onChange={(birthDate) => set({ birthDate })} disabled={busy} startYear={1900} endYear={thisYear} />
          {draft.birthDate && !required.birthDate && (
            <Button fullWidth variant="secondary" size="large" disabled={busy} onClick={() => set({ birthDate: "" })}>
              Xóa ngày sinh
            </Button>
          )}
          <Input label="Số CCCD" value={draft.identityNumber} inputMode="numeric" onChange={(e) => set({ identityNumber: e.target.value })} maxLength={12} disabled={busy} helperText="12 số. Chỉ hiện ở hồ sơ này, không hiện ở danh sách." />
        </div>
      </Section>

      {showCompany && (
        <Section title="Công ty">
          <div className="form card">
            <Input label="Tên công ty" value={draft.companyName} onChange={(e) => set({ companyName: e.target.value })} maxLength={200} disabled={busy} />
            <Input label={label("Mã số thuế", required.taxCode)} value={draft.taxCode} inputMode="numeric" onChange={(e) => set({ taxCode: e.target.value })} maxLength={14} disabled={busy} />
          </div>
        </Section>
      )}

      <Section title="Tài khoản nhận tiền trả lại">
        <div className="form card">
          {banks ? (
            <>
              <Select label={label("Ngân hàng", required.bank)} value={draft.bankBin} onChange={(v) => set({ bankBin: String(v ?? "") })} closeOnSelect disabled={busy}>
                <Select.Option value="" title="Chưa có" />
                {banks.map((b) => (
                  <Select.Option key={b.bin} value={b.bin} title={`${b.shortName} · ${b.name}`} />
                ))}
              </Select>
              <Input label={label("Số tài khoản", required.bank)} value={draft.bankAccountNumber} inputMode="numeric" onChange={(e) => set({ bankAccountNumber: e.target.value })} maxLength={19} disabled={busy} />
            </>
          ) : (
            <p className="form__hint">
              {customer?.bankAccountNumber
                ? `${customer.bankName ?? customer.bankBin ?? "Ngân hàng"} · ${customer.bankAccountNumber}. `
                : "Chưa có tài khoản ngân hàng. "}
              Danh sách ngân hàng chỉ mở cho Chủ HTX nên ở đây chưa đổi được tài khoản này; khi lưu, tài khoản đang có được giữ nguyên.
            </p>
          )}
        </div>
      </Section>

      <Section title="Ghi chú">
        <div className="form card">
          <Input.TextArea label="Ghi chú" value={draft.note} onChange={(e) => set({ note: e.target.value })} maxLength={1000} showCount disabled={busy} />
          <FormError text={error} />
          {existingId && (
            <Button fullWidth variant="secondary" size="large" onClick={() => navigate(`/manage/customers/${existingId}`)}>
              Mở hồ sơ đã có
            </Button>
          )}
        </div>
      </Section>
    </ManagePage>
  );
}

export default CustomerFormPage;
