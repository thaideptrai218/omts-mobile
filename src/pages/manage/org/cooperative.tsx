import { useState } from "react";
import { Button, Input, useSnackbar } from "zmp-ui";

import FormError from "@/components/form-error";
import { Facts, Loadable, ManagePage, Section } from "@/components/manage/ui";
import { useLoad } from "@/hooks/use-load";
import { errorText, MESSAGES } from "@/services/acs/messages";
import { absoluteUrl, type CooperativeProfile, getCooperativeProfile, updateCooperativeProfile } from "@/services/organization";

import "./org.scss";

type Form = {
  fullName: string;
  taxCode: string;
  officeAddress: string;
  phoneNumber: string;
  email: string;
  website: string;
  legalRepresentative: string;
  businessLines: string;
};

function formFrom(p: CooperativeProfile): Form {
  return {
    fullName: p.fullName ?? "",
    taxCode: p.taxCode ?? "",
    officeAddress: p.officeAddress ?? "",
    phoneNumber: p.phoneNumber ?? "",
    email: p.email ?? "",
    website: p.website ?? "",
    legalRepresentative: p.legalRepresentative ?? "",
    businessLines: p.businessLines.join("\n"),
  };
}

const opt = (text: string) => text.trim() || null;

/** Hồ sơ HTX: xem và sửa thông tin chung. Tên, địa chỉ và logo hiện trên trang truy xuất công khai. */
function CooperativePage() {
  const { data, error, reload, setData } = useLoad(getCooperativeProfile, []);
  const [form, setForm] = useState<Form | null>(null);
  const [formError, setFormError] = useState("");
  const [busy, setBusy] = useState(false);
  const { openSnackbar } = useSnackbar();

  const text = (key: keyof Form) => (e: { target: { value: string } }) => setForm((f) => (f ? { ...f, [key]: e.target.value } : f));

  const save = async () => {
    if (!data || !form) return;
    if (!form.fullName.trim()) {
      setFormError(MESSAGES.MSG01("Tên HTX"));
      return;
    }
    setBusy(true);
    setFormError("");
    try {
      const saved = await updateCooperativeProfile({
        fullName: form.fullName.trim(),
        taxCode: opt(form.taxCode),
        officeAddress: opt(form.officeAddress),
        phoneNumber: opt(form.phoneNumber),
        email: opt(form.email),
        website: opt(form.website),
        legalRepresentative: opt(form.legalRepresentative),
        businessLines: form.businessLines.split("\n").map((l) => l.trim()).filter(Boolean),
        rowVersion: data.rowVersion,
      });
      setData(saved.profile);
      setForm(null);
      openSnackbar({ text: MESSAGES.MSG10("hồ sơ HTX"), type: "success", duration: 4000 });
    } catch (err) {
      setFormError(errorText(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <ManagePage title="Hồ sơ HTX">
      <Loadable data={data} error={error} reload={() => void reload()}>
        {(p) =>
          form ? (
            <div className="form">
              <Input label="Tên HTX" value={form.fullName} onChange={text("fullName")} maxLength={300} disabled={busy} />
              <Input label="Mã số thuế" value={form.taxCode} onChange={text("taxCode")} inputMode="numeric" maxLength={20} disabled={busy} />
              <Input.TextArea label="Địa chỉ trụ sở" value={form.officeAddress} onChange={text("officeAddress")} maxLength={500} disabled={busy} />
              <Input label="Số điện thoại" value={form.phoneNumber} onChange={text("phoneNumber")} inputMode="tel" maxLength={20} disabled={busy} />
              <Input label="Email" value={form.email} onChange={text("email")} inputMode="email" maxLength={254} disabled={busy} />
              <Input label="Website" value={form.website} onChange={text("website")} inputMode="url" maxLength={500} disabled={busy} />
              <Input label="Người đại diện pháp luật" value={form.legalRepresentative} onChange={text("legalRepresentative")} maxLength={200} disabled={busy} />
              <Input.TextArea label="Ngành nghề kinh doanh" helperText="Mỗi dòng một ngành nghề." value={form.businessLines} onChange={text("businessLines")} disabled={busy} />
              <FormError text={formError} />
              <div className="action-row">
                <Button size="large" variant="secondary" disabled={busy} onClick={() => setForm(null)}>
                  Hủy
                </Button>
                <Button size="large" loading={busy} disabled={busy} onClick={() => void save()}>
                  Lưu
                </Button>
              </div>
            </div>
          ) : (
            <>
              {p.logoUrl && (
                <div className="card coop-logo">
                  <img src={absoluteUrl(p.logoUrl) ?? ""} alt={`Logo ${p.fullName ?? "HTX"}`} />
                </div>
              )}
              <Section title="Thông tin chung">
                <Facts
                  items={[
                    ["Tên HTX", p.fullName],
                    ["Mã số thuế", p.taxCode],
                    ["Địa chỉ trụ sở", p.officeAddress],
                    ["Số điện thoại", p.phoneNumber],
                    ["Email", p.email],
                    ["Website", p.website],
                    ["Người đại diện pháp luật", p.legalRepresentative],
                    ["Ngành nghề kinh doanh", p.businessLines.join("; ")],
                  ]}
                />
              </Section>
              <div className="action-row">
                <Button
                  size="large"
                  onClick={() => {
                    setFormError("");
                    setForm(formFrom(p));
                  }}
                >
                  Sửa hồ sơ
                </Button>
              </div>
              <p className="screen__note">Tên, địa chỉ và logo hiện trên trang truy xuất công khai. Đổi logo thực hiện trên bản web.</p>
            </>
          )
        }
      </Loadable>
    </ManagePage>
  );
}

export default CooperativePage;
