import { API_BASE_URL } from "@/config";
import { MESSAGES } from "@/services/acs/messages";

import { ApiError, NetworkError, type ProblemDetails } from "./errors";

/**
 * Nguồn access token cho các request cần đăng nhập. Do `services/session/session.ts` cung cấp,
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

let authProvider: AuthProvider | null = null;

export function setAuthProvider(provider: AuthProvider) {
  authProvider = provider;
}

export type RequestOptions = {
  method?: "GET" | "POST" | "PUT" | "DELETE";
  body?: unknown;
  /** false: không gắn token cho API công khai. Mặc định true. */
  auth?: boolean;
  /** Token dùng riêng cho request này (đăng xuất, xả hàng đợi thu hồi phiên). */
  token?: string;
};

function fallbackText(status: number) {
  return status === 401 ? MESSAGES.MSG19 : status === 403 ? MESSAGES.MSG02 : MESSAGES.UNEXPECTED;
}

/** Gọi API không qua lớp phiên đăng nhập. Lỗi HTTP thành `ApiError`, lỗi mạng thành `NetworkError`. */
export async function rawRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const headers: Record<string, string> = { Accept: "application/json" };
  if (options.body !== undefined) headers["Content-Type"] = "application/json";
  if (options.token) headers.Authorization = `Bearer ${options.token}`;

  let response: Response;
  try {
    response = await fetch(API_BASE_URL + path, {
      method: options.method ?? "GET",
      headers,
      body: options.body === undefined ? undefined : JSON.stringify(options.body),
    });
  } catch {
    throw new NetworkError();
  }

  if (response.status === 204) return undefined as T;
  const text = await response.text();
  let data: unknown = null;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = null;
    }
  }
  if (!response.ok) {
    const problem = (data ?? {}) as ProblemDetails;
    // OMTS.Api luôn trả problem details có `code`, kể cả lỗi 500. Lỗi 5xx không có thân đó là do proxy hoặc
    // gateway đứng trước (máy chủ không chạy, không với tới được): coi như mất kết nối tới server (MSG07).
    if (response.status >= 500 && !problem.code) throw new NetworkError();
    // Không có mã nghĩa là server không biết đường dẫn này (ví dụ endpoint chưa được triển khai): HTTP_404.
    const code = problem.code ?? problem.title ?? `HTTP_${response.status}`;
    throw new ApiError(response.status, code, problem.detail ?? fallbackText(response.status), problem);
  }
  return data as T;
}

/**
 * Gọi API của OMTS. Request cần đăng nhập được gắn `Authorization: Bearer`; access token sắp hết hạn
 * thì làm mới trước; server trả 401 thì làm mới một lần rồi gọi lại; làm mới thất bại thì phiên hết hạn.
 */
export async function api<T>(path: string, options: RequestOptions = {}): Promise<T> {
  if (options.auth === false || options.token || !authProvider) {
    return rawRequest<T>(path, options);
  }

  const token = await authProvider.getAccessToken();
  if (token === "none") throw new ApiError(401, "MSG19", MESSAGES.MSG19);
  if (token === "expired") {
    authProvider.onExpired();
    throw new ApiError(401, "MSG19", MESSAGES.MSG19);
  }

  try {
    return await rawRequest<T>(path, { ...options, token });
  } catch (error) {
    if (!(error instanceof ApiError) || error.status !== 401) throw error;
    if (await authProvider.refresh()) {
      const fresh = await authProvider.getAccessToken();
      if (fresh !== "none" && fresh !== "expired") {
        return rawRequest<T>(path, { ...options, token: fresh });
      }
    }
    authProvider.onExpired();
    throw new ApiError(401, "MSG19", MESSAGES.MSG19);
  }
}
