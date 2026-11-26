import type { PhotoSource } from "@/models/Zalo";
import { useEffect, useRef, useState } from "react";
import { Button } from "zmp-ui";

import FormError from "@/components/FormError/FormError";
import { choosePhoto, zaloAvailable } from "@/services/zaloService";

/** Nút chụp tự mở khóa sau ngần này mili giây, vì Zalo không báo khi người dùng đóng bộ chọn ảnh. */
const UNLOCK_AFTER_MS = 2000;

/**
 * Chụp ảnh để máy chủ đọc: một lần chạm mở thẳng camera sau, kèm nút "Chọn ảnh có sẵn" (thư viện) cho khi camera không mở được.
 * Ngoài Zalo dùng ô chọn tệp của trình duyệt (`capture="environment"` mở camera trên điện thoại). Nút không bị khóa quá
 * 2 giây dù bộ chọn ảnh không bao giờ trả lời; ảnh trả về muộn vẫn được nhận, trừ khi người dùng đã bấm lại lần khác.
 */
export default function PhotoCapture({ label, disabled, onPhoto }: {
  label: string;
  disabled: boolean;
  onPhoto: (photo: Blob) => void;
}) {
  const cameraInput = useRef<HTMLInputElement>(null);
  const albumInput = useRef<HTMLInputElement>(null);
  const mounted = useRef(true);
  const latest = useRef(0);
  const [opening, setOpening] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, []);

  const open = async (source: PhotoSource) => {
    setError("");
    latest.current += 1;
    const mine = latest.current;
    const current = () => mounted.current && latest.current === mine;
    setOpening(true);
    const unlock = window.setTimeout(() => { if (current()) setOpening(false); }, UNLOCK_AFTER_MS);
    try {
      if (!(await zaloAvailable())) {
        // Ngoài Zalo: ô chọn tệp của trình duyệt. Hộp thoại của nó cũng không báo khi bị đóng, nên vẫn dựa vào bộ hẹn giờ ở trên.
        (source === "camera" ? cameraInput : albumInput).current?.click();
        return;
      }
      const photo = await choosePhoto([source]);
      if (photo && current()) onPhoto(photo);
    } catch (cause) {
      if (current()) setError(cause instanceof Error ? cause.message : "Chưa lấy được ảnh. Bạn có thể thử lại hoặc nhập bằng tay.");
    } finally {
      window.clearTimeout(unlock);
      if (current()) setOpening(false);
    }
  };

  const received = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (file) onPhoto(file);
  };

  return <>
    <input ref={cameraInput} type="file" accept="image/*" capture="environment" hidden onChange={received} />
    <input ref={albumInput} type="file" accept="image/*" hidden onChange={received} />
    <Button fullWidth size="large" variant="secondary" disabled={disabled || opening} onClick={() => void open("camera")}>{label}</Button>
    <Button fullWidth variant="tertiary" disabled={disabled || opening} onClick={() => void open("album")}>Chọn ảnh có sẵn</Button>
    <FormError text={error} />
  </>;
}
