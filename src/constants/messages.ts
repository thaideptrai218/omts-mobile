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
