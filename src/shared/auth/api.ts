import { getDefaultStore } from "jotai";
import { getSystemInfo } from "zmp-sdk";

import { ApiError, NetworkError } from "@/shared/api/errors";
import { api } from "@/shared/api/http";
import { clearSession, currentAccessToken, enqueueLogout, getSession, markSignedOut } from "@/shared/auth/session";
import { onlineAtom } from "@/shared/platform/connectivity-state";

const store = getDefaultStore();

/** Tên thiết bị ghi vào phiên để Chủ HTX nhận ra trong danh sách phiên. */
export function deviceName(): string {
  try {
    const info = getSystemInfo();
    return `Zalo Mini App ${info.platform || "unknown"} ${info.zaloVersion || ""}`.trim();
  } catch {
    return "Zalo Mini App";
  }
}

export type LogoutOutcome = "online" | "expired" | "offline";

/**
 * ACS-02 đăng xuất. Có mạng: thu hồi phiên trên server rồi xóa phiên trên máy. Phiên đã hết hạn: vẫn xóa,
 * trả "expired" để UI hiện MSG19. Mất mạng: xóa ngay trên máy, xếp hàng lệnh thu hồi để gửi khi có mạng
 * (MSG07). Dù thế nào máy cũng không còn phiên sau lời gọi này. Liên kết Zalo trên server vẫn giữ,
 * nhưng app không tự vào lại khi mở (cờ đã đăng xuất); bấm "Liên kết tài khoản" là vào lại ngay.
 */
export async function logout(): Promise<LogoutOutcome> {
  const session = getSession();
  if (!session) return "online";
  markSignedOut();

  const queueAndClear = () => {
    clearSession();
    enqueueLogout(session.refreshToken);
    return "offline" as const;
  };

  if (!store.get(onlineAtom)) return queueAndClear();

  let token: string | "none" | "expired";
  try {
    token = await currentAccessToken();
  } catch (error) {
    if (error instanceof NetworkError) return queueAndClear();
    throw error;
  }
  if (token === "none" || token === "expired") {
    clearSession();
    return "expired";
  }

  try {
    await api("/api/auth/logout", { method: "POST", token });
    clearSession();
    return "online";
  } catch (error) {
    if (error instanceof NetworkError) return queueAndClear();
    clearSession();
    return error instanceof ApiError && error.status === 401 ? "expired" : "online";
  }
}
