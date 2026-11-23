import type { WaterCrop } from "@/features/farming/models/WaterMeasurement";
import type { PointerEvent as ReactPointerEvent } from "react";
import { useEffect, useRef, useState } from "react";
import { Button, Sheet } from "zmp-ui";

import "@/features/farming/components/DisplayFrameSheet/DisplayFrameSheet.scss";

/** Phần đang kéo: cả khung, góc trên bên trái hoặc góc dưới bên phải. */
type DragPart = "frame" | "start" | "end";

type Drag = { part: DragPart; x: number; y: number; from: WaterCrop };

// Khung nhỏ nhất 8 % mỗi chiều (backend nhận từ 5 %), đủ to để còn kéo được bằng ngón tay.
const MIN_SIZE = 0.08;
const START: WaterCrop = { left: 0.2, top: 0.3, right: 0.8, bottom: 0.7 };

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

/** Khung mới sau khi kéo một phần đi (dx, dy) theo tỉ lệ ảnh, luôn nằm trong ảnh và không nhỏ hơn MIN_SIZE. */
function moved(part: DragPart, from: WaterCrop, dx: number, dy: number): WaterCrop {
  if (part === "frame") {
    const left = clamp(from.left + dx, 0, 1 - (from.right - from.left));
    const top = clamp(from.top + dy, 0, 1 - (from.bottom - from.top));
    return { left, top, right: left + (from.right - from.left), bottom: top + (from.bottom - from.top) };
  }
  if (part === "start") {
    return { ...from, left: clamp(from.left + dx, 0, from.right - MIN_SIZE), top: clamp(from.top + dy, 0, from.bottom - MIN_SIZE) };
  }
  return { ...from, right: clamp(from.right + dx, from.left + MIN_SIZE, 1), bottom: clamp(from.bottom + dy, from.top + MIN_SIZE, 1) };
}

/**
 * WATER-01 bước 5: sau khi chụp máy đo, người đo kéo khung cho vừa màn hình số. App gửi cả ảnh (lưu làm bằng chứng) kèm
 * khung; backend chỉ đọc số trong khung nên đọc nhanh và ít nhầm chữ trên vỏ máy. "Gửi cả ảnh" bỏ qua bước này.
 */
export function DisplayFrameSheet({ photo, onRead, onCancel }: {
  photo: Blob | null;
  onRead: (crop: WaterCrop | null) => void;
  onCancel: () => void;
}) {
  const box = useRef<HTMLDivElement>(null);
  const drag = useRef<Drag | null>(null);
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

  const grab = (part: DragPart) => (event: ReactPointerEvent<HTMLElement>) => {
    event.stopPropagation();
    event.currentTarget.setPointerCapture(event.pointerId);
    drag.current = { part, x: event.clientX, y: event.clientY, from: frame };
  };

  const follow = (event: ReactPointerEvent<HTMLElement>) => {
    const current = drag.current;
    const rect = box.current?.getBoundingClientRect();
    if (!current || !rect || rect.width === 0 || rect.height === 0) return;
    setFrame(moved(current.part, current.from, (event.clientX - current.x) / rect.width, (event.clientY - current.y) / rect.height));
  };

  const release = () => {
    drag.current = null;
  };

  const percent = (value: number) => `${(value * 100).toFixed(2)}%`;

  return (
    <Sheet visible={!!photo} onClose={onCancel} height="92vh" mask handler swipeToClose={false} title="Chọn màn hình số">
      <div className="sheet-form form display-frame">
        <p className="form__intro">
          Kéo khung trắng cho vừa phần màn hình số của máy đo: chạm giữa khung để di chuyển, kéo hai nút tròn ở góc để đổi cỡ.
          App chỉ đọc số trong khung, cả ảnh vẫn được lưu.
        </p>
        <div className="display-frame__stage">
          <div className="display-frame__box" ref={box}>
            {url && <img className="display-frame__photo" src={url} alt="Ảnh máy đo vừa chụp" draggable={false} />}
            <div
              className="display-frame__frame"
              style={{ left: percent(frame.left), top: percent(frame.top), width: percent(frame.right - frame.left), height: percent(frame.bottom - frame.top) }}
              onPointerDown={grab("frame")}
              onPointerMove={follow}
              onPointerUp={release}
              onPointerCancel={release}
            >
              <span className="display-frame__handle display-frame__handle--start" role="presentation" onPointerDown={grab("start")} onPointerMove={follow} onPointerUp={release} onPointerCancel={release} />
              <span className="display-frame__handle display-frame__handle--end" role="presentation" onPointerDown={grab("end")} onPointerMove={follow} onPointerUp={release} onPointerCancel={release} />
            </div>
          </div>
        </div>
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
