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

/**
 * Kênh push chưa được chốt ở OMTS-215 (Zalo OA/ZNS hay thông báo Mini App). Khi còn "none", màn
 * tùy chọn thông báo hiện Push là chưa khả dụng. Đổi sang "zalo" khi PM chốt: app sẽ xin quyền
 * nhận thông báo và đăng ký thiết bị với backend (xem `services/acs/push.ts`).
 */
export const PUSH_PROVIDER: "none" | "zalo" = "none";

/** Làm mới access token khi còn ít hơn chừng này (ms) để request không rơi đúng lúc hết hạn. */
export const ACCESS_TOKEN_SKEW_MS = 30_000;
