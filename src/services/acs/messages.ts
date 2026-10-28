import { ApiError, isNetworkError, type ProblemDetails } from "@/services/api/errors";

/**
 * Danh mục thông báo SRS (bản 22/10/2026), viết bằng tiếng Việt cho người dùng Mini App. Backend vẫn trả chữ
 * tiếng Anh trong `detail`; app không hiện chữ đó mà dịch theo `code` (xem `errorText`). Muốn đổi chữ thì đổi
 * ở đây, một chỗ duy nhất.
 */
export const MESSAGES = {
  MSG01: (field: string) => `${field} không hợp lệ. Vui lòng kiểm tra và nhập lại.`,
  MSG02: "Bạn không có quyền thực hiện thao tác này.",
  MSG04: (service: string) =>
    `Dịch vụ ${service} không phản hồi. Thao tác chưa được thực hiện và dữ liệu trong OMTS không thay đổi; vui lòng thử lại sau.`,
  MSG07: "Mất kết nối. Dữ liệu được giữ tạm trên máy và đồng bộ khi có mạng; dữ liệu cần bảo vệ không hiển thị từ bản lưu trên máy.",
  MSG10: (what: string) => `Đã lưu ${what}.`,
  MSG13: "Tài khoản này hiện không sử dụng được. Vui lòng liên hệ kênh hỗ trợ.",
  MSG19: "Phiên đăng nhập đã hết hạn. Vui lòng liên kết lại tài khoản.",
  MSG20: "Bạn không thể tự đổi tên đăng nhập. Vui lòng liên hệ Chủ HTX hoặc kênh hỗ trợ.",
  MSG21: (channel: string) => `Kênh ${channel} chưa được cấu hình hoặc chưa đủ điều kiện nên chưa bật được.`,
  MSG22: "Thiết bị đã từ chối nhận thông báo đẩy. Các kênh hợp lệ khác vẫn được lưu.",
  MSG23: "Mục thông báo này là bắt buộc, không tắt được.",
  MSG57: "Hồ sơ cũ tạm ẩn cho tới khi hoàn tất xác minh danh tính.",
  MSG69: "Bạn đã thử quá số lần cho phép. Vui lòng thử lại sau 15 phút.",
  UNEXPECTED: "Đã có lỗi không mong muốn. Vui lòng thử lại sau.",
} as const;

/** Chữ của luồng "Liên kết tài khoản" (không có trong danh sách SRS; mobile không có mật khẩu). */
export const LINK = {
  why: "Để biết bạn là nhân viên hay thương lái nào của HTX, app cần số điện thoại Zalo của bạn để đối chiếu với hồ sơ đã đăng ký. Zalo sẽ hỏi bạn có đồng ý chia sẻ không; từ chối thì bạn vẫn tra cứu truy xuất bình thường.",
  declined:
    "Bạn chưa chia sẻ số điện thoại nên chưa liên kết được. Zalo ghi nhớ lựa chọn này: muốn liên kết, bấm “Mở cài đặt quyền của Zalo”, bật Số điện thoại rồi bấm liên kết lại.",
  notInZalo: "Liên kết tài khoản chỉ thực hiện được khi mở app trong ứng dụng Zalo trên điện thoại.",
  notSupported: "Máy chủ OMTS chưa hỗ trợ liên kết tài khoản Zalo. Vui lòng thử lại sau.",
  phoneNotFound: (maskedPhone: string) =>
    `Chưa có tài khoản OMTS nào dùng số ${maskedPhone}. Nếu bạn là thương lái, gửi yêu cầu để HTX duyệt. Nếu bạn là nhân viên HTX, nhờ Chủ HTX nhập đúng số Zalo vào hồ sơ rồi liên kết lại.`,
  requestIntro: "HTX sẽ xem yêu cầu và duyệt tài khoản thương lái cho bạn. Số điện thoại Zalo được gửi kèm để HTX nhận ra bạn.",
  requestSent: "Đã gửi yêu cầu. Khi HTX duyệt, bạn mở lại app là vào được ngay.",
  pending: (name: string) => `Yêu cầu tài khoản thương lái của ${name || "bạn"} đang chờ HTX duyệt. Khi được duyệt, bạn mở lại app là vào được ngay.`,
  rejected: (reason: string | null) => `HTX chưa duyệt yêu cầu của bạn.${reason ? ` Lý do: ${reason}.` : ""} Bạn có thể liên hệ HTX hoặc gửi lại yêu cầu.`,
  linked: "Đã liên kết tài khoản. Lần sau mở app không cần liên kết lại.",
} as const;

/** Tên trường trong MSG01. */
export const FIELD = {
  displayName: "Tên hiển thị",
  reason: "Lý do",
} as const;

/** Tên trường backend gửi trong `field` của MSG01 (tiếng Anh) → tên hiện cho người dùng. */
const SERVER_FIELD: Record<string, string> = {
  "Display name": FIELD.displayName,
  Reason: FIELD.reason,
  Note: "Lời nhắn",
  "Phone number": "Số điện thoại",
  Email: "Email",
  Page: "Trang",
  "Page size": "Số dòng mỗi trang",
};

/**
 * Chữ tiếng Việt cho từng mã lỗi backend (`UserMessages.cs`). Mã có tham số mà server chỉ đưa vào `detail`
 * (tên người sửa, danh sách bản ghi…) thì hiện câu chung không kèm tham số.
 */
const SERVER_TEXT: Record<string, string | ((details: ProblemDetails) => string)> = {
  MSG01: (d) => MESSAGES.MSG01(SERVER_FIELD[String(d.field ?? "")] ?? "Thông tin đã nhập"),
  MSG02: MESSAGES.MSG02,
  MSG03: "Bản ghi này đã tồn tại. Hệ thống mở bản ghi có sẵn để bạn kiểm tra, không tạo bản sao.",
  MSG04: (d) => MESSAGES.MSG04(/Zalo/i.test(String(d.detail ?? "")) ? "Zalo" : "bên ngoài"),
  MSG05: "Không thực hiện được thao tác với tệp. Dữ liệu gốc không thay đổi; vui lòng thử lại.",
  MSG06: "Dữ liệu vừa được người khác cập nhật. Thay đổi của bạn chưa được lưu; vui lòng xem bản mới rồi lưu lại hoặc hủy.",
  MSG08: "Không có dữ liệu trong phạm vi đã chọn.",
  MSG11: "Không thể tiếp tục vì vẫn còn bản ghi liên quan đang sử dụng. Vui lòng xử lý các bản ghi đó trước.",
  MSG12: "Thông tin đăng nhập không đúng. Vui lòng kiểm tra và thử lại.",
  MSG13: MESSAGES.MSG13,
  MSG19: MESSAGES.MSG19,
  MSG20: MESSAGES.MSG20,
  MSG21: "Kênh thông báo này chưa được cấu hình hoặc chưa đủ điều kiện nên chưa bật được.",
  MSG22: MESSAGES.MSG22,
  MSG23: MESSAGES.MSG23,
  MSG28: "Giá trị nhỏ nhất phải nhỏ hơn giá trị lớn nhất.",
  MSG41: "Số tiền phải là bội số của 1.000 đồng.",
  MSG45: "Giá trị vượt quá giới hạn cho phép.",
  MSG57: MESSAGES.MSG57,
  MSG59: "Số lượng phải lớn hơn 0 và đơn giá không được âm.",
  MSG61: "Không đổi được trạng thái: trạng thái hiện tại của bản ghi không cho phép thao tác này.",
  MSG68: "Mật khẩu tạm đã hết hạn. Vui lòng nhờ Chủ HTX cấp lại.",
  MSG69: MESSAGES.MSG69,
  NOT_FOUND: "Bản ghi không tồn tại.",
  UNEXPECTED_ERROR: MESSAGES.UNEXPECTED,
  TOO_MANY_REQUESTS: "Bạn thao tác quá nhanh. Vui lòng đợi một phút rồi thử lại.",
  PASSWORD_CHANGE_REQUIRED: "Tài khoản cần đổi mật khẩu tạm trên bản web trước khi dùng tiếp.",
  MSG67: "Tài khoản cần số điện thoại đã xác minh. Vui lòng liên kết lại bằng số điện thoại Zalo.",
  ZALO_TOKEN_INVALID: "Không xác minh được tài khoản Zalo. Vui lòng mở OMTS từ Zalo và thử lại.",
  ZALO_PHONE_TOKEN_INVALID: "Không đọc được số điện thoại từ Zalo. Vui lòng thử lại.",
  ZALO_PHONE_UNSUPPORTED: "OMTS chỉ dùng số điện thoại Việt Nam. Vui lòng dùng tài khoản Zalo có số Việt Nam.",
  ZALO_ALREADY_LINKED: "Tài khoản Zalo này đã liên kết với một tài khoản OMTS khác.",
  ZALO_ACCOUNT_EXISTS: "Số điện thoại này đã có tài khoản OMTS. Vui lòng bấm liên kết tài khoản.",
  ZALO_NOT_LINKED: "Tài khoản Zalo này chưa liên kết với OMTS.",
  ZALO_APPROVAL_PENDING: "Yêu cầu của bạn đã được gửi. Vui lòng chờ HTX duyệt.",
  ZALO_REQUEST_REJECTED: (d) => LINK.rejected((d.reason as string | null) ?? null),
};

/** Chữ hiện cho người dùng khi một lời gọi API thất bại: luôn tiếng Việt, theo mã lỗi server trả. */
export function errorText(error: unknown): string {
  if (error instanceof ApiError) {
    const text = SERVER_TEXT[error.code];
    if (typeof text === "function") return text({ ...error.details, detail: error.message });
    if (text) return text;
    return error.status === 401 ? MESSAGES.MSG19 : error.status === 403 ? MESSAGES.MSG02 : MESSAGES.UNEXPECTED;
  }
  if (isNetworkError(error)) return MESSAGES.MSG07;
  return MESSAGES.UNEXPECTED;
}
