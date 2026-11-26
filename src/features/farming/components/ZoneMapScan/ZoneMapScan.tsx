import type { BoundaryScanReading, CornerTableReading } from "@/features/farming/models/ZoneBoundary";
import { useEffect, useRef, useState } from "react";

import FormError from "@/components/FormError/FormError";
import PhotoCapture from "@/components/PhotoCapture/PhotoCapture";
import ScanProgress from "@/components/ScanProgress/ScanProgress";
import { useScanJob } from "@/hooks/useScanJob";
import { boundaryScan, startBoundaryScan } from "@/features/farming/services/scanService";
import { toCornerTableReading } from "@/features/farming/utils/boundaryScan";
import { scanPhoto } from "@/utils/imageFile";

/**
 * Đọc các bảng "Tọa độ các điểm góc" từ ảnh sơ đồ cấp phép: một lần chạm mở camera, chụp xong ảnh được thu nhỏ, gửi lên máy chủ
 * đọc bằng Gemini rồi hỏi kết quả. Không có bước khung hay xoay ảnh. Kết quả chỉ được đưa lên màn hình để người dùng đối chiếu,
 * chưa lưu gì; lỗi nào cũng để nguyên phần nhập tay.
 */
export default function ZoneMapScan({ zoneId, disabled, onRead, onBusyChange }: {
  zoneId: string;
  disabled: boolean;
  onRead: (reading: CornerTableReading) => void;
  onBusyChange: (busy: boolean) => void;
}) {
  const job = useScanJob<BoundaryScanReading>(
    (photo, signal) => startBoundaryScan(zoneId, photo, signal),
    (scanId, signal) => boundaryScan(zoneId, scanId, signal),
  );
  const [preparing, setPreparing] = useState(false);
  const [prepareError, setPrepareError] = useState("");
  const mounted = useRef(true);
  const onReadRef = useRef(onRead);
  useEffect(() => { onReadRef.current = onRead; });
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, []);

  const busy = preparing || job.status === "uploading" || job.status === "reading";
  useEffect(() => { onBusyChange(busy); }, [busy, onBusyChange]);
  useEffect(() => { if (job.status === "done" && job.result) onReadRef.current(toCornerTableReading(job.result)); }, [job.status, job.result]);

  const received = async (photo: Blob) => {
    setPrepareError("");
    setPreparing(true);
    try {
      const ready = await scanPhoto(photo);
      if (mounted.current) job.begin(ready);
    } catch (cause) {
      if (mounted.current) setPrepareError(cause instanceof Error ? cause.message : "Không mở được ảnh này. Vui lòng chụp lại hoặc nhập bằng tay.");
    } finally {
      if (mounted.current) setPreparing(false);
    }
  };

  return <>
    <p className="form__hint">
      Chụp rõ các bảng “Tọa độ các điểm góc” trên giấy phép. Ảnh được gửi lên máy chủ và đọc bằng Google Gemini; chỉ đọc bảng tọa độ các
      điểm góc. Bạn đối chiếu lại từng điểm với giấy trước khi lưu.
    </p>
    <PhotoCapture label="Chụp bản đồ giấy phép" disabled={disabled || busy} onPhoto={(photo) => void received(photo)} />
    {preparing && <p role="status" aria-live="polite">Đang chuẩn bị ảnh…</p>}
    <ScanProgress status={job.status} error={job.error} onCancel={job.cancel} onRetry={job.retry} />
    <FormError text={prepareError} />
  </>;
}
