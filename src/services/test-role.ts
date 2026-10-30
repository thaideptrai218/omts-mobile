import { getDefaultStore } from "jotai";
import type { AuthTokens } from "@/services/acs/types";
import { loadPermissions } from "@/services/acs/permissions";
import { api } from "@/services/api/http";
import { clearSession, setSession } from "@/services/session/session";
import { unreadCountAtom } from "@/state/inbox";

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
