import { api, rawRequest } from "@/services/api/http";
import { clearSession, getSession, isSignedOut, setSession } from "@/services/session/session";
import { zaloAccessToken, zaloAvailable, zaloPhoneToken } from "@/services/zalo";

import { deviceName } from "./auth";
import type { ZaloLinkResult, ZaloLoginResult } from "./types";

/**
 * "Liên kết tài khoản" (thay cho đăng nhập bằng mật khẩu, CLAUDE.md mục 5 và 9). Hợp đồng API đề xuất
 * cho backend, xem `docs/zalo-account-linking.md`; backend develop chưa có hai endpoint này.
 *
 * - `POST api/auth/zalo/link`: Zalo access token + token số điện thoại. Backend lấy Zalo ID và số thật,
 *   khớp số với tài khoản có số đó, gắn Zalo ID, phát phiên OMTS. Không có tài khoản: 404
 *   ZALO_PHONE_NOT_FOUND; gửi lại với `createTrader: true` thì tạo tài khoản thương lái từ số Zalo.
 * - `POST api/auth/zalo/login`: chỉ Zalo access token; tài khoản đã liên kết thì phát phiên ngay
 *   (mở lại app không phải liên kết lại). Chưa liên kết: 404 ZALO_NOT_LINKED.
 * - `DELETE api/me/zalo-link`: gỡ Zalo ID khỏi tài khoản.
 */

export type LinkOutcome = { tokens: ZaloLinkResult; created: boolean; notice: string | null };

export async function linkZaloAccount(options: { createTrader?: boolean } = {}): Promise<LinkOutcome> {
  const [accessToken, phoneToken] = [await zaloAccessToken(), await zaloPhoneToken()];
  const result = await rawRequest<ZaloLinkResult>("/api/auth/zalo/link", {
    method: "POST",
    body: {
      zaloAccessToken: accessToken,
      phoneToken,
      createTrader: options.createTrader ?? false,
      clientType: "Mobile",
      deviceName: deviceName(),
    },
  });
  setSession(result);
  return { tokens: result, created: result.created, notice: result.notice };
}

/** Phiên OMTS cho tài khoản đã liên kết với người dùng Zalo này. */
export async function loginWithZalo(): Promise<ZaloLoginResult> {
  const result = await rawRequest<ZaloLoginResult>("/api/auth/zalo/login", {
    method: "POST",
    body: { zaloAccessToken: await zaloAccessToken(), clientType: "Mobile", deviceName: deviceName() },
  });
  setSession(result);
  return result;
}

/**
 * Mở app mà không còn phiên trên máy (nativeStorage chưa được cấp quyền, hoặc quá 30 ngày): thử vào
 * lại bằng token Zalo, im lặng. Không bật hộp thoại xin quyền nào. Thất bại, hoặc người dùng đã chủ
 * động đăng xuất, thì vẫn ở trạng thái khách.
 */
export async function silentZaloLogin(): Promise<boolean> {
  if (getSession() || isSignedOut() || !(await zaloAvailable())) return false;
  try {
    await loginWithZalo();
    return true;
  } catch {
    // Chưa liên kết, token hỏng hay mất mạng: ở trạng thái khách, không báo gì.
    return false;
  }
}

/** Gỡ liên kết Zalo khỏi tài khoản rồi xóa phiên trên máy. */
export async function unlinkZaloAccount(): Promise<void> {
  await api("/api/me/zalo-link", { method: "DELETE" });
  clearSession();
}
