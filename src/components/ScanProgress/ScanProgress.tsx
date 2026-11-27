import type { ScanStatus } from "@/models/Scan";
import { Button } from "zmp-ui";

import FormError from "@/components/FormError/FormError";

/**
 * Tình trạng một lần đọc ảnh trên máy chủ: đang gửi, đang đọc (có nút Hủy), hoặc lỗi kèm "Thử lại". Lỗi luôn nhắc nhập tay vẫn
 * dùng được, và phần nhập tay của trang không bị khóa vì lỗi.
 */
export default function ScanProgress({ status, error, onCancel, onRetry }: {
  status: ScanStatus;
  error: string;
  onCancel: () => void;
  onRetry: () => void;
}) {
  if (status === "uploading" || status === "reading") {
    return <>
      <p role="status" aria-live="polite">{status === "uploading" ? "Đang gửi ảnh…" : "Đang đọc ảnh… (thường 20–60 giây)"}</p>
      <Button fullWidth variant="secondary" onClick={onCancel}>Hủy đọc ảnh</Button>
    </>;
  }
  if (status === "failed") {
    return <>
      <FormError text={error} />
      <Button fullWidth variant="secondary" onClick={onRetry}>Thử lại với ảnh vừa chụp</Button>
    </>;
  }
  return null;
}
