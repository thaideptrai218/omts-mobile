import type { MyPermissions } from "@/features/auth/models/Permissions";
import type { Role } from "@/features/dashboard/models/Dashboard";
import type { FeatureKey } from "@/models/Navigation";

import { FEATURE_ROUTES } from "@/constants/features";
import { canUseFeature } from "@/utils/featureAccess";

/** Vai trò có từ ngần này chức năng trở xuống thì liệt kê thẳng trên trang chủ, không chia nhóm. */
export const MAX_DIRECT_FEATURES = 8;

/** Chức năng người dùng được thấy trong một danh sách. Hai chức năng mở cùng một màn thì chỉ giữ dòng đầu. */
export function visibleFeatures(permissions: MyPermissions, keys: FeatureKey[]): FeatureKey[] {
  const seen = new Set<string>();
  return keys.filter((key) => {
    if (!canUseFeature(permissions, key)) return false;
    const destination = FEATURE_ROUTES[key];
    if (!destination) return true;
    if (seen.has(destination)) return false;
    seen.add(destination);
    return true;
  });
}

/** Nhóm chức năng còn nội dung. `index` là vị trí trong `role.actionGroups`, dùng làm tham số của `/menu/:group`. */
export function visibleGroups(permissions: MyPermissions, role: Role) {
  return (role.actionGroups ?? [])
    .map((group, index) => ({ index, title: group.title, hint: group.hint, area: group.area, actions: visibleFeatures(permissions, group.actions) }))
    .filter((group) => group.actions.length > 0);
}

/** Toàn bộ chức năng của vai trò, không chia nhóm. */
export function allVisibleFeatures(permissions: MyPermissions, role: Role): FeatureKey[] {
  const keys = role.actionGroups
    ? role.actionGroups.reduce<FeatureKey[]>((all, group) => all.concat(group.actions), [])
    : role.actions;
  return visibleFeatures(permissions, keys);
}
