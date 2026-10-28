import { api, rawRequest } from "@/services/api/http";
import { clearSession, getSession, isSignedOut, setSession } from "@/services/session/session";
import { zaloAccessToken, zaloAvailable, zaloPhoneToken } from "@/services/zalo";

import { deviceName } from "./auth";
import type { ZaloLinkResult, ZaloLoginResult } from "./types";

/**
 * "Liên kết tài khoản": cách duy nhất để vào phần quản trị trên mobile (CLAUDE.md mục 5 và 9). Không có
 * mật khẩu, mã xác minh, quên mật khẩu hay tự tạo tài khoản. Hợp đồng API đề xuất cho backend, xem
 * `docs/zalo-account-linking.md`; backend develop chưa có các endpoint này.
 *
 * - `POST api/auth/zalo/link`: Zalo access token + token số điện thoại. Backend lấy Zalo ID và số thật,
 *   khớp số với tài khoản HTX đã tạo sẵn, gắn Zalo ID, phát phiên OMTS. Không có tài khoản: 404
 *   ZALO_PHONE_NOT_FOUND, người dùng nhờ HTX nhập đúng số Zalo vào hồ sơ.
 * - `POST api/auth/zalo/login`: chỉ Zalo access token; tài khoản đã liên kết thì phát phiên ngay
 *   (mở lại app không phải liên kết lại). Chưa liên kết: 404 ZALO_NOT_LINKED.
 * - `DELETE api/me/zalo-link`: gỡ Zalo ID khỏi tài khoản.
 */

/** Liên kết bằng số điện thoại Zalo; trả `notice` (MSG57) nếu server có lưu ý. */
export async function linkZaloAccount(): Promise<string | null> {
  const [accessToken, phoneToken] = [await zaloAccessToken(), await zaloPhoneToken()];
  const result = await rawRequest<ZaloLinkResult>("/api/auth/zalo/link", {
    method: "POST",
    body: { zaloAccessToken: accessToken, phoneToken, clientType: "Mobile", deviceName: deviceName() },
  });
  setSession(result);
  return result.notice;
}

/** Phiên OMTS cho tài khoản đã liên kết với người dùng Zalo này (vào lại im lặng khi mở app). */
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
