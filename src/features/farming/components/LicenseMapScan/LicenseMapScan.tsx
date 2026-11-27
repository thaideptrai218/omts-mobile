import type { LicenseMapReading } from "@/features/farming/models/ZoneBoundary";
import { useEffect, useRef, useState } from "react";
import { Button } from "zmp-ui";

import FormError from "@/components/FormError/FormError";
import { scanLicenseMap, ZoneMapScanError } from "@/features/farming/services/zoneMapScanService";
import { choosePhoto, zaloAvailable } from "@/services/zaloService";
import { errorText } from "@/utils/errorText";

/**
 * Đọc sơ đồ cấp phép khu vực biển khi vùng chưa được tạo: chụp hoặc chọn ảnh cả tờ sơ đồ, máy chủ đọc bảng thông tin và các bảng
 * "Tọa độ các điểm góc" (30 giây đến 2 phút). Kết quả chỉ được đưa lên màn hình để người dùng đối chiếu, chưa lưu gì.
 */
export default function LicenseMapScan({ disabled, onRead, onBusyChange }: {
  disabled: boolean;
  onRead: (reading: LicenseMapReading) => void;
  onBusyChange: (busy: boolean) => void;
}) {
  const input = useRef<HTMLInputElement>(null);
  const controller = useRef<AbortController | null>(null);
  const mounted = useRef(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => { mounted.current = true; return () => { mounted.current = false; controller.current?.abort(); }; }, []);

  const read = async (photo: Blob) => {
    if (busy) return;
    controller.current = new AbortController();
    setError(""); setBusy(true); onBusyChange(true);
    try {
      const reading = await scanLicenseMap(photo, controller.current.signal);
      if (mounted.current) onRead(reading);
    } catch (cause) {
      if (mounted.current && !(cause instanceof DOMException && cause.name === "AbortError")) setError(cause instanceof ZoneMapScanError ? cause.message : errorText(cause));
    } finally { if (mounted.current) { setBusy(false); onBusyChange(false); } }
  };

  const choose = async () => {
    setError("");
    if (!(await zaloAvailable())) { input.current?.click(); return; }
    try { const photo = await choosePhoto(); if (photo) await read(photo); }
    catch { setError("Chưa chọn được ảnh. Bạn có thể thử lại hoặc bỏ qua bước này."); }
  };

  return <>
    <p className="form__hint">Chụp hoặc chọn ảnh sơ đồ khu vực biển đề nghị cấp phép: thấy rõ bảng thông tin và các bảng “Tọa độ các điểm góc”. Ảnh được gửi tới máy chủ OMTS để đọc, không lưu vào hồ sơ vùng, và bạn đối chiếu lại từng điểm trước khi lưu.</p>
    <input ref={input} type="file" accept="image/jpeg,image/png" hidden onChange={(event) => { const file = event.target.files?.[0]; event.target.value = ""; if (file) void read(file); }} />
    <Button fullWidth size="large" variant="secondary" disabled={disabled || busy} onClick={() => void choose()}>Chụp hoặc chọn ảnh sơ đồ</Button>
    {busy && <>
      <p role="status" aria-live="polite">Đang đọc sơ đồ, thường mất từ nửa phút đến vài phút. Vui lòng chờ…</p>
      <Button fullWidth variant="secondary" onClick={() => controller.current?.abort()}>Hủy đọc ảnh</Button>
    </>}
    <FormError text={error} />
  </>;
}
