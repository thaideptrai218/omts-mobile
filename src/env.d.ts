/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_VIETMAP_API_KEY?: string;
  /** Gốc URL của OMTS.Api; để trống khi dev để đi qua proxy của dev server. */
  readonly VITE_API_BASE_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
