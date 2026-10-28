import { useAtomValue } from "jotai";
import { useCallback, useEffect, useState } from "react";
import { Button, Icon, Page, useNavigate } from "zmp-ui";

import PageHeader from "@/components/page-header";
import type { IconName } from "@/data/features";
import type { Tone } from "@/data/roles";
import { listNotifications, markAllNotificationsRead, markNotificationRead } from "@/services/acs/inbox";
import { errorText } from "@/services/acs/messages";
import type { NotificationView } from "@/services/acs/types";
import { sessionAtom } from "@/state/session";

/**
 * Cách hiện từng loại thông báo của backend (`NotificationTypes`). Tiêu đề server viết tiếng Anh; loại đã biết
 * thì hiện tiếng Việt, loại chưa biết thì hiện nguyên chữ server. `to`: màn mở ra khi bấm vào.
 */
const KINDS: Record<string, { title: string; body?: string; icon: IconName; tone: Tone; to?: string }> = {
  TRADER_ACCESS_REQUESTED: { title: "Thương lái xin tài khoản", body: "Có yêu cầu tài khoản thương lái mới từ Zalo. Bấm để xem và duyệt.", icon: "zi-user-check", tone: "warning", to: "/account/trader-requests" },
  TRADER_ACCESS_APPROVED: { title: "Tài khoản đã được duyệt", body: "HTX đã duyệt tài khoản thương lái của bạn.", icon: "zi-check-circle", tone: "success" },
  WATER_ALERT: { title: "Cảnh báo chất lượng nước", icon: "zi-warning", tone: "danger" },
  WATER_MEASUREMENT_OVERDUE: { title: "Quá hạn đo nước", icon: "zi-clock-1", tone: "warning" },
  ZONE_LICENSE_EXPIRY: { title: "Giấy phép vùng nuôi sắp hết hạn", icon: "zi-calendar", tone: "warning" },
};

function timeOf(value: string) {
  const at = new Date(value);
  const sameDay = at.toDateString() === new Date().toDateString();
  const time = { hour: "2-digit", minute: "2-digit" } as const;
  return at.toLocaleString("vi-VN", sameDay ? time : { ...time, day: "2-digit", month: "2-digit" });
}

/** Thông báo in-app của tài khoản đang liên kết (`api/me/notifications`); bấm vào thì đánh dấu đã đọc. */
function NotificationsPage() {
  const navigate = useNavigate();
  const session = useAtomValue(sessionAtom);
  const [items, setItems] = useState<NotificationView[] | null>(null);
  const [unread, setUnread] = useState(0);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setError("");
    try {
      const page = await listNotifications();
      setItems(page.items);
      setUnread(page.unreadCount);
    } catch (err) {
      setError(errorText(err));
    }
  }, []);

  useEffect(() => {
    if (session) void load();
    else setItems(null);
  }, [session, load]);

  const open = (n: NotificationView) => {
    if (!n.readAt) {
      setItems((current) => current?.map((x) => (x.id === n.id ? { ...x, readAt: new Date().toISOString() } : x)) ?? null);
      setUnread((count) => Math.max(0, count - 1));
      void markNotificationRead(n.id).catch(() => undefined);
    }
    const to = KINDS[n.type]?.to;
    if (to) navigate(to);
  };

  const readAll = async () => {
    try {
      await markAllNotificationsRead();
      await load();
    } catch (err) {
      setError(errorText(err));
    }
  };

  return (
    <Page className="screen screen--with-nav" hideScrollbar>
      <PageHeader title="Thông báo" subtitle={unread > 0 ? `Có ${unread} thông báo mới` : undefined} />
      <div className="screen__body">
        {!session ? (
          <div className="empty">
            <span className="empty__badge">
              <Icon icon="zi-notif-off" size={32} />
            </span>
            <p className="empty__title">Chưa có thông báo</p>
            <p className="empty__text">Liên kết tài khoản để nhận thông báo về đơn hàng, công việc và cảnh báo nước.</p>
            <Button size="large" onClick={() => navigate("/link")}>
              Liên kết tài khoản
            </Button>
          </div>
        ) : error ? (
          <div className="empty">
            <p className="empty__title">Không tải được thông báo</p>
            <p className="empty__text">{error}</p>
            <Button size="large" onClick={() => void load()}>
              Thử lại
            </Button>
          </div>
        ) : !items ? (
          <div className="skeleton skeleton--form" aria-busy />
        ) : items.length === 0 ? (
          <div className="empty">
            <span className="empty__badge">
              <Icon icon="zi-notif-off" size={32} />
            </span>
            <p className="empty__title">Chưa có thông báo</p>
          </div>
        ) : (
          <>
            {unread > 0 && (
              <div className="form__links">
                <button type="button" className="link-button" onClick={() => void readAll()}>
                  Đánh dấu đã đọc tất cả
                </button>
              </div>
            )}
            <ul className="list">
              {items.map((n) => {
                const kind = KINDS[n.type] ?? { title: n.title, icon: "zi-notif" as IconName, tone: "neutral" as Tone };
                return (
                  <li key={n.id}>
                    <button type="button" className={`notice${n.readAt ? "" : " is-unread"}`} onClick={() => open(n)}>
                      <span className={`notice__icon tone-${kind.tone}`}>
                        <Icon icon={kind.icon} size={24} />
                      </span>
                      <span className="notice__text">
                        {!n.readAt && <span className="badge badge--new">Mới</span>}
                        <span className="notice__title">{kind.title}</span>
                        {(kind.body ?? n.body) && <span className="notice__body">{kind.body ?? n.body}</span>}
                        <span className="notice__time">{timeOf(n.createdAt)}</span>
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </>
        )}
      </div>
    </Page>
  );
}

export default NotificationsPage;
