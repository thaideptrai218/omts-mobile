import { useEffect, useRef, useState } from "react";
import { Button, Input, Sheet } from "zmp-ui";

import FormError from "@/components/form-error";
import { NumberInput } from "@/components/manage/ui";
import { readCoordinates } from "@/services/coordinates";
import { type RaftFormSuggestion, recognizeRaftForm } from "@/services/raft-form-ocr";
import { chooseRaftFormImage, zaloAvailable } from "@/services/zalo";

/** Nhận dạng chỉ điền gợi ý sau khi người dùng xem và xác nhận, không tự tạo bè. */
export default function RaftFormImport({ editing, disabled, onApply, onBusyChange }: {
  editing: boolean; disabled: boolean; onApply: (fields: RaftFormSuggestion) => void; onBusyChange: (busy: boolean) => void;
}) {
  const input = useRef<HTMLInputElement>(null);
  const controller = useRef<AbortController | null>(null);
  const mounted = useRef(true);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState("");
  const [result, setResult] = useState<Awaited<ReturnType<typeof recognizeRaftForm>> | null>(null);
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; controller.current?.abort(); }; }, []);
  const read = async (image: File | string) => {
    if (busy) return;
    controller.current = new AbortController();
    setError(""); setProgress(0); setBusy(true); onBusyChange(true);
    try {
      const output = await recognizeRaftForm(image, controller.current.signal, (value) => mounted.current && setProgress(value));
      if (mounted.current) setResult(output);
    } catch (cause) {
      if (mounted.current && !(cause instanceof DOMException && cause.name === "AbortError")) setError(cause instanceof Error ? cause.message : "Chưa đọc được ảnh. Bạn có thể nhập thông tin bằng tay.");
    } finally { if (mounted.current) { setBusy(false); onBusyChange(false); } }
  };
  const choose = async () => {
    setError("");
    if (!(await zaloAvailable())) { input.current?.click(); return; }
    try { const image = await chooseRaftFormImage(); if (image) await read(image); }
    catch { setError("Chưa chọn được ảnh. Bạn có thể thử lại hoặc nhập bằng tay."); }
  };
  const apply = () => {
    if (!result) return;
    const f = result.fields;
    if (!editing && f.laneCount && (!/^\d+$/.test(f.laneCount) || Number(f.laneCount) < 1 || Number(f.laneCount) > 50)) { setError("Số hàng phải là số nguyên từ 1 đến 50."); return; }
    if ((f.latitude || f.longitude) && !readCoordinates(f.latitude, f.longitude)) { setError("Vui lòng kiểm tra lại cả vĩ độ và kinh độ, hoặc xóa cả hai để nhập sau."); return; }
    onApply(f); setResult(null); setError("");
  };
  const edit = (field: keyof RaftFormSuggestion, value: string) => { setError(""); setResult((current) => current && ({ ...current, fields: { ...current.fields, [field]: value } })); };
  return <>
    <p className="form__hint">Chọn ảnh giấy/biểu mẫu có thông tin bè. OCR phù hợp chữ in rõ; chữ viết tay có thể đọc sai. Ảnh được xử lý trên thiết bị, bạn kiểm tra trước khi áp dụng.</p>
    <input ref={input} type="file" accept="image/*" hidden onChange={(event) => { const file = event.target.files?.[0]; event.target.value = ""; if (file) void read(file); }} />
    <Button fullWidth size="large" variant="secondary" disabled={disabled || busy} onClick={() => void choose()}>Đọc biểu mẫu bằng OCR</Button>
    {busy && <><p role="status" aria-live="polite">Đang chuẩn bị hoặc đọc ảnh… {progress}%</p><Button fullWidth variant="secondary" onClick={() => controller.current?.abort()}>Hủy đọc ảnh</Button></>}
    {!result && <FormError text={error} />}
    <Sheet visible={!!result} onClose={() => { setResult(null); setError(""); }} height="85vh" mask title="Kiểm tra thông tin từ ảnh">
      {result && <div className="sheet-form form">
        <p className="form__intro">Thông tin chỉ được điền vào form, chưa lưu bè. Chỉ các ô có giá trị mới thay thế thông tin bạn đã nhập.</p>
        {result.confidence < 70 && <p role="alert">Ảnh khó đọc. Vui lòng đối chiếu từng ô với giấy gốc.</p>}
        {!Object.values(result.fields).some(Boolean) && <p>Chưa nhận ra nhãn trường. Bạn có thể nhập lại từ phần chữ đọc được bên dưới.</p>}
        <Input label="Mã bè" value={result.fields.code} onChange={(e) => edit("code", e.target.value)} maxLength={50} />
        <Input label="Kích thước" value={result.fields.size} onChange={(e) => edit("size", e.target.value)} maxLength={100} />
        {!editing && <><NumberInput label="Số hàng" value={result.fields.laneCount} onChange={(value) => edit("laneCount", value)} /><NumberInput decimal label="Dài mỗi hàng (m)" value={result.fields.laneLength} onChange={(value) => edit("laneLength", value)} /></>}
        {editing && <p className="form__hint">Số hàng và bố trí hàng hiện có được giữ nguyên khi nhập ảnh.</p>}
        <Input label="Vị trí" value={result.fields.location} onChange={(e) => edit("location", e.target.value)} maxLength={500} />
        <Input.TextArea label="Ghi chú tình trạng" value={result.fields.notes} onChange={(e) => edit("notes", e.target.value)} maxLength={1000} />
        <Input label="Vĩ độ (nếu giấy có ghi)" value={result.fields.latitude} onChange={(e) => edit("latitude", e.target.value)} inputMode="decimal" />
        <Input label="Kinh độ (nếu giấy có ghi)" value={result.fields.longitude} onChange={(e) => edit("longitude", e.target.value)} inputMode="decimal" />
        <details><summary>Chữ đọc được từ ảnh</summary><pre style={{ whiteSpace: "pre-wrap", fontSize: "1rem" }}>{result.text || "Không đọc được chữ."}</pre></details>
        <FormError text={error} />
        <Button fullWidth size="large" disabled={!Object.values(result.fields).some((value) => value.trim())} onClick={apply}>Áp dụng vào form</Button>
      </div>}
    </Sheet>
  </>;
}
