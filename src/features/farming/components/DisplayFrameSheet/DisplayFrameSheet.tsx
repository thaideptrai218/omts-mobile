import type { WaterCrop } from "@/features/farming/models/WaterMeasurement";
import { useEffect, useState } from "react";
import { Button, Sheet } from "zmp-ui";

import { ImageFrame } from "@/components/ImageFrame/ImageFrame";

const START: WaterCrop = { left: 0.2, top: 0.3, right: 0.8, bottom: 0.7 };

/**
 * WATER-01 bước 5: sau khi chụp máy đo, người đo kéo khung cho vừa màn hình số. App gửi cả ảnh (lưu làm bằng chứng) kèm
 * khung; backend chỉ đọc số trong khung nên đọc nhanh và ít nhầm chữ trên vỏ máy. "Gửi cả ảnh" bỏ qua bước này.
 */
export function DisplayFrameSheet({ photo, onRead, onCancel }: {
  photo: Blob | null;
  onRead: (crop: WaterCrop | null) => void;
  onCancel: () => void;
}) {
  const [url, setUrl] = useState("");
  const [frame, setFrame] = useState<WaterCrop>(START);

  // Mỗi ảnh mới bắt đầu từ khung giữa ảnh; địa chỉ tạm của ảnh được giải phóng khi đóng.
  useEffect(() => {
    if (!photo) return undefined;
    const next = URL.createObjectURL(photo);
    setUrl(next);
    setFrame(START);
    return () => URL.revokeObjectURL(next);
  }, [photo]);

  return (
    <Sheet visible={!!photo} onClose={onCancel} height="92vh" mask handler swipeToClose={false} title="Chọn màn hình số">
      <div className="sheet-form form">
        <p className="form__intro">
          Kéo khung trắng cho vừa phần màn hình số của máy đo: chạm giữa khung để di chuyển, kéo hai nút tròn ở góc để đổi cỡ.
          App chỉ đọc số trong khung, cả ảnh vẫn được lưu.
        </p>
        <ImageFrame src={url} alt="Ảnh máy đo vừa chụp" frame={frame} onChange={setFrame} />
        <div className="sheet-actions">
          <Button fullWidth size="large" onClick={() => onRead(frame)}>
            Đọc số trong khung
          </Button>
          <Button fullWidth variant="secondary" size="large" onClick={() => onRead(null)}>
            Gửi cả ảnh, không chọn khung
          </Button>
        </div>
      </div>
    </Sheet>
  );
}
