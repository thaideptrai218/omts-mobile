import type { BoundaryScanReading } from "@/features/farming/models/ZoneBoundary";
import type { RaftFormScanReading } from "@/features/farming/models/RaftForm";
import type { ScanPoll, ScanStarted } from "@/models/Scan";

import { api } from "@/services/httpClient";
import { appendPhoto } from "@/utils/imageFile";

// Đọc ảnh bằng Gemini trên máy chủ: gửi ảnh nhận scanId (202), rồi hỏi kết quả cho tới khi xong (api-contract-gemini-scans.md).
/** Gửi ảnh có thể chậm trên 4G; hỏi kết quả là request nhỏ nên giới hạn ngắn hơn. */
const UPLOAD_TIMEOUT_MS = 60000;
const POLL_TIMEOUT_MS = 15000;

function startScan(path: string, photo: Blob, signal: AbortSignal) {
  const form = new FormData();
  appendPhoto(form, "photo", photo);
  return api<ScanStarted>(path, { method: "POST", form, signal, timeoutMs: UPLOAD_TIMEOUT_MS });
}

/** Gửi ảnh sơ đồ cấp phép để đọc các bảng tọa độ điểm góc (chỉ Chủ HTX, vùng đang dùng). */
export function startBoundaryScan(zoneId: string, photo: Blob, signal: AbortSignal) {
  return startScan(`/api/zones/${zoneId}/boundary-scans`, photo, signal);
}

export function boundaryScan(zoneId: string, scanId: string, signal: AbortSignal) {
  return api<ScanPoll<BoundaryScanReading>>(`/api/zones/${zoneId}/boundary-scans/${scanId}`, { signal, timeoutMs: POLL_TIMEOUT_MS });
}

/** Gửi ảnh giấy tờ của bè để đọc mã, kích thước, vị trí, tọa độ. */
export function startRaftFormScan(photo: Blob, signal: AbortSignal) {
  return startScan("/api/rafts/form-scans", photo, signal);
}

export function raftFormScan(scanId: string, signal: AbortSignal) {
  return api<ScanPoll<RaftFormScanReading>>(`/api/rafts/form-scans/${scanId}`, { signal, timeoutMs: POLL_TIMEOUT_MS });
}
