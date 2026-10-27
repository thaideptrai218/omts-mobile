import { useAtomValue } from "jotai";
import { Icon } from "zmp-ui";

import { MESSAGES } from "@/services/acs/messages";
import { onlineAtom } from "@/state/connectivity";

/** Băng MSG07 cố định ở đỉnh màn hình khi mất mạng; chừa góc phải cho menu Zalo. */
function OfflineBanner() {
  const online = useAtomValue(onlineAtom);
  if (online) return null;
  return (
    <div className="offline-banner" role="status">
      <Icon icon="zi-warning-circle" />
      <span>{MESSAGES.MSG07}</span>
    </div>
  );
}

export default OfflineBanner;
