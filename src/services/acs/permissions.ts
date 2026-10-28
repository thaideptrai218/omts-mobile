import { getDefaultStore } from "jotai";

import { api } from "@/services/api/http";
import { permissionsAtom } from "@/state/session";

import type { MyPermissions } from "./types";

const store = getDefaultStore();

/**
 * Tải quyền hiệu lực của tài khoản để dựng menu. Mobile không có cổng mật khẩu tạm hay xác minh số
 * điện thoại: số đã được Zalo xác minh lúc liên kết, mật khẩu chỉ dùng cho bản web.
 */
export async function loadPermissions(): Promise<MyPermissions> {
  const permissions = await api<MyPermissions>("/api/me/permissions");
  store.set(permissionsAtom, permissions);
  return permissions;
}

/** Người dùng có quyền xem (hoặc thao tác bất kỳ) trên một chức năng trong danh mục của backend. */
export function hasFunction(permissions: MyPermissions | null, functionCode: string): boolean {
  return permissions?.functions.some((f) => f.function === functionCode && f.actions.length > 0) ?? false;
}
