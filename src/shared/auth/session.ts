import { getDefaultStore } from "jotai";

import { ACCESS_TOKEN_SKEW_MS } from "@/shared/config/env";
import type { AuthTokens } from "@/shared/api/account-contracts";
import { ApiError, NetworkError } from "@/shared/api/errors";
import { rawRequest, setAuthProvider } from "@/shared/api/http";
import { permissionsAtom, sessionAtom, sessionExpiredAtom } from "@/shared/auth/state";

import { readJson, removeKey, writeJson } from "@/shared/auth/storage";

/**
 * Phiên đăng nhập (OMTS-215): token giữ trong bộ nhớ (atom) và sao lưu vào nativeStorage để mở lại app
 * không phải đăng nhập lại trong 30 ngày (refresh token Mobile). Access token 15 phút được làm mới
 * ngầm; nhiều request cùng lúc chỉ gây một lần làm mới. Mọi thay đổi phiên đi qua module này.
 */

const SESSION_KEY = "omts.session";
const LOGOUT_QUEUE_KEY = "omts.logoutQueue";
const SIGNED_OUT_KEY = "omts.signedOut";

const store = getDefaultStore();
let refreshing: Promise<boolean> | null = null;
/** Refresh token của các phiên đã đăng xuất lúc mất mạng, chờ thu hồi trên server. */
let logoutQueue: string[] = [];
/**
 * Người dùng đã chủ động đăng xuất: không tự vào lại bằng token Zalo khi mở app, cho tới khi họ bấm
 * "Liên kết tài khoản" lần nữa. Không có cờ này thì đăng xuất vô nghĩa trên máy đã liên kết.
 */
let signedOut = false;

export function getSession(): AuthTokens | null {
  return store.get(sessionAtom);
}

/** Gọi một lần khi mở app, trước khi render: đọc phiên đã lưu; bỏ nếu refresh token đã hết hạn. */
export function restoreSession() {
  const saved = readJson<AuthTokens>(SESSION_KEY);
  if (saved && typeof saved.refreshToken === "string" && Date.parse(saved.refreshTokenExpiresAt) > Date.now()) {
    store.set(sessionAtom, saved);
  } else if (saved) {
    removeKey(SESSION_KEY);
  }
  logoutQueue = readJson<string[]>(LOGOUT_QUEUE_KEY) ?? [];
  signedOut = readJson<boolean>(SIGNED_OUT_KEY) === true;
}

/** Có phiên mới (liên kết hoặc vào lại bằng Zalo): bỏ trạng thái đã đăng xuất. */
export function setSession(tokens: AuthTokens) {
  store.set(sessionAtom, tokens);
  writeJson(SESSION_KEY, tokens);
  if (signedOut) {
    signedOut = false;
    removeKey(SIGNED_OUT_KEY);
  }
}

export function markSignedOut() {
  signedOut = true;
  writeJson(SIGNED_OUT_KEY, true);
}

export function isSignedOut() {
  return signedOut;
}

export function patchSession(patch: Partial<AuthTokens>) {
  const current = getSession();
  if (current) setSession({ ...current, ...patch });
}

/** Xóa phiên trên máy và mọi dữ liệu bảo vệ đang giữ trong bộ nhớ (quyền). */
export function clearSession() {
  store.set(sessionAtom, null);
  store.set(permissionsAtom, null);
  removeKey(SESSION_KEY);
}

/** Phiên không còn dùng được: xóa và báo cho layout hiện MSG19. */
export function expireSession() {
  clearSession();
  store.set(sessionExpiredAtom, true);
}

function isAccessTokenFresh(session: AuthTokens) {
  return Date.parse(session.accessTokenExpiresAt) - Date.now() > ACCESS_TOKEN_SKEW_MS;
}

/**
 * Đổi refresh token lấy cặp token mới; các lời gọi song song dùng chung một request.
 * false khi server từ chối (phiên đã bị thu hồi hoặc hết hạn); lỗi mạng được ném ra để UI hiện MSG07.
 */
export function refreshSession(): Promise<boolean> {
  if (refreshing) return refreshing;
  refreshing = (async () => {
    const current = getSession();
    if (!current) return false;
    try {
      const tokens = await rawRequest<AuthTokens>("/api/auth/refresh", {
        method: "POST",
        body: { refreshToken: current.refreshToken },
      });
      setSession(tokens);
      return true;
    } catch (error) {
      if (error instanceof NetworkError) throw error;
      return false;
    } finally {
      refreshing = null;
    }
  })();
  return refreshing;
}

/** Access token còn hạn để gắn vào request; làm mới trước nếu sắp hết. */
export async function currentAccessToken(): Promise<string | "none" | "expired"> {
  const current = getSession();
  if (!current) return "none";
  if (isAccessTokenFresh(current)) return current.accessToken;
  const refreshed = await refreshSession();
  return refreshed ? (getSession()?.accessToken ?? "expired") : "expired";
}

setAuthProvider({ getAccessToken: currentAccessToken, refresh: refreshSession, onExpired: expireSession });

/* ---------- Đăng xuất khi mất mạng: xếp hàng lệnh thu hồi phiên ---------- */

export function enqueueLogout(refreshToken: string) {
  logoutQueue = [...logoutQueue, refreshToken];
  writeJson(LOGOUT_QUEUE_KEY, logoutQueue);
}

let flushing = false;

/**
 * Gửi các lệnh thu hồi còn chờ. `POST api/auth/logout` cần access token mà token cũ chắc chắn đã hết hạn
 * (15 phút), nên đổi refresh token cũ lấy token mới rồi mới gọi logout; sau bước này refresh token cũ
 * không dùng được nữa. Server trả 401 nghĩa là phiên đã chết sẵn, bỏ khỏi hàng đợi; lỗi mạng thì để lại.
 */
export async function flushLogoutQueue() {
  if (flushing || logoutQueue.length === 0) return;
  flushing = true;
  try {
    for (const refreshToken of [...logoutQueue]) {
      try {
        const tokens = await rawRequest<AuthTokens>("/api/auth/refresh", { method: "POST", body: { refreshToken } });
        await rawRequest("/api/auth/logout", { method: "POST", token: tokens.accessToken });
      } catch (error) {
        if (error instanceof NetworkError || (error instanceof ApiError && error.status >= 500)) return;
      }
      logoutQueue = logoutQueue.filter((t) => t !== refreshToken);
      writeJson(LOGOUT_QUEUE_KEY, logoutQueue);
    }
  } finally {
    flushing = false;
  }
}
