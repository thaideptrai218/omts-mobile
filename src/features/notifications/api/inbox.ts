import { api } from "@/shared/api/http";

import { parseNotificationPage } from "@/features/notifications/model/inbox-contract";

/** Thông báo in-app của người đang đăng nhập (`api/me/notifications`), mới nhất trước. */
export function listNotifications(page = 1, pageSize = 50) {
  return api<unknown>(`/api/me/notifications?page=${page}&pageSize=${pageSize}`).then(parseNotificationPage);
}

export function markNotificationRead(id: string) {
  return api<void>(`/api/me/notifications/${id}/read`, { method: "POST" });
}

export function markAllNotificationsRead() {
  return api<void>("/api/me/notifications/read-all", { method: "POST" });
}
