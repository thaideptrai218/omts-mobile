/**
 * Nút quét QR ở giữa thanh điều hướng dùng chung cho mọi việc cần quét: đọc nội dung mã rồi mở đúng màn. Hiện
 * có mã truy xuất trên bao bì; điểm danh và các loại mã khác thêm một quy tắc ở đây khi có chức năng.
 */

/** Mã lô in trên bao bì, ví dụ TN-2410-07. */
const LOT_CODE = /^[A-Z]{1,5}-\d{3,6}(-\d{1,4})?$/;

/** Mã lô trong nội dung QR: deeplink `https://zalo.me/s/<id>/?lot=TN-2410-07` hoặc chính mã lô. */
export function lotCodeFrom(text: string): string | null {
  const fromLink = text.match(/[?&]lot=([A-Za-z0-9-]+)/);
  const code = (fromLink ? fromLink[1] : text).trim().toUpperCase();
  return LOT_CODE.test(code) ? code : null;
}

/** Đường dẫn trong app cho nội dung vừa quét, hoặc null khi mã không thuộc OMTS. */
export function routeForScan(content: string): string | null {
  const lot = lotCodeFrom(content);
  if (lot) return `/trace?lot=${encodeURIComponent(lot)}`;
  return null;
}
