/**
 * Nút quét QR ở giữa thanh điều hướng dùng chung cho mọi việc cần quét: đọc nội dung mã rồi mở đúng màn. Hiện
 * có mã truy xuất của hóa đơn bán; điểm danh và các loại mã khác thêm một quy tắc ở đây khi có chức năng.
 */

/** Mã truy xuất do máy chủ cấp cho hóa đơn: 16 byte ngẫu nhiên dạng base64url (22 ký tự). */
const ORIGIN_TOKEN = /^[A-Za-z0-9_-]{16,64}$/;

/**
 * Mã truy xuất trong nội dung QR hoặc chữ người dùng dán vào: đường link `.../origin/<mã>`, deeplink `?origin=<mã>`,
 * hoặc chính mã. Null khi không phải mã truy xuất của OMTS.
 */
export function originTokenFrom(text: string): string | null {
  const value = text.trim();
  const fromLink = /\/origin\/([A-Za-z0-9_-]+)/.exec(value) ?? /[?&]origin=([A-Za-z0-9_-]+)/.exec(value);
  const token = fromLink ? fromLink[1] : value;
  return ORIGIN_TOKEN.test(token) ? token : null;
}

/** Đường dẫn trong app cho nội dung vừa quét, hoặc null khi mã không thuộc OMTS. */
export function routeForScan(content: string): string | null {
  const token = originTokenFrom(content);
  if (token) return `/trace?origin=${encodeURIComponent(token)}`;
  return null;
}
