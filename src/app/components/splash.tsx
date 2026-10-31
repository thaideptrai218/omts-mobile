import { useEffect, useRef, useState } from "react";

import splash from "@/static/images/splash.jpg";

type Props = {
  /** Thời gian giữ ảnh trước khi bắt đầu mờ dần (ms). */
  holdMs?: number;
  /** Thời gian mờ dần (ms). */
  fadeMs?: number;
  /** Nếu ảnh tải quá lâu hoặc lỗi, vẫn chuyển vào trang chính sau chừng này (ms). */
  maxWaitMs?: number;
  onDone?: () => void;
};

type Phase = "loading" | "hold" | "fade" | "done";

/**
 * Màn hình mở đầu: hiện ảnh toàn màn hình, giữ một lúc rồi mờ dần
 * và phóng nhẹ để lộ trang chính đã render sẵn ở dưới.
 * Chỉ bắt đầu đếm giờ khi ảnh đã tải xong; tự gỡ khỏi DOM khi kết thúc.
 */
function Splash({
  holdMs = 600,
  fadeMs = 300,
  maxWaitMs = 1500,
  onDone,
}: Props) {
  const [phase, setPhase] = useState<Phase>("loading");
  const imgRef = useRef<HTMLImageElement>(null);
  const onDoneRef = useRef(onDone);
  onDoneRef.current = onDone;

  // Ảnh đã có trong cache thì coi như tải xong ngay.
  useEffect(() => {
    const img = imgRef.current;
    if (img?.complete && img.naturalWidth > 0) setPhase("hold");
  }, []);

  // Phòng khi ảnh không tải được: không bắt người dùng chờ mãi.
  useEffect(() => {
    if (phase !== "loading") return;
    const t = setTimeout(() => setPhase("fade"), maxWaitMs);
    return () => clearTimeout(t);
  }, [phase, maxWaitMs]);

  // hold -> fade -> done
  useEffect(() => {
    if (phase !== "hold" && phase !== "fade") return;
    const t = setTimeout(
      () => {
        if (phase === "hold") {
          setPhase("fade");
        } else {
          setPhase("done");
          onDoneRef.current?.();
        }
      },
      phase === "hold" ? holdMs : fadeMs,
    );
    return () => clearTimeout(t);
  }, [phase, holdMs, fadeMs]);

  if (phase === "done") return null;

  const markLoaded = () =>
    setPhase((p) => (p === "loading" ? "hold" : p));

  return (
    <div
      className={`splash ${phase === "fade" ? "splash--fade" : ""}`}
      style={{ transitionDuration: `${fadeMs}ms` }}
      aria-hidden
    >
      <img
        ref={imgRef}
        className="splash__image"
        src={splash}
        alt=""
        onLoad={markLoaded}
        onError={() => setPhase("fade")}
      />
    </div>
  );
}

export default Splash;
