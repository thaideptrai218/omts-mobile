import type { ScanErrorCode } from "@/models/Scan";
import { ApiError } from "@/services/errors";
import { errorText } from "@/utils/errorText";

const MANUAL = " Bạn vẫn có thể nhập bằng tay.";

const FAILED_TEXT: Record<ScanErrorCode, string> = {
  UNAVAILABLE: "Dịch vụ đọc ảnh tạm thời chưa dùng được. Vui lòng thử lại sau ít phút.",
  TIMEOUT: "Máy chủ đọc ảnh quá lâu. Hãy thử lại, hoặc chụp gần và rõ hơn.",
  BAD_RESPONSE: "Chưa đọc được ảnh này. Hãy chụp thẳng, đủ sáng, rõ chữ rồi thử lại.",
  NOT_CONFIGURED: "Chức năng đọc ảnh chưa được bật trên máy chủ.",
};

/** Lần đọc kết thúc với trạng thái Failed (hoặc Done mà không có kết quả). */
export function scanFailureText(code: ScanErrorCode | null): string {
  // Mã lạ (máy chủ thêm mã mới) cũng ra câu chung, không bao giờ hiện "undefined".
  return ((code && FAILED_TEXT[code]) ?? FAILED_TEXT.BAD_RESPONSE) + MANUAL;
}

/** Lỗi khi gửi ảnh hoặc hỏi kết quả → câu tiếng Việt; mọi trường hợp đều nhắc nhập tay vẫn dùng được. */
export function scanErrorText(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.code === "OCR_BUSY" || error.status === 503) return "Máy chủ đang bận đọc ảnh, vui lòng thử lại sau ít phút." + MANUAL;
    if (error.status === 429) return "Bạn đã gửi ảnh quá nhiều lần trong thời gian ngắn. Vui lòng đợi vài phút rồi thử lại." + MANUAL;
    if (error.status === 404) return "Kết quả đọc ảnh đã hết hạn. Vui lòng chụp lại." + MANUAL;
    if (error.status === 409) return "Vùng này đang không được sử dụng nên chưa đọc được ảnh." + MANUAL;
    if (error.status === 413) return "Ảnh quá lớn để gửi. Vui lòng chụp lại." + MANUAL;
  }
  return errorText(error) + MANUAL;
}
