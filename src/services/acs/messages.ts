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
  MSG12: "The login information is incorrect. Please check and try again.",
  MSG13: "This account cannot be used at the moment. Please contact the support channel.",
  MSG14: "Cannot register with this email or phone number. Please log in or recover your account.",
  MSG15: "If the information is valid, a verification code will be sent to the email or phone number you just entered.",
  MSG16: "The verification code is incorrect or has expired. You can enter it again or request a new code.",
  MSG17: "The current password is incorrect. Your password has not been changed.",
  MSG18: "Your password has been changed.",
  MSG19: "Your login session has expired. Please log in again.",
  MSG20: "You cannot change your username yourself. Please contact the Cooperative Owner or the support channel.",
  MSG21: (channel: string) => `The ${channel} channel is not configured or not eligible, so it cannot be enabled yet.`,
  MSG22: "The device has declined push notifications. Other valid channels are still saved.",
  MSG23: "This notification item is mandatory and cannot be turned off.",
  MSG57: "Old documents are temporarily hidden until identity verification is complete.",
  MSG62: (maskedTarget: string, contact: string) =>
    `A verification code has been sent to ${maskedTarget}. Enter the code to finish; the old ${contact} remains in use until verification is complete.`,
  MSG67:
    "Your account needs a verified phone number to continue using OMTS. Please enter or confirm your phone number and enter the verification code sent via SMS.",
  MSG68:
    "Your temporary password has expired. Staff accounts: please ask the Cooperative Owner to reset it. Cooperative Owner and trader accounts: please use Forgot password.",
  MSG69: "You have exceeded the allowed number of attempts. Please try again in 15 minutes.",
  UNEXPECTED: "An unexpected error occurred. Please try again later.",
} as const;

/** Dòng quy tắc hiện dưới mọi ô mật khẩu mới. */
export const PASSWORD_RULE = "At least 8 characters, with letters and digits.";

/** Ghi chú trên màn xác minh mã. */
export const CODE_VALIDITY_NOTE = "The code is valid for 5 minutes; up to 5 attempts.";

/** Đổi mật khẩu khi tài khoản chưa có email đã xác minh (ACS-04). */
export const NO_VERIFIED_EMAIL_NOTE =
  "Add and verify an email in your profile, or log out and use Forgot password with your verified phone number.";

/**
 * Chữ của luồng "Liên kết tài khoản" (không có trong danh sách SRS vì SRS viết cho đăng nhập bằng mật
 * khẩu). Mã lỗi ZALO_* là đề xuất cho backend, xem docs/zalo-account-linking.md.
 */
export const LINK = {
  why: "Để biết bạn là nhân viên hay thương lái nào của HTX, app cần số điện thoại Zalo của bạn để đối chiếu với hồ sơ đã đăng ký. Zalo sẽ hỏi bạn có đồng ý chia sẻ không; từ chối thì bạn vẫn tra cứu truy xuất bình thường.",
  declined: "Bạn chưa chia sẻ số điện thoại nên chưa liên kết được. Bạn có thể liên kết lại bất cứ lúc nào trong mục Tài khoản.",
  notInZalo: "Liên kết tài khoản chỉ thực hiện được khi mở app trong ứng dụng Zalo trên điện thoại.",
  notSupported: "Máy chủ OMTS chưa hỗ trợ liên kết tài khoản Zalo. Vui lòng thử lại sau.",
  phoneNotFound: (maskedPhone: string) =>
    `Chưa có tài khoản OMTS nào dùng số ${maskedPhone}. Nếu bạn là thương lái, hãy tạo tài khoản thương lái với số này. Nếu bạn là nhân viên HTX, nhờ Chủ HTX nhập đúng số điện thoại Zalo của bạn vào hồ sơ rồi liên kết lại.`,
  created: "Đã tạo tài khoản thương lái và liên kết với Zalo của bạn.",
  linked: "Đã liên kết tài khoản. Lần sau mở app không cần liên kết lại.",
} as const;

/** Ghi chú trên màn khôi phục mật khẩu (ACS-03). */
export const RECOVERY_STAFF_NOTE = "Staff without a verified email or phone number: ask the Cooperative Owner to reset your password.";

/** Tên trường trong MSG01, đúng chữ backend dùng. */
export const FIELD = {
  phone: "Phone number",
  email: "Email",
  password: "Password",
  displayName: "Display name",
  code: "Verification code",
  currentPassword: "Current password",
} as const;

/** Chữ hiện cho người dùng khi một lời gọi API thất bại. */
export function errorText(error: unknown): string {
  if (error instanceof ApiError) return error.message;
  if (isNetworkError(error)) return MESSAGES.MSG07;
  return MESSAGES.UNEXPECTED;
}
