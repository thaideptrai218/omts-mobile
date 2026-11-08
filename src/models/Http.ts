/**
 * Nguồn access token cho các request cần đăng nhập. Do `features/auth/services/sessionService.ts` cung cấp,
 * tách ra để module HTTP không phụ thuộc ngược vào phiên đăng nhập.
 */
export type AuthProvider = {
  /** Token còn hạn (tự làm mới khi sắp hết); "none" khi chưa đăng nhập; "expired" khi không làm mới được. */
  getAccessToken: () => Promise<string | "none" | "expired">;
  /** Làm mới sau khi server trả 401; true khi đã có token mới. */
  refresh: () => Promise<boolean>;
  /** Phiên không còn dùng được: xóa phiên và báo MSG19. */
  onExpired: () => void;
};

export type RequestOptions = {
  method?: "GET" | "POST" | "PUT" | "DELETE";
  body?: unknown;
  /** false: không gắn token cho API công khai. Mặc định true. */
  auth?: boolean;
  /** Token dùng riêng cho request này (đăng xuất, xả hàng đợi thu hồi phiên). */
  token?: string;
};
