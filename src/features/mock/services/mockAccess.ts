import type { MyPermissions } from "@/features/auth/models/Permissions";
import type { MockActor } from "@/features/mock/models/MockModule";
import { roleKeyFor } from "@/utils/featureAccess";

/** Thao tác mẫu hiện với ai. Chủ HTX làm được mọi việc của nội bộ, trừ việc riêng của thương lái. */
export function canMock(permissions: MyPermissions | null, who?: MockActor[]) {
  if (!who) return true;
  if (!permissions) return false;
  const role = roleKeyFor(permissions);
  if (role === "owner") return !who.includes("trader");
  return (who as string[]).includes(role);
}
