export type RuntimeConfig = Readonly<{
  apiBaseUrl: string;
}>;

export class RuntimeConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "RuntimeConfigError";
  }
}

const apiBaseUrlFromEnvironment = process.env.EXPO_PUBLIC_API_BASE_URL;

export function parseApiBaseUrl(value: string | undefined): string {
  const candidate = value?.trim();

  if (!candidate) {
    throw new RuntimeConfigError(
      "Thiếu EXPO_PUBLIC_API_BASE_URL. Hãy tạo .env.local từ .env.example và cấu hình URL của OMTS API.",
    );
  }

  let url: URL;

  try {
    url = new URL(candidate);
  } catch {
    throw new RuntimeConfigError(
      "EXPO_PUBLIC_API_BASE_URL phải là một URL đầy đủ, ví dụ http://192.168.1.10:5000.",
    );
  }

  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new RuntimeConfigError(
      "EXPO_PUBLIC_API_BASE_URL chỉ hỗ trợ giao thức http hoặc https.",
    );
  }

  if (url.username || url.password) {
    throw new RuntimeConfigError(
      "Không được đặt thông tin đăng nhập trong EXPO_PUBLIC_API_BASE_URL.",
    );
  }

  if (url.search || url.hash) {
    throw new RuntimeConfigError(
      "EXPO_PUBLIC_API_BASE_URL không được chứa query string hoặc fragment.",
    );
  }

  return url.toString().replace(/\/$/, "");
}

export function getRuntimeConfig(): RuntimeConfig {
  return {
    apiBaseUrl: parseApiBaseUrl(apiBaseUrlFromEnvironment),
  };
}
