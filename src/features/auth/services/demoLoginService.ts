import type { AuthTokens } from "@/features/auth/models/Session";
import { getDefaultStore } from "jotai";

import { deviceName } from "@/features/auth/services/authService";
import { loadPermissions } from "@/features/auth/services/permissionsService";
import { clearSession, setSession } from "@/features/auth/services/sessionService";
import { unreadCountAtom } from "@/features/notifications/state/inboxAtoms";
import { rawRequest } from "@/services/httpClient";
import { zaloAvailable } from "@/services/zaloService";

/**
 * Đăng nhập tài khoản demo chỉ có ở bản dev chạy trên trình duyệt: ngoài Zalo không có định danh Zalo để liên kết.
 * Mật khẩu demo đọc từ `.env.development.local`, bản production không nạp tệp này nên không bao giờ có màn này.
 */
export async function demoLoginAvailable(): Promise<boolean> {
  if (!import.meta.env.DEV || !import.meta.env.VITE_DEV_DEMO_PASSWORD) return false;
  return !(await zaloAvailable());
}

/** Phiên của tài khoản demo qua `POST api/auth/login`, thay phiên đang có (nếu có). */
export async function loginWithDemoAccount(username: string): Promise<void> {
  const password = import.meta.env.VITE_DEV_DEMO_PASSWORD;
  if (!password) throw new Error("Chưa đặt VITE_DEV_DEMO_PASSWORD trong .env.development.local.");
  const tokens = await rawRequest<AuthTokens>("/api/auth/login", {
    method: "POST",
    body: { identifier: username, password, clientType: "Mobile", deviceName: `${deviceName()} · trình duyệt` },
  });
  clearSession();
  getDefaultStore().set(unreadCountAtom, 0);
  setSession(tokens);
  await loadPermissions();
}
