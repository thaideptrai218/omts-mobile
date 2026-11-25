import type { CornerTableReading } from "@/features/farming/models/ZoneBoundary";
import type { FrameRect, QuarterTurns } from "@/models/FrameRect";

import { extractCornerTable } from "@/features/farming/utils/cornerTable";
import { recognizeText } from "@/services/ocrService";
import { ocrImage } from "@/utils/imageFile";

/**
 * Đọc bảng "Tọa độ các điểm góc" trong khung đã chọn trên ảnh sơ đồ cấp phép, ngay trên điện thoại (ảnh không gửi đi đâu).
 * Kết quả chỉ là gợi ý: người dùng đối chiếu từng điểm với giấy trước khi lưu ranh giới.
 */
export async function readCornerTable(photo: Blob, frame: FrameRect, turns: QuarterTurns, signal: AbortSignal, onProgress: (progress: number) => void): Promise<CornerTableReading> {
  const image = await ocrImage(photo, frame, turns);
  const { text, confidence } = await recognizeText({ image, signal, onProgress, layout: "table", timeoutMs: 120000 });
  return { text, confidence, ...extractCornerTable(text) };
}
