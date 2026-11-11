/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_VIETMAP_API_KEY?: string;
  /** Gốc URL của OMTS.Api; để trống khi dev để đi qua proxy của dev server. */
  readonly VITE_API_BASE_URL?: string;
  /** Gốc URL của server thử thanh toán (`payment-sandbox`), chỉ dùng ở bản dev. */
  readonly VITE_PAYMENT_SANDBOX_URL?: string;
  /** Mật khẩu tài khoản demo, chỉ bộ thử vai trò ở bản dev dùng. */
  readonly VITE_DEV_DEMO_PASSWORD?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
