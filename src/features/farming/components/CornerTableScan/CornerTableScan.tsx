import type { CornerTableReading } from "@/features/farming/models/ZoneBoundary";
import type { FrameRect, QuarterTurns } from "@/models/FrameRect";
import { useEffect, useRef, useState } from "react";
import { Button, Sheet } from "zmp-ui";

import FormError from "@/components/FormError/FormError";
import { ImageFrame } from "@/components/ImageFrame/ImageFrame";
import { readCornerTable } from "@/features/farming/services/zoneMapOcrService";
import { choosePhoto, zaloAvailable } from "@/services/zaloService";
import { rotatedPreview } from "@/utils/imageFile";

const START: FrameRect = { left: 0.05, top: 0.05, right: 0.95, bottom: 0.95 };

/**
 * Đọc bảng "Tọa độ các điểm góc" từ ảnh sơ đồ cấp phép: chụp hoặc chọn ảnh, xoay cho chữ nằm ngang, kéo khung quanh bảng
 * rồi đọc ngay trên điện thoại. Kết quả chỉ được đưa lên màn hình để người dùng đối chiếu, chưa lưu gì.
 */
export default function CornerTableScan({ disabled, onRead, onBusyChange }: {
  disabled: boolean;
  onRead: (reading: CornerTableReading) => void;
  onBusyChange: (busy: boolean) => void;
}) {
  const input = useRef<HTMLInputElement>(null);
  const controller = useRef<AbortController | null>(null);
  const mounted = useRef(true);
  const [photo, setPhoto] = useState<Blob | null>(null);
  const [turns, setTurns] = useState<QuarterTurns>(0);
  const [preview, setPreview] = useState("");
  const [frame, setFrame] = useState<FrameRect>(START);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState("");

  useEffect(() => { mounted.current = true; return () => { mounted.current = false; controller.current?.abort(); }; }, []);

  // Ảnh xem trước đã xoay; mỗi lần xoay thì khung về lại gần hết ảnh.
  useEffect(() => {
    if (!photo) return undefined;
    let url = "";
    let cancelled = false;
    setPreview("");
    setFrame(START);
    rotatedPreview(photo, turns)
      .then((blob) => { if (!cancelled) { url = URL.createObjectURL(blob); setPreview(url); } })
      .catch(() => { if (!cancelled) { setPhoto(null); setError("Không mở được ảnh này. Vui lòng chụp lại hoặc chọn ảnh khác."); } });
    return () => { cancelled = true; if (url) URL.revokeObjectURL(url); };
  }, [photo, turns]);

  const open = (image: Blob) => { setError(""); setTurns(0); setPhoto(image); };

  const choose = async () => {
    setError("");
    if (!(await zaloAvailable())) { input.current?.click(); return; }
    try { const image = await choosePhoto(); if (image) open(image); }
    catch { setError("Chưa chọn được ảnh. Bạn có thể thử lại hoặc nhập bằng tay."); }
  };

  const read = async () => {
    if (!photo || busy) return;
    const image = photo;
    setPhoto(null);
    controller.current = new AbortController();
    setError(""); setProgress(0); setBusy(true); onBusyChange(true);
    try {
      const reading = await readCornerTable(image, frame, turns, controller.current.signal, (value) => mounted.current && setProgress(value));
      if (mounted.current) onRead(reading);
    } catch (cause) {
      if (mounted.current && !(cause instanceof DOMException && cause.name === "AbortError")) setError(cause instanceof Error ? cause.message : "Chưa đọc được ảnh. Bạn có thể nhập tọa độ bằng tay.");
    } finally { if (mounted.current) { setBusy(false); onBusyChange(false); } }
  };

  return <>
    <p className="form__hint">Chụp rõ bảng “Tọa độ các điểm góc” trên sơ đồ cấp phép. Ảnh được đọc ngay trên điện thoại này, không gửi đi đâu, và bạn đối chiếu lại từng điểm trước khi lưu.</p>
    <input ref={input} type="file" accept="image/*" hidden onChange={(event) => { const file = event.target.files?.[0]; event.target.value = ""; if (file) open(file); }} />
    <Button fullWidth size="large" variant="secondary" disabled={disabled || busy} onClick={() => void choose()}>Chụp hoặc chọn ảnh sơ đồ</Button>
    {busy && <>
      <p role="status" aria-live="polite">Đang chuẩn bị hoặc đọc bảng tọa độ… {progress}%</p>
      <Button fullWidth variant="secondary" onClick={() => controller.current?.abort()}>Hủy đọc ảnh</Button>
    </>}
    <FormError text={error} />
    <Sheet visible={!!photo} onClose={() => setPhoto(null)} height="92vh" mask handler swipeToClose={false} title="Chọn bảng tọa độ">
      <div className="sheet-form form">
        <p className="form__intro">
          Bấm Xoay ảnh cho tới khi chữ trong bảng nằm ngang. Sau đó kéo khung trắng bao quanh bảng tọa độ (bao được nhiều bảng một
          lúc); khung càng sát bảng thì đọc càng nhanh và đúng.
        </p>
        {preview ? <ImageFrame src={preview} alt="Ảnh sơ đồ vừa chọn" frame={frame} onChange={setFrame} /> : <div className="skeleton skeleton--form" aria-busy />}
        <div className="sheet-actions">
          <Button fullWidth size="large" disabled={!preview} onClick={() => void read()}>Đọc tọa độ trong khung</Button>
          <Button fullWidth size="large" variant="secondary" disabled={!preview} onClick={() => setTurns((value) => ((value + 1) % 4) as QuarterTurns)}>Xoay ảnh 90°</Button>
        </div>
      </div>
    </Sheet>
  </>;
}
