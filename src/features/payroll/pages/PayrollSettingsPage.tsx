import type { PayrollSettingsPreview } from "@/features/payroll/models/PayrollSettings";
import { useEffect, useState } from "react";
import { Button, Select, Sheet, Switch } from "zmp-ui";
import { Facts } from "@/components/Facts/Facts";
import FormError from "@/components/FormError/FormError";
import { Loadable } from "@/components/Loadable/Loadable";
import { ManagePage } from "@/components/ManagePage/ManagePage";
import { Section } from "@/components/Section/Section";
import PayrollGate from "@/features/payroll/components/PayrollGate/PayrollGate";
import { getPayrollSettings, previewPayrollSettings, savePayrollSettings } from "@/features/payroll/services/payrollService";
import { payPeriodText } from "@/features/payroll/utils/payText";
import { useLoad } from "@/hooks/useLoad";
import { isApiError } from "@/services/errors";
import { errorText } from "@/utils/errorText";
import "@/features/payroll/styles/payroll.scss";

/** Ngày bắt đầu kỳ lương: 1 đến 28, có trong mọi tháng (BR-LABOR-13). */
const START_DAYS = Array.from({ length: 28 }, (_, i) => i + 1);

export default function PayrollSettingsPage() {
  return <PayrollGate mode="owner" title="Cài đặt lương"><SettingsContent /></PayrollGate>;
}

/**
 * Cài đặt lương (LABOR-16, chỉ Chủ HTX): ngày bắt đầu kỳ lương và tự tạo bảng lương. Trước khi lưu, app hỏi server hai kỳ lương
 * kế tiếp theo cài đặt đang chọn và hỏi lại (MSG-LABOR-36). Bảng lương đã lập giữ nguyên kỳ cũ; ngày bắt đầu mới áp dụng từ
 * sau kỳ cuối cùng đã có bảng lương (BR-LABOR-13).
 */
function SettingsContent() {
  const settings = useLoad(getPayrollSettings, []);
  const [startDay, setStartDay] = useState(1);
  const [automatic, setAutomatic] = useState(false);
  const [prefilled, setPrefilled] = useState(false);
  const [preview, setPreview] = useState<PayrollSettingsPreview | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Điền sẵn cài đặt đang lưu một lần, để Chủ HTX chỉ sửa phần cần đổi.
  useEffect(() => {
    const current = settings.data;
    if (!current || prefilled) return;
    setPrefilled(true);
    setStartDay(current.payPeriodStartDay);
    setAutomatic(current.automaticPayroll);
  }, [settings.data, prefilled]);

  const ask = async () => {
    setBusy(true);
    setError("");
    setSuccess("");
    try {
      setPreview(await previewPayrollSettings(startDay, automatic));
    } catch (err) {
      setError(errorText(err));
    } finally {
      setBusy(false);
    }
  };

  const save = async () => {
    const rowVersion = settings.data?.rowVersion;
    if (!rowVersion) return;
    setBusy(true);
    setError("");
    try {
      const saved = await savePayrollSettings({ payPeriodStartDay: startDay, automaticPayroll: automatic, rowVersion });
      settings.setData(saved.settings);
      setPreview(null);
      setSuccess("Đã lưu cài đặt lương.");
    } catch (err) {
      setPreview(null);
      setError(errorText(err));
      // MSG06: cài đặt vừa được lưu ở nơi khác; tải bản mới và điền lại.
      if (isApiError(err, "MSG06")) { setPrefilled(false); void settings.reload(); }
    } finally {
      setBusy(false);
    }
  };

  const close = () => { if (!busy) setPreview(null); };

  return (
    <ManagePage title="Cài đặt lương">
      <Loadable data={settings.data} error={settings.error} reload={() => void settings.reload()}>
        {(s) => (
          <>
            <Section title="Đang áp dụng">
              <Facts items={[
                ["Ngày bắt đầu kỳ lương", `Ngày ${s.payPeriodStartDay} hằng tháng`],
                ["Tự tạo bảng lương", s.automaticPayroll ? "Bật" : "Tắt"],
                ["Kỳ lương kế tiếp", s.nextPeriods.map(payPeriodText).join("; ")],
              ]} />
            </Section>
            <Section title="Sửa cài đặt">
              <div className="card form">
                <p className="form__intro">Kỳ lương đặt tên theo tháng của ngày cuối kỳ. Ví dụ bắt đầu ngày 26: kỳ 26/09 đến 25/10 là kỳ 10. Bảng lương đã lập giữ nguyên kỳ cũ.</p>
                <Select label="Ngày bắt đầu kỳ lương" value={startDay} onChange={(v) => { setStartDay(Number(v)); setSuccess(""); }} closeOnSelect disabled={busy}>
                  {START_DAYS.map((d) => <Select.Option key={d} value={d} title={`Ngày ${d}`} />)}
                </Select>
                <Switch label="Tự tạo bảng lương khi bắt đầu mỗi kỳ mới" checked={automatic} disabled={busy} onChange={(e) => { setAutomatic(e.target.checked); setSuccess(""); }} />
                <Button fullWidth size="large" loading={busy && !preview} disabled={busy} onClick={() => void ask()}>Lưu cài đặt</Button>
                <FormError text={preview ? "" : error} />
                {success && <p className="payroll-note" role="status">{success}</p>}
              </div>
            </Section>
          </>
        )}
      </Loadable>
      <Sheet visible={preview !== null} onClose={close} autoHeight mask handler maskClosable={!busy} title="Lưu cài đặt lương?">
        <div className="sheet-form form">
          {preview && preview.nextPeriods.length >= 2 && (
            <p className="payroll-question">
              Với cài đặt này, hai kỳ lương kế tiếp là {payPeriodText(preview.nextPeriods[0])} và {payPeriodText(preview.nextPeriods[1])}
              {preview.automaticPayroll ? ", và OMTS tự tạo bảng lương của mỗi kỳ mới vào ngày đầu kỳ" : ""}. Bạn có muốn lưu?
            </p>
          )}
          <FormError text={error} />
          <div className="sheet-actions">
            <Button fullWidth size="large" loading={busy} disabled={busy} onClick={() => void save()}>Có, lưu cài đặt</Button>
            <Button fullWidth size="large" variant="secondary" disabled={busy} onClick={close}>Không, quay lại</Button>
          </div>
        </div>
      </Sheet>
    </ManagePage>
  );
}
