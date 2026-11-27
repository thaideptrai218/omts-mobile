import { useEffect, useState } from "react";

/**
 * Vẽ một mã QR thành ảnh ngay trong app; thư viện `qrcode` chỉ tải khi cần. `failed` là trạng thái riêng của việc vẽ (ví dụ mất
 * mạng nên không tải được thư viện), không dùng chung dòng lỗi của màn: màn có thể xóa lỗi chung khi hỏi lại server, và khi đó
 * khung chờ ảnh sẽ quay mãi. `redraw` vẽ lại. Nội dung rỗng thì không vẽ gì.
 */
export function useQrImage(content: string | undefined) {
  const [image, setImage] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    setImage(null);
    setFailed(false);
    if (!content) return;
    let active = true;
    void import("qrcode")
      .then((QRCode) => QRCode.toDataURL(content, { width: 320, margin: 4 }))
      .then((data) => {
        if (active) setImage(data);
      })
      .catch(() => {
        if (active) setFailed(true);
      });
    return () => {
      active = false;
    };
  }, [content, attempt]);

  return { image, failed, redraw: () => setAttempt((n) => n + 1) };
}
