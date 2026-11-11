import { useAtomValue } from "jotai";
import { useLayoutEffect, useRef } from "react";
import { Icon } from "zmp-ui";

import { MESSAGES } from "@/constants/messages";
import { onlineAtom } from "@/services/connectivityState";

/**
 * Băng báo mất mạng cố định ở đỉnh màn hình, chừa góc phải cho menu Zalo. Băng gán chiều cao thật vào --offline-height
 * để đầu trang và thanh "Quay lại" tụt xuống dưới băng, không bị che (chiều cao đổi theo số dòng và cỡ chữ).
 */
function OfflineBanner() {
  const online = useAtomValue(onlineAtom);
  const ref = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const banner = ref.current;
    if (!banner) return;
    const root = document.documentElement;
    const update = () => root.style.setProperty("--offline-height", `${banner.offsetHeight}px`);
    update();
    const observer = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(update);
    observer?.observe(banner);
    return () => {
      observer?.disconnect();
      root.style.removeProperty("--offline-height");
    };
  }, [online]);

  if (online) return null;
  return (
    <div className="offline-banner" role="status" ref={ref}>
      <Icon icon="zi-warning-circle" />
      <span>{MESSAGES.MSG07}</span>
    </div>
  );
}

export default OfflineBanner;
