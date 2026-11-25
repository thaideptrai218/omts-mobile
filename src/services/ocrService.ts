import type { OcrRequest, OcrText } from "@/models/Ocr";
import type { Worker } from "tesseract.js";
import workerUrl from "tesseract.js/dist/worker.min.js?url";

/** Chi tiết kỹ thuật ngắn kèm câu báo lỗi, để người dùng chụp màn hình gửi hỗ trợ khi bộ đọc chữ không chạy. */
function detail(cause: unknown): string {
  const text = (cause instanceof Error ? `${cause.name}: ${cause.message}` : String(cause ?? "")).trim();
  return text ? ` (chi tiết: ${text.slice(0, 160)})` : "";
}

let workerSource: Promise<string> | null = null;

/**
 * Mã worker của tesseract.js nạp bằng fetch ở luồng chính rồi chạy từ Blob URL, thay cho `new Worker(<tệp của app>)`.
 * Trong Zalo trên iPhone (25/11/2026), worker báo lỗi ngay khi khởi động: tệp worker không tải được từ trong worker, trong khi
 * trang vẫn tải được các tệp khác của app. Nạp một lần cho cả phiên mở app; lỗi thì lần sau nạp lại.
 */
function loadWorkerSource(): Promise<string> {
  if (!workerSource) {
    workerSource = fetch(new URL(workerUrl, window.location.href).href)
      .then((response) => {
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return response.text();
      })
      .then((script) => URL.createObjectURL(new Blob([script], { type: "text/javascript" })))
      .catch((cause: unknown) => {
        workerSource = null;
        throw new Error(`Không tải được bộ đọc chữ. Kiểm tra mạng rồi thử lại, hoặc nhập bằng tay.${detail(cause)}`);
      });
  }
  return workerSource;
}

/**
 * OCR tiếng Việt chạy trên thiết bị. Chỉ tải mã/mô hình chữ; không gửi ảnh ra bên ngoài và không dùng storage. Hủy bằng
 * `signal` thì dừng worker ngay và trả AbortError.
 */
export async function recognizeText({ image, signal, onProgress, layout = "block", timeoutMs = 60000 }: OcrRequest): Promise<OcrText> {
  const { createWorker, PSM } = await import("tesseract.js");
  if (signal.aborted) throw new DOMException("Đã hủy", "AbortError");
  let worker: Worker | undefined;
  let finished = false;
  let rejectAbort: (reason: Error) => void = () => undefined;
  let rejectWorker: (reason: Error) => void = () => undefined;
  const aborted = new Promise<never>((_, reject) => { rejectAbort = reject; });
  const workerError = new Promise<never>((_, reject) => { rejectWorker = reject; });
  const stop = () => { rejectAbort(new DOMException("Đã hủy", "AbortError")); void worker?.terminate(); };
  signal.addEventListener("abort", stop, { once: true });
  const timeout = window.setTimeout(() => rejectWorker(new Error("Đọc ảnh mất quá lâu. Vui lòng thử ảnh rõ hơn hoặc nhập thông tin bằng tay.")), timeoutMs);
  const work = async () => {
    worker = await createWorker("vie", 1, {
      workerPath: await loadWorkerSource(),
      workerBlobURL: false,
      cacheMethod: "none",
      logger: (event) => { if (!signal.aborted) onProgress(Math.round(Math.max(0, Math.min(1, event.progress || 0)) * 100)); },
      errorHandler: (data: unknown) => rejectWorker(new Error(`Không đọc được ảnh. Vui lòng thử ảnh rõ hơn hoặc nhập thông tin bằng tay.${detail(data)}`)),
    });
    if (signal.aborted || finished) { await worker.terminate(); throw new DOMException("Đã hủy", "AbortError"); }
    if (layout === "table") await worker.setParameters({ tessedit_pageseg_mode: PSM.SINGLE_COLUMN, preserve_interword_spaces: "1" });
    const { data } = await worker.recognize(image);
    return { text: data.text, confidence: data.confidence };
  };
  try { return await Promise.race([work(), aborted, workerError]); }
  catch (cause) {
    if (cause instanceof Error || cause instanceof DOMException) throw cause;
    // `worker.onerror` của tesseract.js trả chuỗi tiếng Anh hoặc undefined, không phải Error: worker không chạy được mã của
    // nó (khởi động hỏng) hoặc chết khi đang đọc (thường do thiếu bộ nhớ). Nói rõ là lúc nào, kèm chi tiết để báo lỗi.
    const reason = worker
      ? "Bộ đọc chữ bị dừng khi đang đọc ảnh, thường do máy thiếu bộ nhớ. Kéo khung sát bảng hơn rồi thử lại, hoặc nhập bằng tay."
      : "Không khởi động được bộ đọc chữ trên máy này. Hãy thử lại hoặc nhập bằng tay.";
    throw new Error(`${reason}${detail(cause)}`);
  }
  finally { finished = true; window.clearTimeout(timeout); signal.removeEventListener("abort", stop); await worker?.terminate(); }
}
