import type { AuthProvider, RequestOptions } from "@/models/Http";
import type { ProblemDetails } from "@/models/ProblemDetails";
import { API_BASE_URL } from "@/constants/env";
import { MESSAGES } from "@/constants/messages";

import { ApiError, NetworkError, TimeoutError } from "@/services/errors";

let authProvider: AuthProvider | null = null;

export function setAuthProvider(provider: AuthProvider) {
  authProvider = provider;
}

function fallbackText(status: number) {
  return status === 401 ? MESSAGES.MSG19 : status === 403 ? MESSAGES.MSG02 : MESSAGES.UNEXPECTED;
}

/** Tệp server trả đường dẫn tương đối (`/api/public/...`, `/api/files/...`): ghép gốc API để ảnh tải được trong Zalo. */
export function absoluteUrl(path: string | null) {
  if (!path) return null;
  return /^https?:\/\//.test(path) ? path : API_BASE_URL + path;
}

/** Gọi API không qua lớp phiên đăng nhập. Lỗi HTTP thành `ApiError`, lỗi mạng thành `NetworkError`. */
export async function rawRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const headers: Record<string, string> = { Accept: "application/json" };
  if (options.body !== undefined) headers["Content-Type"] = "application/json";
  if (options.token) headers.Authorization = `Bearer ${options.token}`;

  // Chỉ tạo bộ hủy khi người gọi cần: request cũ chạy y như trước.
  const controller = options.signal || options.timeoutMs ? new AbortController() : null;
  let timedOut = false;
  const onAbort = () => controller?.abort();
  if (options.signal?.aborted) throw new DOMException("Đã hủy", "AbortError");
  options.signal?.addEventListener("abort", onAbort, { once: true });
  const timer = options.timeoutMs ? window.setTimeout(() => { timedOut = true; controller?.abort(); }, options.timeoutMs) : 0;
  // Lỗi lúc đang chờ: hết giờ → TimeoutError, người dùng hủy → AbortError, còn lại là mất kết nối.
  const failure = (): Error => (timedOut ? new TimeoutError() : options.signal?.aborted ? new DOMException("Đã hủy", "AbortError") : new NetworkError());

  let response: Response;
  let text: string;
  try {
    response = await fetch(API_BASE_URL + path, {
      method: options.method ?? "GET",
      headers,
      body: options.form ?? (options.body === undefined ? undefined : JSON.stringify(options.body)),
      signal: controller?.signal,
    });
    if (response.status === 204) return undefined as T;
    text = await response.text();
  } catch {
    throw failure();
  } finally {
    window.clearTimeout(timer);
    options.signal?.removeEventListener("abort", onAbort);
  }
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
    const code = problem.legacyCode ?? problem.code ?? problem.title ?? `HTTP_${response.status}`;
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
