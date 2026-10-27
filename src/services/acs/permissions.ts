import { getDefaultStore } from "jotai";

import { ApiError } from "@/services/api/errors";
import { api } from "@/services/api/http";
import { patchSession } from "@/services/session/session";
import { permissionsAtom } from "@/state/session";

import type { MyPermissions } from "./types";

const store = getDefaultStore();

/**
 * Tải quyền hiệu lực của tài khoản để dựng menu. Server cũng cho biết tài khoản có đang bị cổng chặn
 * không (ví dụ Chủ HTX vừa cấp lại mật khẩu tạm), nên đồng bộ lại cờ của phiên theo câu trả lời.
 */
export async function loadPermissions(): Promise<MyPermissions | null> {
  try {
    const permissions = await api<MyPermissions>("/api/me/permissions");
    store.set(permissionsAtom, permissions);
    patchSession({
      mustChangePassword: permissions.requiresPasswordChange,
      phoneVerificationRequired: permissions.requiresPhoneVerification,
    });
    return permissions;
  } catch (error) {
    // Cổng chặn trả 403 với mã riêng: cập nhật cờ để layout đưa về đúng màn.
    if (error instanceof ApiError && error.code === "PASSWORD_CHANGE_REQUIRED") patchSession({ mustChangePassword: true });
    if (error instanceof ApiError && error.code === "MSG67") patchSession({ phoneVerificationRequired: true });
    throw error;
  }
}

/** Người dùng có quyền xem (hoặc thao tác bất kỳ) trên một chức năng trong danh mục của backend. */
export function hasFunction(permissions: MyPermissions | null, functionCode: string): boolean {
  return permissions?.functions.some((f) => f.function === functionCode && f.actions.length > 0) ?? false;
}
