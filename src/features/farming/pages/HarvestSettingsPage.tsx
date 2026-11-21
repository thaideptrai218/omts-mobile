import type { AutoClosePreview, HarvestSettingsDraft, HarvestSettingsView } from "@/features/farming/models/HarvestSettings";
import { useEffect, useState } from "react";
import { Button, useSnackbar } from "zmp-ui";

import { ConfirmSheet } from "@/components/ConfirmSheet/ConfirmSheet";
import { Facts } from "@/components/Facts/Facts";
import FormError from "@/components/FormError/FormError";
import { Loadable } from "@/components/Loadable/Loadable";
import { ManagePage } from "@/components/ManagePage/ManagePage";
import { NumberInput } from "@/components/NumberInput/NumberInput";
import { autoClosePreview, getHarvestSettings, HARVEST_SETTINGS_LIMITS, harvestSettingsError, saveHarvestSettings } from "@/features/farming/services/harvestSettingsService";
import { useLoad } from "@/hooks/useLoad";
import { isApiError } from "@/services/errors";
import { errorText } from "@/utils/errorText";
import { num, parseNumber } from "@/utils/format";

const draftOf = (s: HarvestSettingsView): HarvestSettingsDraft => ({
  averageKgPerCage: String(s.averageKgPerCage).replace(".", ","),
  daysBeforeAutoClose: String(s.daysBeforeAutoClose),
});

/** Câu hỏi trước khi lưu (HARVEST-03 bước 4): giảm số ngày thì báo số lô đang bán sẽ bị đóng (MSG-HARVEST-03). */
function question(preview: AutoClosePreview | null, kg: number, days: number) {
  if (preview?.lowered) {
    return `Với ${num(preview.days)} ngày, lần kiểm tra đóng lô hằng ngày tiếp theo sẽ đóng ${num(preview.lotCount)} lô đang bán. Bạn có muốn lưu không?`;
  }
  return `Lưu ${num(kg)} kg mỗi lồng và ${num(days)} ngày tự đóng lô?`;
}

/**
 * Cài đặt lô hàu (HARVEST-03, SCR-HARVEST-02), chỉ Chủ HTX (BR-HARVEST-06). Kg trung bình mỗi lồng chỉ dùng cho lô ghi
 * sau, lô đã ghi giữ số của nó; số ngày tự đóng lô áp dụng cho mọi lô đang bán từ lần kiểm tra hằng ngày tiếp theo.
 * Luôn hỏi lại trước khi lưu, kèm số lô sẽ bị đóng khi giảm số ngày.
 */
export default function HarvestSettingsPage() {
  const { openSnackbar } = useSnackbar();
  const settings = useLoad(getHarvestSettings, []);
  const [draft, setDraft] = useState<HarvestSettingsDraft>({ averageKgPerCage: "", daysBeforeAutoClose: "" });
  const [preview, setPreview] = useState<AutoClosePreview | null>(null);
  const [asking, setAsking] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (settings.data) setDraft(draftOf(settings.data));
  }, [settings.data]);

  const current = settings.data;
  const kg = parseNumber(draft.averageKgPerCage);
  const days = parseNumber(draft.daysBeforeAutoClose);
  const changed = !!current && (kg !== current.averageKgPerCage || days !== current.daysBeforeAutoClose);

  const review = async () => {
    if (!current) return;
    const problem = harvestSettingsError(draft);
    setError(problem);
    if (problem) return;
    setPreview(null);
    if (days !== null && days !== current.daysBeforeAutoClose) {
      setBusy(true);
      try {
        setPreview(await autoClosePreview(days));
      } catch (err) {
        setError(errorText(err));
        return;
      } finally {
        setBusy(false);
      }
    }
    setAsking(true);
  };

  const save = async () => {
    if (!current) return;
    setBusy(true);
    try {
      const saved = await saveHarvestSettings(current, draft);
      settings.setData(saved.settings);
      setAsking(false);
      openSnackbar({ text: "Đã lưu cài đặt lô hàu.", type: "success", duration: 4000 });
    } catch (err) {
      setAsking(false);
      setError(errorText(err));
      // Người khác vừa lưu cài đặt hoặc hồ sơ HTX (MSG06): tải bản mới để Chủ HTX xem rồi nhập lại.
      if (isApiError(err, "MSG06")) void settings.reload();
    } finally {
      setBusy(false);
    }
  };

  return (
    <ManagePage
      title="Cài đặt lô hàu"
      footer={
        current ? (
          <Button fullWidth size="large" loading={busy} disabled={busy || !changed} onClick={() => void review()}>
            Lưu cài đặt
          </Button>
        ) : undefined
      }
    >
      <Loadable data={current} error={settings.error} reload={() => void settings.reload()}>
        {(s) => (
          <>
            <Facts
              items={[
                ["Đang dùng: kg trung bình mỗi lồng", num(s.averageKgPerCage, "kg")],
                ["Đang dùng: số ngày tự đóng lô", num(s.daysBeforeAutoClose, "ngày")],
              ]}
            />
            <div className="card form">
              <NumberInput
                label="Số kg trung bình mỗi lồng (bắt buộc)"
                value={draft.averageKgPerCage}
                onChange={(averageKgPerCage) => { setDraft((d) => ({ ...d, averageKgPerCage })); setError(""); }}
                disabled={busy}
                helperText="Dùng để ước tính kg của lô ghi sau khi lưu. Lô đã ghi giữ số kg mỗi lồng của nó."
                decimal
              />
              <NumberInput
                label="Số ngày tự đóng lô (bắt buộc)"
                value={draft.daysBeforeAutoClose}
                onChange={(daysBeforeAutoClose) => { setDraft((d) => ({ ...d, daysBeforeAutoClose })); setError(""); }}
                disabled={busy}
                helperText={`Lô đang bán quá số ngày này được đóng ở lần kiểm tra hằng ngày tiếp theo. Từ ${HARVEST_SETTINGS_LIMITS.minDays} đến ${HARVEST_SETTINGS_LIMITS.maxDays} ngày.`}
              />
              <FormError text={error} />
            </div>
          </>
        )}
      </Loadable>

      <ConfirmSheet
        visible={asking}
        title="Lưu cài đặt lô hàu?"
        message={
          <div className="form">
            <p>{question(preview, kg ?? 0, days ?? 0)}</p>
            <p className="form__hint">Số kg mỗi lồng mới chỉ dùng cho lô ghi sau. Số ngày mới áp dụng cho mọi lô đang bán.</p>
          </div>
        }
        confirmText="Lưu cài đặt"
        busy={busy}
        danger={!!preview?.lowered && preview.lotCount > 0}
        onClose={() => setAsking(false)}
        onConfirm={() => void save()}
      />
    </ManagePage>
  );
}
