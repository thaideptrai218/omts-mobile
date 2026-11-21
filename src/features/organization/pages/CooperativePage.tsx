import type { CooperativeProfile, CooperativeForm as Form } from "@/features/organization/models/Cooperative";
import { useState } from "react";
import { Button, Input, useSnackbar } from "zmp-ui";

import FormError from "@/components/FormError/FormError";
import { Actions } from "@/components/Actions/Actions";
import { ConfirmSheet } from "@/components/ConfirmSheet/ConfirmSheet";
import { Facts } from "@/components/Facts/Facts";
import { Loadable } from "@/components/Loadable/Loadable";
import { ManagePage } from "@/components/ManagePage/ManagePage";
import { Section } from "@/components/Section/Section";
import { useAction } from "@/hooks/useAction";
import { useLoad } from "@/hooks/useLoad";
import { errorText } from "@/utils/errorText";
import { MESSAGES } from "@/constants/messages";
import { absoluteUrl } from "@/services/httpClient";
import { choosePhoto } from "@/services/zaloService";
import { getCooperativeProfile, removeCooperativeLogo, updateCooperativeProfile, uploadCooperativeLogo } from "@/features/organization/services/organizationService";

import "@/features/organization/styles/organization.scss";

function formFrom(p: CooperativeProfile): Form {
  return {
    fullName: p.fullName ?? "",
    shortName: p.shortName ?? "",
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
  const logo = useAction();
  const [removingLogo, setRemovingLogo] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  const askCancel = () => {
    if (!busy) setCancelling(true);
  };

  const pickLogo = async () => {
    try {
      const photo = await choosePhoto();
      if (!photo) return;
      const saved = await logo.run(() => uploadCooperativeLogo(photo), "Đã lưu logo.");
      if (saved) setData(saved);
    } catch (err) {
      openSnackbar({ text: err instanceof Error ? err.message : errorText(err), type: "error", duration: 6000 });
    }
  };

  const removeLogo = async () => {
    const saved = await logo.run(removeCooperativeLogo, "Đã gỡ logo.");
    if (saved) setData(saved);
    setRemovingLogo(false);
  };

  const text = (key: keyof Form) => (e: { target: { value: string } }) => setForm((f) => (f ? { ...f, [key]: e.target.value } : f));

  const save = async () => {
    if (!data || !form) return;
    // Backend (FARM-01) bắt buộc tên, tên viết tắt, mã số thuế, địa chỉ trụ sở và số điện thoại.
    const missing = !form.fullName.trim()
      ? "Tên HTX"
      : !form.shortName.trim() || form.shortName.trim().length > 20
        ? "Tên viết tắt"
        : !form.taxCode.trim()
          ? "Mã số thuế"
          : !form.officeAddress.trim()
            ? "Địa chỉ trụ sở"
            : !form.phoneNumber.trim()
              ? "Số điện thoại"
              : "";
    if (missing) {
      setFormError(MESSAGES.MSG01(missing));
      return;
    }
    setBusy(true);
    setFormError("");
    try {
      const saved = await updateCooperativeProfile({
        fullName: form.fullName.trim(),
        shortName: form.shortName.trim(),
        taxCode: form.taxCode.trim(),
        officeAddress: form.officeAddress.trim(),
        phoneNumber: form.phoneNumber.trim(),
        email: opt(form.email),
        website: opt(form.website),
        legalRepresentative: opt(form.legalRepresentative),
        // Không có ô nhập trên mobile: gửi lại giá trị cũ vì backend thay toàn bộ hồ sơ.
        yearEstablished: data.yearEstablished,
        socialLink: data.socialLink,
        introductionVi: data.introductionVi,
        introductionEn: data.introductionEn,
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
    <ManagePage
      title="Hồ sơ HTX"
      onBack={form ? askCancel : undefined}
      footer={
        form ? (
          <div className="sheet-actions">
            <Button fullWidth size="large" loading={busy} disabled={busy} onClick={() => void save()}>
              Lưu
            </Button>
            <Button fullWidth size="large" variant="secondary" disabled={busy} onClick={askCancel}>
              Hủy
            </Button>
          </div>
        ) : (
          data && (
            <Button
              fullWidth
              size="large"
              onClick={() => {
                setFormError("");
                setForm(formFrom(data));
              }}
            >
              Sửa hồ sơ
            </Button>
          )
        )
      }
    >
      <Loadable data={data} error={error} reload={() => void reload()}>
        {(p) =>
          form ? (
            <>
              <Section step={1} title="Thông tin chung">
                <div className="form">
                  <Input label="Tên HTX (bắt buộc)" value={form.fullName} onChange={text("fullName")} maxLength={255} disabled={busy} />
                  <Input label="Tên viết tắt (bắt buộc)" helperText="Tối đa 20 ký tự, đứng đầu tin nhắn SMS gửi khách." value={form.shortName} onChange={text("shortName")} maxLength={20} disabled={busy} />
                  <Input label="Mã số thuế (bắt buộc)" value={form.taxCode} onChange={text("taxCode")} inputMode="numeric" maxLength={20} disabled={busy} />
                  <Input label="Người đại diện pháp luật" value={form.legalRepresentative} onChange={text("legalRepresentative")} maxLength={200} disabled={busy} />
                </div>
              </Section>
              <Section step={2} title="Liên hệ">
                <div className="form">
                  <Input.TextArea label="Địa chỉ trụ sở (bắt buộc)" value={form.officeAddress} onChange={text("officeAddress")} maxLength={500} disabled={busy} />
                  <Input label="Số điện thoại (bắt buộc)" value={form.phoneNumber} onChange={text("phoneNumber")} inputMode="tel" maxLength={20} disabled={busy} />
                  <Input label="Email" value={form.email} onChange={text("email")} inputMode="email" maxLength={254} disabled={busy} />
                  <Input label="Website" value={form.website} onChange={text("website")} inputMode="url" maxLength={500} disabled={busy} />
                </div>
              </Section>
              <Section step={3} title="Ngành nghề">
                <div className="form">
                  <Input.TextArea label="Ngành nghề kinh doanh" helperText="Mỗi dòng một ngành nghề." value={form.businessLines} onChange={text("businessLines")} disabled={busy} />
                  <FormError text={formError} />
                </div>
              </Section>
            </>
          ) : (
            <>
              {p.logoUrl && (
                <div className="card coop-logo">
                  <img src={absoluteUrl(p.logoUrl) ?? ""} alt={`Logo ${p.fullName ?? "HTX"}`} />
                </div>
              )}
              <Actions>
                <Button fullWidth variant="secondary" size="large" loading={logo.busy} disabled={logo.busy} onClick={() => void pickLogo()}>
                  {p.logoUrl ? "Đổi logo" : "Thêm logo"}
                </Button>
                {p.logoUrl && (
                  <Button fullWidth variant="secondary" type="danger" size="large" disabled={logo.busy} onClick={() => setRemovingLogo(true)}>
                    Gỡ logo
                  </Button>
                )}
              </Actions>
              <Section title="Thông tin chung">
                <Facts
                  items={[
                    ["Tên HTX", p.fullName],
                    ["Tên viết tắt", p.shortName],
                    ["Năm thành lập", p.yearEstablished ? String(p.yearEstablished) : null],
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
              <p className="screen__note">Tên, địa chỉ và logo hiện trên trang truy xuất công khai. Logo đổi ngay khi tải lên.</p>
            </>
          )
        }
      </Loadable>

      <ConfirmSheet
        visible={cancelling}
        title="Bỏ các thay đổi?"
        message="Những gì vừa sửa trong hồ sơ HTX sẽ không được lưu."
        confirmText="Bỏ thay đổi"
        cancelText="Tiếp tục sửa"
        danger
        onClose={() => setCancelling(false)}
        onConfirm={() => {
          setCancelling(false);
          setForm(null);
        }}
      />

      <ConfirmSheet
        visible={removingLogo}
        title="Gỡ logo HTX?"
        message="Trang truy xuất công khai sẽ không còn hiện logo này."
        confirmText="Gỡ logo"
        danger
        busy={logo.busy}
        onClose={() => setRemovingLogo(false)}
        onConfirm={() => void removeLogo()}
      />
    </ManagePage>
  );
}

export default CooperativePage;
