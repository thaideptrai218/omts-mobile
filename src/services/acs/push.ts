import { getSystemInfo, getUserID, openPermissionSetting, requestSendNotification } from "zmp-sdk/apis";

import { PUSH_PROVIDER } from "@/config";

import { registerPushDevice } from "./notifications";

/**
 * Xin quyền nhận thông báo và đăng ký thiết bị (ACS-07). Chỉ chạy khi `PUSH_PROVIDER` đã chốt là "zalo";
 * theo quy định của Zalo, phải giải thích lý do trước khi gọi API xin quyền và luôn có lựa chọn từ chối
 * (CLAUDE.md mục 5). Token thiết bị là Zalo user ID; backend gửi thông báo qua OA bằng ID này.
 */

export function pushAvailable() {
  return PUSH_PROVIDER !== "none";
}

function platform(): "ios" | "android" | "web" {
  try {
    const value = getSystemInfo().platform;
    return value === "iOS" ? "ios" : value === "android" ? "android" : "web";
  } catch {
    return "web";
  }
}

export type PushPermissionResult = "granted" | "denied";

/** Hỏi người dùng rồi báo kết quả cho backend; bị từ chối thì ghi nhận permissionGranted=false (MSG22). */
export async function requestPushPermission(): Promise<PushPermissionResult> {
  const token = await getUserID();
  let granted = false;
  try {
    await requestSendNotification();
    granted = true;
  } catch {
    granted = false;
  }
  await registerPushDevice({ token, platform: platform(), permissionGranted: granted });
  return granted ? "granted" : "denied";
}

/** Mở màn cài đặt quyền của Zalo để người dùng bật lại thông báo. */
export async function openPushSettings() {
  try {
    await openPermissionSetting();
  } catch {
    // Ngoài Zalo không mở được; không có gì thêm để làm.
  }
}
