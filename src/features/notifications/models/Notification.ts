import type { IconName, Tone } from "@/models/UI";

/** Một giá trị trong tham số của thông báo: chữ, số, ngày dạng chuỗi, đúng/sai, danh sách hoặc nhóm giá trị. */
export type NotificationParam = string | number | boolean | null | NotificationParam[] | { [key: string]: NotificationParam };

/** Tham số của `messageCode` (MSG-SALE-01…): tên bè, số lồng, số kg… để app tự viết câu tiếng Việt. */
export type NotificationParams = { [key: string]: NotificationParam };

/** Một thông báo in-app của người đang đăng nhập; chưa đọc khi `readAt` rỗng. */
export type NotificationView = {
  id: string;
  type: string;
  /** Tiêu đề tiếng Anh của server, app không hiện. */
  title: string;
  /** Nội dung tiếng Anh của server, app không hiện. */
  body: string | null;
  /** Mã thông điệp SRS; rỗng ở các thông báo cũ. */
  messageCode: string | null;
  messageParams: NotificationParams | null;
  mandatory: boolean;
  relatedRecordType: string | null;
  relatedRecordId: string | null;
  relatedRecordCode: string | null;
  createdAt: string;
  readAt: string | null;
};

/** `GET api/me/notifications`: mới nhất trước, kèm số chưa đọc cho huy hiệu. */
export type NotificationPage = {
  items: NotificationView[];
  total: number;
  unreadCount: number;
};

/** Cách hiện một loại thông báo: chữ tiếng Việt, biểu tượng, mức độ và màn mở ra khi bấm (không có thì hiện nội dung đầy đủ). */
export type NotificationKind = {
  title: string;
  body: (n: NotificationView) => string;
  icon: IconName;
  tone: Tone;
  /** Null: thông báo này không đủ thông tin để mở màn, hiện nội dung đầy đủ. */
  to?: (n: NotificationView) => string | null;
};
