import { api } from "@/services/api/http";
import { patchSession } from "@/services/session/session";

import type { ContactChangeStarted, ContactConfirmed, ProfileSaved, ProfileView, VerificationChannel, VerificationStarted } from "./types";

/** ACS-05: hồ sơ của chính mình. Mở được cả khi chưa xác minh số điện thoại (nhân viên xem số Chủ HTX đã nhập). */
export function getProfile() {
  return api<ProfileView>("/api/me/profile");
}

/** Chỉ đổi được tên hiển thị; phải gửi kèm rowVersion đã đọc, lệch thì 409 MSG06. */
export async function updateProfile(displayName: string, rowVersion: string) {
  const saved = await api<ProfileSaved>("/api/me/profile", { method: "PUT", body: { displayName, rowVersion } });
  patchSession({ displayName: saved.profile.displayName });
  return saved;
}

/**
 * Gửi mã tới email hoặc số điện thoại mới (MSG62). Backend đòi mật khẩu hiện tại để một phiên bị đánh cắp
 * không chiếm được liên hệ của tài khoản; liên hệ cũ vẫn dùng cho tới khi xác minh xong.
 */
export function startContactChange(channel: VerificationChannel, target: string, currentPassword: string) {
  return api<ContactChangeStarted>("/api/me/contact-changes", { method: "POST", body: { channel, target, currentPassword } });
}

export function confirmContactChange(verificationToken: string) {
  return api<ContactConfirmed>("/api/me/contact-changes/confirm", { method: "POST", body: { verificationToken } });
}

/** Cổng số điện thoại sau đăng nhập (ACS-02): thương lái nhập số; nhân viên bỏ trống để xác nhận số đã có. */
export function startPhoneVerification(phoneNumber: string | null) {
  return api<VerificationStarted>("/api/me/phone-verification", { method: "POST", body: { phoneNumber } });
}

export async function confirmPhoneVerification(verificationToken: string) {
  const confirmed = await api<ContactConfirmed>("/api/me/phone-verification/confirm", { method: "POST", body: { verificationToken } });
  patchSession({ phoneVerificationRequired: false });
  return confirmed;
}
