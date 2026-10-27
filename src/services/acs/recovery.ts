import { api } from "@/services/api/http";

import type { RecoveryStarted } from "./types";

/**
 * ACS-03 bước 1: luôn trả 202 với MSG15, dù số/email có tồn tại hay không. `requestId` chỉ dẫn tới một
 * yêu cầu thật khi định danh đã xác minh trên tài khoản đang hoạt động. Không có API gửi lại cho khôi
 * phục: muốn mã mới thì gọi lại bước này.
 */
export function startRecovery(identifier: string) {
  return api<RecoveryStarted>("/api/auth/recovery", { method: "POST", body: { identifier: identifier.trim() }, auth: false });
}

/** ACS-03 bước 2: đặt mật khẩu mới bằng token của bước xác minh; mọi phiên của tài khoản bị kết thúc. */
export function resetPassword(verificationToken: string, newPassword: string) {
  return api<{ message: string }>("/api/auth/recovery/reset", {
    method: "POST",
    auth: false,
    body: { verificationToken, newPassword, passwordConfirmation: newPassword },
  });
}
