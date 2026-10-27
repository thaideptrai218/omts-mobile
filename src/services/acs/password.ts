import { api } from "@/services/api/http";
import { setSession } from "@/services/session/session";

import { deviceName } from "./auth";
import type { PasswordChanged, VerificationStarted } from "./types";

/**
 * ACS-04: đổi mật khẩu bằng mật khẩu hiện tại hoặc bằng mã gửi về email đã xác minh. Server kết thúc mọi
 * phiên khác và trả cặp token mới cho máy này; phiên trên máy được thay bằng cặp token đó.
 */
export async function changePassword(proof: { currentPassword?: string; verificationToken?: string }, newPassword: string) {
  const result = await api<PasswordChanged>("/api/me/password", {
    method: "POST",
    body: {
      currentPassword: proof.currentPassword,
      verificationToken: proof.verificationToken,
      newPassword,
      passwordConfirmation: newPassword,
      clientType: "Mobile",
      deviceName: deviceName(),
    },
  });
  setSession(result.tokens);
  return result;
}

/** Gửi mã ChangePassword tới email đã xác minh; chưa có email thì lỗi NO_VERIFIED_EMAIL. */
export function sendPasswordCode() {
  return api<VerificationStarted>("/api/me/password/code", { method: "POST" });
}
