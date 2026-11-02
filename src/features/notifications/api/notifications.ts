import { api } from "@/shared/api/http";

import { parsePushCatalog, parsePushSaved } from "../model/push-contract";
import type { RegisterPushDeviceRequest } from "@/shared/api/account-contracts";

export function getNotificationPreferences() {
  return api<unknown>("/api/me/notification-preferences").then(parsePushCatalog);
}
export function saveNotificationPreferences(items: { type: string; push: boolean }[]) {
  return api<unknown>("/api/me/notification-preferences", { method: "PUT", body: { items } }).then(parsePushSaved);
}

/** Đăng ký thiết bị nhận push của tài khoản đang đăng nhập; đăng ký lại cùng token thì cập nhật. */
export function registerPushDevice(request: RegisterPushDeviceRequest) {
  return api<void>("/api/me/devices", { method: "POST", body: request });
}

export function unregisterPushDevice(token: string) {
  return api<void>(`/api/me/devices/${encodeURIComponent(token)}`, { method: "DELETE" });
}
