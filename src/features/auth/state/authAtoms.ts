import type { FlashMessage } from "@/features/auth/models/FlashMessage";
import type { MyPermissions } from "@/features/auth/models/Permissions";
import type { AuthTokens } from "@/features/auth/models/Session";
import { atom } from "jotai";

/**
 * Phiên hiện tại: đúng những gì `POST api/auth/zalo/link` hoặc `api/auth/zalo/login` trả về. Bản chính nằm trong bộ nhớ,
 * bản sao trong nativeStorage do `features/auth/services/sessionService.ts` quản lý. UI chỉ đọc, không tự set.
 */
export const sessionAtom = atom<AuthTokens | null>(null);

/** Quyền hiệu lực từ `GET api/me/permissions`; null khi chưa tải hoặc đã đăng xuất. */
export const permissionsAtom = atom<MyPermissions | null>(null);

/** Bật khi làm mới token thất bại: SessionGuard hiện MSG19 rồi đưa về màn liên kết tài khoản. */
export const sessionExpiredAtom = atom(false);

export const flashMessageAtom = atom<FlashMessage | null>(null);
