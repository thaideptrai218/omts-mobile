/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Gốc URL của OMTS.Api; để trống khi dev để đi qua proxy của dev server. */
  readonly VITE_API_BASE_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
