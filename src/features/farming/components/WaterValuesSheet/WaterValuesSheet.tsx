import type { WaterThresholds, WaterValues } from "@/features/farming/models/WaterMeasurement";
import { useEffect, useState } from "react";
import { Button, Input, Select, Sheet } from "zmp-ui";

import FormError from "@/components/FormError/FormError";
import { NumberInput } from "@/components/NumberInput/NumberInput";
import { MESSAGES } from "@/constants/messages";
import { useLoad } from "@/hooks/useLoad";
import { errorText } from "@/utils/errorText";
import { fromLocalInput, parseNumber, toLocalInput } from "@/utils/format";
import { listRafts, USAGE } from "@/features/farming/services/farmService";
import { valuesOutside } from "@/features/farming/utils/waterText";

export type WaterInitial = {
  measuredAt: string;
  ph?: number | null;
  salinity?: number | null;
  temperature?: number | null;
};

const text = (n: number | null | undefined) => (n === null || n === undefined ? "" : String(n).replace(".", ","));

/**
 * Ghi số đo nước của một vùng: bè, thời điểm đo, pH, độ mặn, nhiệt độ (đều bắt buộc). Số nằm ngoài ngưỡng của vùng thì
 * báo trước khi lưu, vẫn cho lưu (backend gửi cảnh báo).
 */
export function WaterValuesSheet({
  visible,
  title,
  zoneId,
  initial,
  notice,
  thresholds,
  saveText,
  onClose,
  onSave,
}: {
  visible: boolean;
  title: string;
  zoneId: string;
  initial: WaterInitial;
  notice?: string;
  thresholds?: WaterThresholds | null;
  saveText: string;
  onClose: () => void;
  onSave: (values: WaterValues) => Promise<void>;
}) {
  const rafts = useLoad(() => listRafts(zoneId, USAGE.inUse), [zoneId]);
  const [raftId, setRaftId] = useState("");
  const [measuredAt, setMeasuredAt] = useState(toLocalInput(initial.measuredAt));
  const [ph, setPh] = useState(text(initial.ph));
  const [salinity, setSalinity] = useState(text(initial.salinity));
  const [temperature, setTemperature] = useState(text(initial.temperature));
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  // Chỉ có một bè đang dùng thì chọn sẵn bè đó.
  useEffect(() => {
    if (!raftId && rafts.data?.length === 1) setRaftId(rafts.data[0].id);
  }, [raftId, rafts.data]);

  const values = { ph: parseNumber(ph), salinity: parseNumber(salinity), temperature: parseNumber(temperature) };
  const outside = valuesOutside(thresholds, values);
  const options = (rafts.data ?? []).map((r) => ({ id: r.id, code: r.code ?? "" }));

  const save = async () => {
    if (!raftId) return setError(MESSAGES.MSG01("Bè"));
    if (!measuredAt) return setError(MESSAGES.MSG01("Thời điểm đo"));
    if (values.ph === null) return setError(MESSAGES.MSG01("Độ pH"));
    if (values.salinity === null) return setError(MESSAGES.MSG01("Độ mặn"));
    if (values.temperature === null) return setError(MESSAGES.MSG01("Nhiệt độ"));
    setError("");
    setBusy(true);
    try {
      await onSave({ raftId, measuredAt: fromLocalInput(measuredAt), ph: values.ph, salinity: values.salinity, temperature: values.temperature });
    } catch (err) {
      setError(errorText(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Sheet visible={visible} onClose={onClose} autoHeight mask handler swipeToClose={!busy} maskClosable={!busy} title={title}>
      <div className="sheet-form form">
        {notice && <p className="form__intro">{notice}</p>}
        <Select label="Bè (bắt buộc)" placeholder={rafts.data ? "Chọn bè" : "Đang tải bè..."} value={raftId || undefined} onChange={(v) => setRaftId(String(v))} closeOnSelect disabled={busy}>
          {options.map((r) => (
            <Select.Option key={r.id} value={r.id} title={r.code} />
          ))}
        </Select>
        {rafts.error && <FormError text={rafts.error} />}
        <Input label="Thời điểm đo (bắt buộc)" type={"datetime-local" as never} value={measuredAt} onChange={(e) => setMeasuredAt(e.target.value)} disabled={busy} />
        <NumberInput decimal label="Độ pH (bắt buộc)" value={ph} onChange={setPh} disabled={busy} />
        <NumberInput decimal label="Độ mặn ‰ (bắt buộc)" value={salinity} onChange={setSalinity} disabled={busy} />
        <NumberInput decimal label="Nhiệt độ °C (bắt buộc)" value={temperature} onChange={setTemperature} disabled={busy} />
        {outside.length > 0 && (
          <p className="form__hint" role="status">
            Ngoài ngưỡng của vùng: {outside.join(", ")}. Lưu xong app sẽ gửi cảnh báo.
          </p>
        )}
        <FormError text={error} />
        <div className="sheet-actions">
          <Button fullWidth size="large" loading={busy} disabled={busy} onClick={() => void save()}>
            {saveText}
          </Button>
          <Button fullWidth variant="secondary" size="large" disabled={busy} onClick={onClose}>
            Quay lại
          </Button>
        </div>
      </div>
    </Sheet>
  );
}
