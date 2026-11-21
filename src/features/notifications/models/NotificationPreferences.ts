/**
 * Tùy chọn thông báo (ACS-07) theo backend: mỗi loại thông báo luôn có trong app; người dùng chỉ chọn có đẩy về điện thoại
 * (push) hay không. Loại bắt buộc thì luôn đẩy, không tắt được.
 */
export type NotificationTypePreference = {
  type: string;
  /** Tên tiếng Anh của backend; app hiện tên tiếng Việt theo `KINDS`. */
  name: string;
  mandatory: boolean;
  push: boolean;
};

/** `pushAllowedOnDevice`: có ít nhất một máy đang đăng nhập đã cho phép OMTS gửi thông báo. */
export type NotificationPreferences = {
  types: NotificationTypePreference[];
  pushAllowedOnDevice: boolean;
};

/** Một thay đổi: loại không gửi lên thì giữ lựa chọn cũ. */
export type NotificationPushChange = {
  type: string;
  push: boolean;
};

/** `notice` là MSG-ACCOUNT-21 khi bật push mà chưa máy nào cho phép nhận thông báo; lựa chọn vẫn được lưu. */
export type NotificationPreferencesSaved = NotificationPreferences & {
  message: string;
  messageCode: string;
  notice: string | null;
  noticeCode: string | null;
};
