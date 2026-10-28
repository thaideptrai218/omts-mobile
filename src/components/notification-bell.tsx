import { useAtom, useAtomValue } from "jotai";
import { useEffect } from "react";
import { Icon, useNavigate } from "zmp-ui";

import { listNotifications } from "@/services/acs/inbox";
import { unreadCountAtom } from "@/state/inbox";
import { sessionAtom } from "@/state/session";

/**
 * Chuông thông báo ở góc trên bên trái các trang chính (góc phải là menu cố định của Zalo). Có số chưa đọc thì
 * hiện huy hiệu; số này tải lại mỗi khi trang chính hiện chuông. Chưa liên kết tài khoản thì không hiện.
 */
function NotificationBell() {
  const navigate = useNavigate();
  const session = useAtomValue(sessionAtom);
  const [unread, setUnread] = useAtom(unreadCountAtom);

  useEffect(() => {
    if (!session) {
      setUnread(0);
      return;
    }
    listNotifications(1, 1)
      .then((page) => setUnread(page.unreadCount))
      .catch(() => {
        // Mất mạng: giữ số cũ, băng MSG07 đã báo.
      });
  }, [session, setUnread]);

  if (!session) return null;

  return (
    <button
      type="button"
      className="bell"
      onClick={() => navigate("/notifications")}
      aria-label={unread > 0 ? `Thông báo, ${unread} chưa đọc` : "Thông báo"}
    >
      <Icon icon="zi-notif" size={26} />
      {unread > 0 && <span className="bell__badge">{unread > 99 ? "99+" : unread}</span>}
    </button>
  );
}

export default NotificationBell;
