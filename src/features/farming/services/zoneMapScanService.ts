import type { LicenseMapReading } from "@/features/farming/models/ZoneBoundary";
import type { ZoneMapScan, ZoneMapScanStarted } from "@/features/farming/models/ZoneMapScan";

import { licenseMapReading } from "@/features/farming/utils/zoneMapReading";
import { isNetworkError } from "@/services/errors";
import { api } from "@/services/httpClient";
import { appendPhoto, shrinkImage } from "@/utils/imageFile";

/** Máy chủ nhận ảnh JPEG hoặc PNG tối đa 10 MB; ảnh lớn hơn hoặc đuôi khác được lưu lại thành JPEG, cạnh dài 2560 px. */
const MAX_BYTES = 9 * 1024 * 1024;
const POLL_MS = 2000;
const GIVE_UP_MS = 120000;
/** Mất mạng thoáng qua khi hỏi kết quả thì hỏi lại; quá số lần này mới báo lỗi. */
const MAX_NETWORK_MISSES = 3;

/** Lỗi đọc ảnh có sẵn câu tiếng Việt để hiện nguyên văn cho người dùng. */
export class ZoneMapScanError extends Error {}

const FAILURE_TEXT: Record<string, string> = {
  TIMEOUT: "Máy chủ đọc ảnh quá lâu. Vui lòng thử lại, hoặc nhập điểm góc bằng tay.",
  UNAVAILABLE: "Dịch vụ đọc ảnh đang bận hoặc không phản hồi. Vui lòng thử lại sau ít phút.",
  BAD_RESPONSE: "Chưa đọc được sơ đồ trong ảnh này. Hãy chụp thẳng, đủ sáng, thấy rõ bảng thông tin và các bảng tọa độ góc.",
  NOT_CONFIGURED: "Máy chủ chưa bật tính năng đọc ảnh sơ đồ. Bạn có thể nhập điểm góc bằng tay.",
};

const wait = (ms: number, signal: AbortSignal) =>
  new Promise<void>((resolve, reject) => {
    if (signal.aborted) {
      reject(new DOMException("Aborted", "AbortError"));
      return;
    }
    const timer = window.setTimeout(() => {
      signal.removeEventListener("abort", onAbort);
      resolve();
    }, ms);
    const onAbort = () => {
      window.clearTimeout(timer);
      reject(new DOMException("Aborted", "AbortError"));
    };
    signal.addEventListener("abort", onAbort, { once: true });
  });

/**
 * Đọc ảnh sơ đồ cấp phép khu vực biển trên máy chủ, khi vùng chưa được tạo (chỉ Chủ HTX): gửi ảnh, hỏi lại mỗi 2 giây, bỏ sau
 * 120 giây. Kết quả chỉ là gợi ý để người dùng đối chiếu, chưa lưu gì. Hủy bằng `signal` thì ném `AbortError`.
 */
export async function scanLicenseMap(photo: Blob, signal: AbortSignal): Promise<LicenseMapReading> {
  const acceptable = (photo.type === "image/jpeg" || photo.type === "image/png") && photo.size <= MAX_BYTES;
  const form = new FormData();
  appendPhoto(form, "photo", await shrinkImage(photo, acceptable ? MAX_BYTES : 0, 2560));
  const { scanId } = await api<ZoneMapScanStarted>("/api/zones/boundary-scans", { method: "POST", form });

  const deadline = Date.now() + GIVE_UP_MS;
  let misses = 0;
  while (Date.now() < deadline) {
    await wait(POLL_MS, signal);
    let scan: ZoneMapScan;
    try {
      scan = await api<ZoneMapScan>(`/api/zones/boundary-scans/${scanId}`);
      misses = 0;
    } catch (error) {
      misses += 1;
      if (isNetworkError(error) && misses < MAX_NETWORK_MISSES) continue;
      throw error;
    }
    if (scan.status === "Failed") throw new ZoneMapScanError(FAILURE_TEXT[scan.errorCode ?? ""] ?? FAILURE_TEXT.BAD_RESPONSE);
    if (scan.status === "Done" && scan.reading) return licenseMapReading(scan.reading);
  }
  throw new ZoneMapScanError(FAILURE_TEXT.TIMEOUT);
}
