import { atom } from "jotai";

import type { AuthTokens, MyPermissions } from "@/services/acs/types";

/**
 * Phiên hiện tại: đúng những gì `POST api/auth/zalo/link` hoặc `api/auth/zalo/login` trả về. Bản chính nằm trong bộ nhớ,
 * bản sao trong nativeStorage do `services/session/session.ts` quản lý. UI chỉ đọc, không tự set.
 */
export const sessionAtom = atom<AuthTokens | null>(null);

/** Quyền hiệu lực từ `GET api/me/permissions`; null khi chưa tải hoặc đã đăng xuất. */
export const permissionsAtom = atom<MyPermissions | null>(null);

/** Bật khi làm mới token thất bại: layout hiện MSG19 rồi đưa về màn liên kết tài khoản. */
export const sessionExpiredAtom = atom(false);

/** Thông báo hiện một lần (snackbar) sau khi điều hướng, ví dụ "Đã liên kết tài khoản" sau khi liên kết xong. */
export type FlashMessage = { text: string; type?: "success" | "warning" | "error" | "info"; duration?: number };

export const flashMessageAtom = atom<FlashMessage | null>(null);
