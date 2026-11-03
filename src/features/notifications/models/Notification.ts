import type { IconName, Tone } from "@/models/UI";

/** Một thông báo in-app của người đang đăng nhập; chưa đọc khi `readAt` rỗng. */
export type NotificationView = {
  id: string;
  type: string;
  title: string;
  body: string | null;
  relatedRecordType: string | null;
  relatedRecordCode: string | null;
  createdAt: string;
  readAt: string | null;
  isMandatory: boolean;
};

/** `GET api/me/notifications`: mới nhất trước, kèm số chưa đọc cho huy hiệu. */
export type NotificationPage = {
  items: NotificationView[];
  total: number;
  unreadCount: number;
};

export type NotificationKind = {
  title: string;
  body: (n: NotificationView) => string;
  icon: IconName;
  tone: Tone;
  to?: string;
};
