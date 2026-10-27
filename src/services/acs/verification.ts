import { api } from "@/services/api/http";

import type { VerificationStarted, VerificationTokenIssued } from "./types";

/**
 * ACS-06: mã xác minh 6 số. Mỗi luồng mở yêu cầu từ API riêng của nó (khôi phục mật khẩu, cổng số điện
 * thoại, đổi liên hệ, đổi mật khẩu bằng email; xem recovery.ts, profile.ts, password.ts), còn gửi lại
 * và kiểm tra mã thì dùng chung hai hàm này.
 */

/** Gửi lại mã cho cùng yêu cầu: tối đa 3 lần gửi, cách nhau 60 giây. */
export function resendCode(verificationId: string, loggedIn: boolean) {
  return api<VerificationStarted>(`/api/verifications/${verificationId}/resend`, { method: "POST", auth: loggedIn });
}

/** Mã đúng trả token dùng một lần (10 phút) cho bước kế tiếp; sai thì MSG16, sai 5 lần thì khóa. */
export function verifyCode(verificationId: string, code: string, loggedIn: boolean) {
  return api<VerificationTokenIssued>(`/api/verifications/${verificationId}/verify`, {
    method: "POST",
    body: { code },
    auth: loggedIn,
  });
}
