import type { Worker } from "tesseract.js";
import workerUrl from "tesseract.js/dist/worker.min.js?url";

import { parseCoordinate } from "@/shared/lib/coordinates";

export type RaftFormSuggestion = { code: string; size: string; laneCount: string; laneLength: string; location: string; notes: string; latitude: string; longitude: string };

const labels: Record<string, keyof RaftFormSuggestion> = {
  "ma be": "code", "ma so be": "code", "raft code": "code",
  "kich thuoc": "size", "so hang": "laneCount", "so hang be": "laneCount", "chieu dai moi hang": "laneLength", "dai moi hang": "laneLength",
  "vi tri": "location", "ghi chu": "notes", "tinh trang": "notes", "ghi chu tinh trang": "notes",
  "vi do": "latitude", "latitude": "latitude", "kinh do": "longitude", "longitude": "longitude",
};
const normalize = (value: string) => value.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/đ/g, "d").trim();

/** Chỉ nhận trường có nhãn rõ ràng, không đoán mã/tọa độ từ các số rời trong giấy. */
export function extractRaftForm(text: string): RaftFormSuggestion {
  const result: RaftFormSuggestion = { code: "", size: "", laneCount: "", laneLength: "", location: "", notes: "", latitude: "", longitude: "" };
  for (const line of text.split(/\r?\n/)) {
    const match = line.match(/^\s*([^:：=]+)\s*[:：=]\s*(.+?)\s*$/);
    if (!match) continue;
    const field = labels[normalize(match[1])];
    if (!field || result[field]) continue;
    const value = match[2].trim();
    if (field === "latitude" || field === "longitude") {
      const number = parseCoordinate(value.replace(/\s*°\s*$/, ""), field);
      if (number !== null) result[field] = String(number);
    } else if (field === "laneCount") {
      if (/^\d+\s*(?:hang)?$/i.test(normalize(value))) result[field] = value.match(/^\d+/)![0];
    } else if (field === "laneLength") {
      const number = value.replace(/\s*m\s*$/i, "").replace(",", ".");
      if (/^\d+(?:\.\d+)?$/.test(number)) result[field] = number;
    } else result[field] = value;
  }
  return result;
}

/** OCR tiếng Việt chạy trên thiết bị. Chỉ tải mã/model; không gửi ảnh ra bên ngoài và không dùng storage. */
export async function recognizeRaftForm(image: File | string, signal: AbortSignal, onProgress: (progress: number) => void) {
  const { createWorker } = await import("tesseract.js");
  if (signal.aborted) throw new DOMException("Đã hủy", "AbortError");
  let worker: Worker | undefined;
  let finished = false;
  let rejectAbort: (reason: Error) => void = () => undefined;
  let rejectWorker: (reason: Error) => void = () => undefined;
  const aborted = new Promise<never>((_, reject) => { rejectAbort = reject; });
  const workerError = new Promise<never>((_, reject) => { rejectWorker = reject; });
  const stop = () => { rejectAbort(new DOMException("Đã hủy", "AbortError")); void worker?.terminate(); };
  signal.addEventListener("abort", stop, { once: true });
  const timeout = window.setTimeout(() => rejectWorker(new Error("OCR tải quá lâu. Vui lòng thử ảnh rõ hơn hoặc nhập thông tin bằng tay.")), 60000);
  const work = async () => {
    worker = await createWorker("vie", 1, {
      workerPath: new URL(workerUrl, window.location.href).href,
      workerBlobURL: false,
      cacheMethod: "none",
      logger: (event) => { if (!signal.aborted) onProgress(Math.round(Math.max(0, Math.min(1, event.progress || 0)) * 100)); },
      errorHandler: () => rejectWorker(new Error("Không đọc được ảnh. Vui lòng thử ảnh rõ hơn hoặc nhập thông tin bằng tay.")),
    });
    if (signal.aborted || finished) { await worker.terminate(); throw new DOMException("Đã hủy", "AbortError"); }
    const { data } = await worker.recognize(image);
    return { text: data.text, confidence: data.confidence, fields: extractRaftForm(data.text) };
  };
  try { return await Promise.race([work(), aborted, workerError]); }
  finally { finished = true; window.clearTimeout(timeout); signal.removeEventListener("abort", stop); await worker?.terminate(); }
}
