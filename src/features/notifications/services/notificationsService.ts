import type { NotificationPreferences, NotificationPreferencesSaved, NotificationPushChange } from "@/features/notifications/models/NotificationPreferences";
import type { RegisterPushDeviceRequest } from "@/features/notifications/models/PushDevice";
import { api } from "@/services/httpClient";

/** ACS-07: các loại thông báo áp dụng cho vai trò của tài khoản, mỗi loại có bật đẩy về điện thoại hay không. */
export function getNotificationPreferences() {
  return api<NotificationPreferences>("/api/me/notification-preferences");
}

/** Lưu lựa chọn; `notice` có khi bật đẩy thông báo mà chưa máy nào cho phép nhận. */
export function saveNotificationPreferences(items: NotificationPushChange[]) {
  return api<NotificationPreferencesSaved>("/api/me/notification-preferences", { method: "PUT", body: { items } });
}

/** Đăng ký thiết bị nhận push của tài khoản đang đăng nhập; đăng ký lại cùng token thì cập nhật. */
export function registerPushDevice(request: RegisterPushDeviceRequest) {
  return api<void>("/api/me/devices", { method: "POST", body: request });
}

export function unregisterPushDevice(token: string) {
  return api<void>(`/api/me/devices/${encodeURIComponent(token)}`, { method: "DELETE" });
}
