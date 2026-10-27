import { useEffect, useState } from "react";
import { EventName, events } from "zmp-sdk";

/**
 * Số giây còn lại tới mốc `untilMs` theo đồng hồ máy. Mỗi lần tính đều đọc `Date.now()` thay vì trừ dần
 * từng tick, nên Mini App vào nền (timer bị tạm dừng) rồi quay lại vẫn đúng; đồng bộ ngay khi trang
 * hiện lại (visibilitychange) hoặc Zalo báo AppResumed.
 */
export function useRemainingSeconds(untilMs: number): number {
  const [now, setNow] = useState(() => Date.now());
  const finished = untilMs <= now;

  useEffect(() => {
    if (finished) return;
    const sync = () => setNow(Date.now());
    const timer = setInterval(sync, 500);
    document.addEventListener("visibilitychange", sync);
    try {
      events.on(EventName.AppResumed, sync);
    } catch {
      // Ngoài Zalo không có bus sự kiện này.
    }
    return () => {
      clearInterval(timer);
      document.removeEventListener("visibilitychange", sync);
      try {
        events.off(EventName.AppResumed, sync);
      } catch {
        // Như trên.
      }
    };
  }, [untilMs, finished]);

  return Math.max(0, Math.ceil((untilMs - now) / 1000));
}
