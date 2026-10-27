import { getDefaultStore } from "jotai";
import { getNetworkType, onNetworkStatusChange } from "zmp-sdk/apis";

import { flushLogoutQueue } from "@/services/session/session";
import { onlineAtom } from "@/state/connectivity";

const store = getDefaultStore();

/**
 * Theo dõi kết nối mạng để hiện băng MSG07 và xả hàng đợi thu hồi phiên khi có mạng trở lại.
 * Nghe cả sự kiện của trình duyệt (chạy được khi xem thử bằng `npm start`) lẫn của ZMP SDK (trong Zalo).
 */
export function startConnectivityWatch() {
  const update = (online: boolean) => {
    const wasOnline = store.get(onlineAtom);
    store.set(onlineAtom, online);
    if (online && !wasOnline) void flushLogoutQueue();
  };

  update(typeof navigator === "undefined" || navigator.onLine !== false);
  window.addEventListener("online", () => update(true));
  window.addEventListener("offline", () => update(false));

  try {
    onNetworkStatusChange((data) => update(data.isConnected));
  } catch {
    // Ngoài Zalo không có API này.
  }
  try {
    void getNetworkType()
      .then((info) => update(info.networkType !== "none"))
      .catch(() => undefined);
  } catch {
    // Ngoài Zalo không có API này.
  }

  void flushLogoutQueue();
}
