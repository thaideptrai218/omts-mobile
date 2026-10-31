import { api } from "@/shared/api/http";

import type { NotificationPage } from "@/shared/api/account-contracts";

/** Thông báo in-app của người đang đăng nhập (`api/me/notifications`), mới nhất trước. */
export function listNotifications(page = 1, pageSize = 50) {
  return api<NotificationPage>(`/api/me/notifications?page=${page}&pageSize=${pageSize}`);
}

export function markNotificationRead(id: string) {
  return api<void>(`/api/me/notifications/${id}/read`, { method: "POST" });
}

export function markAllNotificationsRead() {
  return api<void>("/api/me/notifications/read-all", { method: "POST" });
}
