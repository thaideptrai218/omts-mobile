import { getDefaultStore } from "jotai";
import type { AuthTokens } from "@/shared/api/account-contracts";
import { loadPermissions } from "@/shared/auth/permissions";
import { api } from "@/shared/api/http";
import { clearSession, setSession } from "@/shared/auth/session";
import { unreadCountAtom } from "@/features/notifications/model/inbox";

export type TestRole = "Owner" | "ZoneManager" | "Employee" | "Trader";
export type TestRoleAvailability = { currentRole: TestRole; roles: TestRole[] };
export const testRoleAvailability = () => api<TestRoleAvailability>("/api/me/test-role");

/** Server phát phiên của hồ sơ thử; không tự đổi role/permission ở frontend. */
export async function switchTestRole(role: TestRole) {
  const tokens = await api<AuthTokens>("/api/me/test-role", { method: "POST", body: { role } });
  clearSession();
  getDefaultStore().set(unreadCountAtom, 0);
  setSession(tokens);
  await loadPermissions();
}
