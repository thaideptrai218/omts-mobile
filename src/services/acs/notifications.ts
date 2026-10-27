import { api } from "@/services/api/http";

import type { CategoryPreferenceView, NotificationPreferenceChange, NotificationPreferencesSaved, RegisterPushDeviceRequest } from "./types";

/** ACS-07: các nhóm thông báo áp dụng cho loại tài khoản, kèm trạng thái từng kênh. */
export function getNotificationPreferences() {
  return api<CategoryPreferenceView[]>("/api/me/notification-preferences");
}

/** Lưu lựa chọn; `notice` là MSG22 khi bật Push mà máy chưa cho phép nhận thông báo. */
export function saveNotificationPreferences(items: NotificationPreferenceChange[]) {
  return api<NotificationPreferencesSaved>("/api/me/notification-preferences", { method: "PUT", body: { items } });
}

/** Đăng ký thiết bị nhận push của tài khoản đang đăng nhập; đăng ký lại cùng token thì cập nhật. */
export function registerPushDevice(request: RegisterPushDeviceRequest) {
  return api<void>("/api/me/devices", { method: "POST", body: request });
}

export function unregisterPushDevice(token: string) {
  return api<void>(`/api/me/devices/${encodeURIComponent(token)}`, { method: "DELETE" });
}
