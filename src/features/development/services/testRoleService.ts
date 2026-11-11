import type { AuthTokens } from "@/features/auth/models/Session";
import type { TestRole, TestRoleAvailability } from "@/features/development/models/TestRole";
import { getDefaultStore } from "jotai";

import { loadPermissions } from "@/features/auth/services/permissionsService";
import { silentZaloLogin } from "@/features/auth/services/linkService";
import { api, rawRequest } from "@/services/httpClient";
import { clearSession, setSession } from "@/features/auth/services/sessionService";
import { unreadCountAtom } from "@/features/notifications/state/inboxAtoms";

export const testRoleAvailability = () => api<TestRoleAvailability>("/api/me/test-role");

function adoptTokens(tokens: AuthTokens) {
  clearSession();
  getDefaultStore().set(unreadCountAtom, 0);
  setSession(tokens);
  return loadPermissions();
}

/** Server phát phiên của hồ sơ thử; không tự đổi role/permission ở frontend. */
export async function switchTestRole(role: TestRole) {
  await adoptTokens(await api<AuthTokens>("/api/me/test-role", { method: "POST", body: { role } }));
}

/**
 * Công cụ thử vai trò của backend không có Kế toán, nên dùng tài khoản Kế toán có sẵn của dữ liệu demo.
 * Mật khẩu demo đọc từ `.env.development.local`, tệp bản production không nạp. Phiên kế toán thật không ghi đè quyền nào.
 */
export async function switchToDemoAccountant() {
  const password = import.meta.env.VITE_DEV_DEMO_PASSWORD;
  if (!password) throw new Error("Chưa đặt VITE_DEV_DEMO_PASSWORD trong .env.development.local.");
  await adoptTokens(await rawRequest<AuthTokens>("/api/auth/login", { method: "POST", body: { identifier: "ketoan", password, clientType: "Mobile" } }));
}

/** Từ tài khoản Kế toán demo trở về tài khoản đang liên kết với Zalo. */
export async function returnToLinkedAccount() {
  clearSession();
  getDefaultStore().set(unreadCountAtom, 0);
  if (!(await silentZaloLogin())) throw new Error("Chưa vào lại được tài khoản đang liên kết. Hãy mở lại app.");
  await loadPermissions();
}
