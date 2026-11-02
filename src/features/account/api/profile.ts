import { api } from "@/shared/api/http";
import { patchSession } from "@/shared/auth/session";

import type { ProfileSaved, ProfileView } from "@/shared/api/account-contracts";

/** ACS-05: hồ sơ của chính mình. Email và số điện thoại chỉ xem; số điện thoại là số Zalo đã liên kết. */
export function getProfile() {
  return api<ProfileView>("/api/me/profile");
}

/** Chỉ đổi được tên hiển thị; phải gửi kèm rowVersion đã đọc, lệch thì 409 MSG06. */
export async function updateProfile(displayName: string, rowVersion: string) {
  const saved = await api<ProfileSaved>("/api/me/profile", { method: "PUT", body: { displayName, rowVersion } });
  patchSession({ displayName: saved.profile.displayName });
  return saved;
}
