import type { RaftFormScanReading, RaftFormSuggestion } from "@/features/farming/models/RaftForm";
import { useEffect, useRef, useState } from "react";
import { Button, Input, Sheet } from "zmp-ui";

import FormError from "@/components/FormError/FormError";
import { NumberInput } from "@/components/NumberInput/NumberInput";
import PhotoCapture from "@/components/PhotoCapture/PhotoCapture";
import ScanProgress from "@/components/ScanProgress/ScanProgress";
import { useScanJob } from "@/hooks/useScanJob";
import { raftFormScan, startRaftFormScan } from "@/features/farming/services/scanService";
import { parseCoordinate, readCoordinates } from "@/utils/coordinates";
import { scanPhoto } from "@/utils/imageFile";

/** Số hàng "8 hàng" → "8". Máy chủ chép nguyên chữ trên giấy, nên chỉ lấy phần số đứng đầu; không có thì giữ chữ để người dùng sửa. */
/** Chuỗi máy chủ trả về, hoặc rỗng khi không phải chuỗi. */
const str = (value: unknown): string => (typeof value === "string" ? value.trim() : "");
const laneCountOf = (text: string) => text.match(/^\d+/)?.[0] ?? text;

/** Tọa độ "21.123°" → "21.123"; không đọc được (độ-phút-giây...) thì giữ nguyên chữ để người dùng sửa tay. */
function coordinateOf(text: string, axis: "latitude" | "longitude") {
  const value = parseCoordinate(text.replace(/\s*°\s*$/, ""), axis);
  return value === null ? text : String(value);
}

/** Chữ máy chủ chép từ giấy → các ô nhập; ô giấy không ghi thì rỗng. */
const suggestionOf = (reading: RaftFormScanReading): RaftFormSuggestion => ({
  code: str(reading.code),
  size: str(reading.size),
  laneCount: laneCountOf(str(reading.laneCount)),
  location: str(reading.location),
  notes: str(reading.notes),
  latitude: coordinateOf(str(reading.latitude), "latitude"),
  longitude: coordinateOf(str(reading.longitude), "longitude"),
});

/**
 * Chụp giấy tờ của bè, máy chủ đọc bằng Gemini; kết quả chỉ điền gợi ý sau khi người dùng xem và xác nhận, không tự tạo bè.
 */
export default function RaftFormImport({ editing, disabled, onApply, onBusyChange }: {
  editing: boolean; disabled: boolean; onApply: (fields: RaftFormSuggestion) => void; onBusyChange: (busy: boolean) => void;
}) {
  const job = useScanJob<RaftFormScanReading>(startRaftFormScan, raftFormScan);
  const mounted = useRef(true);
  const [preparing, setPreparing] = useState(false);
  const [fields, setFields] = useState<RaftFormSuggestion | null>(null);
  const [error, setError] = useState("");
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, []);

  const busy = preparing || job.status === "uploading" || job.status === "reading";
  useEffect(() => { onBusyChange(busy); }, [busy, onBusyChange]);
  useEffect(() => { if (job.status === "done" && job.result) { setFields(suggestionOf(job.result)); setError(""); } }, [job.status, job.result]);

  const received = async (photo: Blob) => {
    setError("");
    setPreparing(true);
    try {
      const ready = await scanPhoto(photo);
      if (mounted.current) job.begin(ready);
    } catch (cause) {
      if (mounted.current) setError(cause instanceof Error ? cause.message : "Không mở được ảnh này. Bạn có thể nhập thông tin bằng tay.");
    } finally {
      if (mounted.current) setPreparing(false);
    }
  };
  const apply = () => {
    if (!fields) return;
    const f = fields;
    if (!editing && f.laneCount && (!/^\d+$/.test(f.laneCount) || Number(f.laneCount) < 1 || Number(f.laneCount) > 50)) { setError("Số hàng phải là số nguyên từ 1 đến 50."); return; }
    if ((f.latitude || f.longitude) && !readCoordinates(f.latitude, f.longitude)) { setError("Vui lòng kiểm tra lại cả vĩ độ và kinh độ, hoặc xóa cả hai để nhập sau."); return; }
    onApply(f); setFields(null); setError("");
  };
  const edit = (field: keyof RaftFormSuggestion, value: string) => { setError(""); setFields((current) => current && { ...current, [field]: value }); };
  return <>
    <p className="form__hint">Chụp giấy tờ có thông tin bè, ảnh được gửi lên máy chủ và đọc bằng Google Gemini rồi điền giúp. Bạn kiểm tra lại trước khi dùng.</p>
    <PhotoCapture label="Chụp giấy tờ của bè" disabled={disabled || busy} onPhoto={(photo) => void received(photo)} />
    {preparing && <p role="status" aria-live="polite">Đang chuẩn bị ảnh…</p>}
    <ScanProgress status={job.status} error={job.error} onCancel={job.cancel} onRetry={job.retry} />
    {!fields && <FormError text={error} />}
    <Sheet visible={!!fields} onClose={() => { setFields(null); setError(""); }} height="85vh" mask title="Kiểm tra thông tin từ ảnh">
      {fields && <div className="sheet-form form">
        <p className="form__intro">Thông tin chỉ được điền vào các ô nhập, chưa lưu bè. Chỉ những ô có chữ mới thay thế thông tin bạn đã nhập.</p>
        {!Object.values(fields).some(Boolean) && <p>Chưa nhận ra thông tin nào trong ảnh. Bạn có thể nhập tay hoặc chụp lại.</p>}
        <Input label="Mã bè" value={fields.code} onChange={(e) => edit("code", e.target.value)} maxLength={50} />
        <Input label="Kích thước" value={fields.size} onChange={(e) => edit("size", e.target.value)} maxLength={100} />
        {!editing && <NumberInput label="Số hàng" value={fields.laneCount} onChange={(value) => edit("laneCount", value)} />}
        {editing && <p className="form__hint">Số hàng và bố trí hàng hiện có được giữ nguyên khi nhập ảnh.</p>}
        <Input label="Vị trí" value={fields.location} onChange={(e) => edit("location", e.target.value)} maxLength={500} />
        <Input.TextArea label="Ghi chú tình trạng" value={fields.notes} onChange={(e) => edit("notes", e.target.value)} maxLength={1000} />
        <Input label="Vĩ độ (nếu giấy có ghi)" value={fields.latitude} onChange={(e) => edit("latitude", e.target.value)} inputMode="decimal" />
        <Input label="Kinh độ (nếu giấy có ghi)" value={fields.longitude} onChange={(e) => edit("longitude", e.target.value)} inputMode="decimal" />
        <FormError text={error} />
        <Button fullWidth size="large" disabled={!Object.values(fields).some((value) => value.trim())} onClick={apply}>Dùng các thông tin này</Button>
      </div>}
    </Sheet>
  </>;
}
