import { atom } from "jotai";

import type { AuthTokens, MyPermissions } from "@/services/acs/types";

/**
 * Phiên đăng nhập hiện tại: đúng những gì `POST api/auth/login` trả về. Bản chính nằm trong bộ nhớ,
 * bản sao trong nativeStorage do `services/session/session.ts` quản lý. UI chỉ đọc, không tự set.
 */
export const sessionAtom = atom<AuthTokens | null>(null);

/** Quyền hiệu lực từ `GET api/me/permissions`; null khi chưa tải hoặc đã đăng xuất. */
export const permissionsAtom = atom<MyPermissions | null>(null);

/** Bật khi làm mới token thất bại: layout hiện MSG19 rồi đưa về màn đăng nhập. */
export const sessionExpiredAtom = atom(false);

/**
 * Cổng chặn sau đăng nhập (ACS-02): bắt đổi mật khẩu tạm trước, rồi bắt xác minh số điện thoại.
 * Khi có cổng, toàn bộ app bị chặn, chỉ còn màn của cổng và nút Đăng xuất.
 */
export type SessionGate = "password" | "phone" | null;

export const gateAtom = atom<SessionGate>((get) => {
  const session = get(sessionAtom);
  if (!session) return null;
  if (session.mustChangePassword) return "password";
  if (session.phoneVerificationRequired) return "phone";
  return null;
});

export const isLoggedInAtom = atom((get) => get(sessionAtom) !== null);

/** Thông báo hiện một lần (snackbar) sau khi điều hướng, ví dụ MSG18 sau khi đổi mật khẩu xong. */
export type FlashMessage = { text: string; type?: "success" | "warning" | "error" | "info"; duration?: number };

export const flashMessageAtom = atom<FlashMessage | null>(null);
