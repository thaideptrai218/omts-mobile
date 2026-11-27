import type { FrameRect } from "@/models/FrameRect";
import type { PointerEvent as ReactPointerEvent } from "react";
import { useRef } from "react";

import "@/components/ImageFrame/ImageFrame.scss";

/** Phần đang kéo: cả khung, góc trên bên trái hoặc góc dưới bên phải. */
type DragPart = "frame" | "start" | "end";

type Drag = { part: DragPart; x: number; y: number; from: FrameRect };

// Khung nhỏ nhất 8 % mỗi chiều, đủ to để còn kéo được bằng ngón tay.
const MIN_SIZE = 0.08;

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

/** Khung mới sau khi kéo một phần đi (dx, dy) theo tỉ lệ ảnh, luôn nằm trong ảnh và không nhỏ hơn MIN_SIZE. */
function moved(part: DragPart, from: FrameRect, dx: number, dy: number): FrameRect {
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
 * Ảnh kèm khung trắng kéo được: chạm giữa khung để di chuyển, kéo hai nút tròn ở góc để đổi cỡ. Khung bọc sát ảnh nên tọa độ
 * phần trăm của khung là tỉ lệ của ảnh.
 */
export function ImageFrame({ src, alt, frame, onChange }: { src: string; alt: string; frame: FrameRect; onChange: (frame: FrameRect) => void }) {
  const box = useRef<HTMLDivElement>(null);
  const drag = useRef<Drag | null>(null);

  const grab = (part: DragPart) => (event: ReactPointerEvent<HTMLElement>) => {
    event.stopPropagation();
    event.currentTarget.setPointerCapture(event.pointerId);
    drag.current = { part, x: event.clientX, y: event.clientY, from: frame };
  };

  const follow = (event: ReactPointerEvent<HTMLElement>) => {
    const current = drag.current;
    const rect = box.current?.getBoundingClientRect();
    if (!current || !rect || rect.width === 0 || rect.height === 0) return;
    onChange(moved(current.part, current.from, (event.clientX - current.x) / rect.width, (event.clientY - current.y) / rect.height));
  };

  const release = () => {
    drag.current = null;
  };

  const percent = (value: number) => `${(value * 100).toFixed(2)}%`;
  const place = { left: percent(frame.left), top: percent(frame.top), width: percent(frame.right - frame.left), height: percent(frame.bottom - frame.top) };

  return (
    <div className="image-frame__stage">
      <div className="image-frame__box" ref={box}>
        {src && <img className="image-frame__photo" src={src} alt={alt} draggable={false} />}
        {/* Lớp làm tối phần ngoài khung, cắt theo mép ảnh; tách riêng để nút kéo ở góc không bị cắt theo. */}
        <div className="image-frame__shade" aria-hidden>
          <div className="image-frame__hole" style={place} />
        </div>
        <div
          className="image-frame__frame"
          style={place}
          onPointerDown={grab("frame")}
          onPointerMove={follow}
          onPointerUp={release}
          onPointerCancel={release}
        >
          <span className="image-frame__handle image-frame__handle--start" role="presentation" onPointerDown={grab("start")} onPointerMove={follow} onPointerUp={release} onPointerCancel={release} />
          <span className="image-frame__handle image-frame__handle--end" role="presentation" onPointerDown={grab("end")} onPointerMove={follow} onPointerUp={release} onPointerCancel={release} />
        </div>
      </div>
    </div>
  );
}
