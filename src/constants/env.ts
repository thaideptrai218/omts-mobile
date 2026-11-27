/**
 * Cấu hình lúc build. Giá trị đọc từ biến môi trường `VITE_*` (xem `.env.example`);
 * Vite chỉ đưa vào bundle các biến có tiền tố `VITE_`, nên APP_ID và ZMP_TOKEN không lọt ra ngoài.
 */

/**
 * Gốc URL của OMTS.Api, không có dấu "/" cuối. Khi chạy `npm start` để trống: request `/api/...`
 * đi qua proxy của dev server (xem `vite.config.mts`), nên không vướng CORS. Trong Zalo phải là
 * HTTPS trên tên miền (CLAUDE.md mục 7).
 */
export const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? "").replace(/\/+$/, "");

/** Gốc URL của server thử thanh toán, chỉ màn thử ở bản dev dùng. */
export const PAYMENT_SANDBOX_URL = (import.meta.env.VITE_PAYMENT_SANDBOX_URL ?? "").replace(/\/+$/, "");

/** Làm mới access token khi còn ít hơn chừng này (ms) để request không rơi đúng lúc hết hạn. */
export const ACCESS_TOKEN_SKEW_MS = 30_000;

/** Khóa Tilemap công khai của bản đồ; đặt giới hạn sử dụng trong VIETMAP Console. */
export const VIETMAP_API_KEY = (import.meta.env.VITE_VIETMAP_API_KEY ?? "").trim();
