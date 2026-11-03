import type { AuthTokens } from "@/features/auth/models/Session";
import type { TestRole, TestRoleAvailability } from "@/features/development/models/TestRole";
import { getDefaultStore } from "jotai";

import { loadPermissions } from "@/features/auth/services/permissionsService";
import { api } from "@/services/httpClient";
import { clearSession, setSession } from "@/features/auth/services/sessionService";
import { unreadCountAtom } from "@/features/notifications/state/inboxAtoms";
export const testRoleAvailability = () => api<TestRoleAvailability>("/api/me/test-role");

/** Server phát phiên của hồ sơ thử; không tự đổi role/permission ở frontend. */
export async function switchTestRole(role: TestRole) {
  const tokens = await api<AuthTokens>("/api/me/test-role", { method: "POST", body: { role } });
  clearSession();
  getDefaultStore().set(unreadCountAtom, 0);
  setSession(tokens);
  await loadPermissions();
}
