import type { RaftFormSuggestion } from "@/features/farming/models/RaftForm";

import { parseCoordinate } from "@/utils/coordinates";
import { recognizeText } from "@/services/ocrService";

const labels: Record<string, keyof RaftFormSuggestion> = {
  "ma be": "code", "ma so be": "code", "raft code": "code",
  "kich thuoc": "size", "so hang": "laneCount", "so hang be": "laneCount",
  "vi tri": "location", "ghi chu": "notes", "tinh trang": "notes", "ghi chu tinh trang": "notes",
  "vi do": "latitude", "latitude": "latitude", "kinh do": "longitude", "longitude": "longitude",
};
const normalize = (value: string) => value.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/đ/g, "d").trim();

/** Chỉ nhận trường có nhãn rõ ràng, không đoán mã/tọa độ từ các số rời trong giấy. */
export function extractRaftForm(text: string): RaftFormSuggestion {
  const result: RaftFormSuggestion = { code: "", size: "", laneCount: "", location: "", notes: "", latitude: "", longitude: "" };
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
    } else result[field] = value;
  }
  return result;
}

/** Đọc ảnh giấy tờ của bè trên thiết bị rồi lấy các trường có nhãn rõ ràng. */
export async function recognizeRaftForm(image: File | string, signal: AbortSignal, onProgress: (progress: number) => void) {
  const { text, confidence } = await recognizeText({ image, signal, onProgress });
  return { text, confidence, fields: extractRaftForm(text) };
}
