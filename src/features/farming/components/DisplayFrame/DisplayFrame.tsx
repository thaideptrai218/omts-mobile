import type { WaterCrop } from "@/features/farming/models/WaterMeasurement";
import { useEffect, useState } from "react";
import { Button } from "zmp-ui";

import { ImageFrame } from "@/components/ImageFrame/ImageFrame";

const START: WaterCrop = { left: 0.2, top: 0.3, right: 0.8, bottom: 0.7 };

/**
 * WATER-01 bước 5: sau khi chụp máy đo, người đo kéo khung cho vừa màn hình số. App gửi cả ảnh (lưu làm bằng chứng) kèm
 * khung; backend chỉ đọc số trong khung nên đọc nhanh và ít nhầm chữ trên vỏ máy. "Gửi cả ảnh" bỏ qua bước này. Hiện ngay
 * trong trang, không mở sheet đè lên: kéo khung trong sheet dễ lẫn với cử chỉ vuốt đóng sheet.
 */
export function DisplayFrame({ photo, onRead, onRetake, onCancel }: {
  photo: Blob;
  onRead: (crop: WaterCrop | null) => void;
  onRetake: () => void;
  onCancel: () => void;
}) {
  const [url, setUrl] = useState("");
  const [frame, setFrame] = useState<WaterCrop>(START);

  // Mỗi ảnh mới bắt đầu từ khung giữa ảnh; địa chỉ tạm của ảnh được giải phóng khi đổi ảnh hoặc đóng.
  useEffect(() => {
    const next = URL.createObjectURL(photo);
    setUrl(next);
    setFrame(START);
    return () => URL.revokeObjectURL(next);
  }, [photo]);

  return (
    <div className="form">
      <p className="form__intro">
        Kéo khung trắng cho vừa phần màn hình số của máy đo: chạm giữa khung để di chuyển, kéo hai nút tròn ở góc để đổi cỡ.
        Ảnh được gửi lên máy chủ và đọc bằng Google Gemini; chỉ đọc số trong khung, cả ảnh vẫn được lưu.
      </p>
      <ImageFrame src={url} alt="Ảnh máy đo vừa chụp" frame={frame} onChange={setFrame} />
      <div className="sheet-actions">
        <Button fullWidth size="large" onClick={() => onRead(frame)}>
          Đọc số trong khung
        </Button>
        <Button fullWidth variant="secondary" size="large" onClick={() => onRead(null)}>
          Gửi cả ảnh, không chọn khung
        </Button>
        <Button fullWidth variant="secondary" size="large" onClick={onRetake}>
          Chụp lại
        </Button>
        <Button fullWidth variant="tertiary" size="large" onClick={onCancel}>
          Hủy lần đo này
        </Button>
      </div>
    </div>
  );
}
