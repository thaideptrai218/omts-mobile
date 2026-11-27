import type { ScanJob, ScanPoll, ScanStarted, ScanStatus } from "@/models/Scan";
import { useCallback, useEffect, useRef, useState } from "react";

import { isNetworkError, TimeoutError } from "@/services/errors";
import { scanErrorText, scanFailureText } from "@/utils/scanErrorText";

const POLL_EVERY_MS = 2000;
const GIVE_UP_AFTER_MS = 120000;
/** Hỏi kết quả hỏng liên tiếp (mất sóng thoáng qua) quá số lần này mới coi là lỗi. */
const MAX_POLL_HICCUPS = 3;

const aborted = () => new DOMException("Đã hủy", "AbortError");

/** Chờ `ms` mili giây; bị hủy thì ném AbortError ngay. */
function sleep(ms: number, signal: AbortSignal) {
  return new Promise<void>((resolve, reject) => {
    if (signal.aborted) { reject(aborted()); return; }
    const timer = window.setTimeout(resolve, ms);
    signal.addEventListener("abort", () => { window.clearTimeout(timer); reject(aborted()); }, { once: true });
  });
}

/**
 * Đọc ảnh bằng Gemini trên máy chủ: `start` gửi ảnh và trả `scanId`, rồi cứ 2 giây `poll` một lần cho tới khi Done hoặc Failed,
 * tối đa 120 giây. `cancel` hoặc rời màn hình thì dừng hẳn (hủy cả request đang bay) và không cập nhật state nữa.
 * Mỗi lần `begin` là một "thế hệ" mới; kết quả của thế hệ cũ bị bỏ.
 */
export function useScanJob<T>(
  start: (photo: Blob, signal: AbortSignal) => Promise<ScanStarted>,
  poll: (scanId: string, signal: AbortSignal) => Promise<ScanPoll<T>>,
): ScanJob<T> {
  const [status, setStatus] = useState<ScanStatus>("idle");
  const [result, setResult] = useState<T | null>(null);
  const [error, setError] = useState("");
  const generation = useRef(0);
  const controller = useRef<AbortController | null>(null);
  const lastPhoto = useRef<Blob | null>(null);
  // Giữ bản mới nhất của hai hàm gọi API để vòng hỏi lại không dùng hàm cũ.
  const calls = useRef({ start, poll });
  useEffect(() => { calls.current = { start, poll }; });

  const stop = useCallback(() => { generation.current += 1; controller.current?.abort(); controller.current = null; }, []);
  useEffect(() => stop, [stop]);

  const begin = useCallback((photo: Blob) => {
    stop();
    const mine = generation.current;
    const ctl = new AbortController();
    controller.current = ctl;
    lastPhoto.current = photo;
    const alive = () => generation.current === mine;
    const fail = (text: string) => { setStatus("failed"); setError(text); };

    setResult(null); setError(""); setStatus("uploading");
    void (async () => {
      try {
        const { scanId } = await calls.current.start(photo, ctl.signal);
        if (!alive()) return;
        setStatus("reading");
        const deadline = Date.now() + GIVE_UP_AFTER_MS;
        let hiccups = 0;
        for (;;) {
          await sleep(POLL_EVERY_MS, ctl.signal);
          if (!alive()) return;
          if (Date.now() > deadline) { fail(scanFailureText("TIMEOUT")); return; }
          let reply: ScanPoll<T>;
          try {
            reply = await calls.current.poll(scanId, ctl.signal);
          } catch (cause) {
            if ((isNetworkError(cause) || cause instanceof TimeoutError) && ++hiccups < MAX_POLL_HICCUPS) continue;
            throw cause;
          }
          hiccups = 0;
          if (!alive()) return;
          if (reply.status === "Done" && reply.reading) { setResult(reply.reading); setStatus("done"); return; }
          if (reply.status !== "Pending") { fail(scanFailureText(reply.errorCode)); return; }
        }
      } catch (cause) {
        if (!alive() || (cause instanceof DOMException && cause.name === "AbortError")) return;
        fail(scanErrorText(cause));
      }
    })();
  }, [stop]);

  const cancel = useCallback(() => { stop(); setStatus("idle"); setError(""); }, [stop]);
  const retry = useCallback(() => { if (lastPhoto.current) begin(lastPhoto.current); }, [begin]);

  return { status, result, error, begin, cancel, retry };
}
