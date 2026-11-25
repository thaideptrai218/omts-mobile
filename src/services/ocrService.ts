import type { OcrRequest, OcrText } from "@/models/Ocr";
import type { Worker } from "tesseract.js";
import workerUrl from "tesseract.js/dist/worker.min.js?url";

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
      workerPath: new URL(workerUrl, window.location.href).href,
      workerBlobURL: false,
      cacheMethod: "none",
      logger: (event) => { if (!signal.aborted) onProgress(Math.round(Math.max(0, Math.min(1, event.progress || 0)) * 100)); },
      errorHandler: () => rejectWorker(new Error("Không đọc được ảnh. Vui lòng thử ảnh rõ hơn hoặc nhập thông tin bằng tay.")),
    });
    if (signal.aborted || finished) { await worker.terminate(); throw new DOMException("Đã hủy", "AbortError"); }
    if (layout === "table") await worker.setParameters({ tessedit_pageseg_mode: PSM.SINGLE_COLUMN, preserve_interword_spaces: "1" });
    const { data } = await worker.recognize(image);
    return { text: data.text, confidence: data.confidence };
  };
  try { return await Promise.race([work(), aborted, workerError]); }
  finally { finished = true; window.clearTimeout(timeout); signal.removeEventListener("abort", stop); await worker?.terminate(); }
}
