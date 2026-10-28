import { ApiError, isNetworkError } from "@/services/api/errors";

/**
 * Danh mục thông báo SRS (bản 22/10/2026) cho các màn tài khoản. Chữ phải giữ đúng từng ký tự như
 * ticket và như backend trả (`UserMessages.cs`), vì tiêu chí nghiệm thu so khớp nguyên văn. Khi server
 * có trả `detail` thì ưu tiên chữ của server; danh mục này dùng cho lỗi phía app (chưa gửi request,
 * mất mạng, hết phiên). Muốn đổi ngôn ngữ thì đổi ở đây, một chỗ duy nhất.
 */
export const MESSAGES = {
  MSG01: (field: string) => `${field} is invalid. Please check and enter it again.`,
  MSG02: "You do not have permission to perform this action.",
  MSG04: (service: string) =>
    `The ${service} service is not responding. The action has not been completed and the data in OMTS is unchanged; please try again later.`,
  MSG07:
    "No connection. The data is kept temporarily on the device and synchronized once online; protected data is not displayed from the local copy.",
  MSG10: (what: string) => `${what} saved.`,
  MSG13: "This account cannot be used at the moment. Please contact the support channel.",
  MSG19: "Your login session has expired. Please log in again.",
  MSG20: "You cannot change your username yourself. Please contact the Cooperative Owner or the support channel.",
  MSG21: (channel: string) => `The ${channel} channel is not configured or not eligible, so it cannot be enabled yet.`,
  MSG22: "The device has declined push notifications. Other valid channels are still saved.",
  MSG23: "This notification item is mandatory and cannot be turned off.",
  MSG57: "Old documents are temporarily hidden until identity verification is complete.",
  MSG69: "You have exceeded the allowed number of attempts. Please try again in 15 minutes.",
  UNEXPECTED: "An unexpected error occurred. Please try again later.",
} as const;

/**
 * Chữ của luồng "Liên kết tài khoản" (không có trong danh sách SRS vì SRS viết cho đăng nhập bằng mật
 * khẩu; mobile không có mật khẩu). Mã lỗi ZALO_* là đề xuất cho backend, xem docs/zalo-account-linking.md.
 */
export const LINK = {
  why: "Để biết bạn là nhân viên hay thương lái nào của HTX, app cần số điện thoại Zalo của bạn để đối chiếu với hồ sơ đã đăng ký. Zalo sẽ hỏi bạn có đồng ý chia sẻ không; từ chối thì bạn vẫn tra cứu truy xuất bình thường.",
  declined:
    "Bạn chưa chia sẻ số điện thoại nên chưa liên kết được. Zalo ghi nhớ lựa chọn này: muốn liên kết, bấm “Mở cài đặt quyền của Zalo”, bật Số điện thoại rồi bấm liên kết lại.",
  notInZalo: "Liên kết tài khoản chỉ thực hiện được khi mở app trong ứng dụng Zalo trên điện thoại.",
  notSupported: "Máy chủ OMTS chưa hỗ trợ liên kết tài khoản Zalo. Vui lòng thử lại sau.",
  phoneNotFound: (maskedPhone: string) =>
    `Chưa có tài khoản OMTS nào dùng số ${maskedPhone}. Nhờ HTX nhập đúng số điện thoại Zalo của bạn vào hồ sơ rồi liên kết lại.`,
  linked: "Đã liên kết tài khoản. Lần sau mở app không cần liên kết lại.",
} as const;

/** Tên trường trong MSG01, đúng chữ backend dùng. */
export const FIELD = {
  displayName: "Display name",
} as const;

/** Chữ hiện cho người dùng khi một lời gọi API thất bại. */
export function errorText(error: unknown): string {
  if (error instanceof ApiError) return error.message;
  if (isNetworkError(error)) return MESSAGES.MSG07;
  return MESSAGES.UNEXPECTED;
}
