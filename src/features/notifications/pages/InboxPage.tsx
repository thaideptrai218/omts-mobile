import type { NotificationView } from "@/features/notifications/models/Notification";
import { useAtom, useAtomValue } from "jotai";
import { useCallback, useEffect, useState } from "react";
import { Button, Icon, Sheet, useNavigate } from "zmp-ui";

import { ConfirmSheet } from "@/components/ConfirmSheet/ConfirmSheet";
import { Empty } from "@/components/Empty/Empty";
import { Loadable } from "@/components/Loadable/Loadable";
import { ManagePage } from "@/components/ManagePage/ManagePage";
import { listNotifications, markAllNotificationsRead, markNotificationRead } from "@/features/notifications/services/inboxService";
import { kindOf, notificationTarget } from "@/features/notifications/utils/notificationKinds";
import { errorText } from "@/utils/errorText";

import { unreadCountAtom } from "@/features/notifications/state/inboxAtoms";
import { sessionAtom } from "@/features/auth/state/authAtoms";

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
  const [unread, setUnread] = useAtom(unreadCountAtom);
  const [error, setError] = useState("");
  const [confirmReadAll, setConfirmReadAll] = useState(false);
  const [markingAll, setMarkingAll] = useState(false);
  const [shown, setShown] = useState<NotificationView | null>(null);

  const load = useCallback(async () => {
    setError("");
    try {
      const page = await listNotifications();
      setItems(page.items);
      setUnread(page.unreadCount);
    } catch (err) {
      setError(errorText(err));
    }
  }, [setUnread]);

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
    const to = notificationTarget(n);
    if (to) navigate(to);
    else setShown(n);
  };

  const readAll = async () => {
    setMarkingAll(true);
    try {
      await markAllNotificationsRead();
      await load();
    } catch (err) {
      setError(errorText(err));
    } finally {
      setMarkingAll(false);
      setConfirmReadAll(false);
    }
  };

  return (
    <ManagePage title={unread > 0 ? `Thông báo (${unread} mới)` : "Thông báo"}>
      {!session ? (
        <Empty
          icon="zi-notif-off"
          title="Chưa có thông báo"
          text="Liên kết tài khoản để nhận thông báo về đơn hàng, công việc và cảnh báo nước."
          action={
            <Button fullWidth size="large" onClick={() => navigate("/link")}>
              Liên kết tài khoản
            </Button>
          }
        />
      ) : error ? (
        <Empty
          icon="zi-warning-circle"
          title="Không tải được thông báo"
          text={error}
          action={
            <Button fullWidth size="large" onClick={() => void load()}>
              Thử lại
            </Button>
          }
        />
      ) : (
        <Loadable data={items} error="" reload={() => void load()}>
          {(list) =>
            list.length === 0 ? (
              <Empty icon="zi-notif-off" title="Chưa có thông báo" />
            ) : (
              <div className="form">
                {unread > 0 && (
                  <Button fullWidth size="large" variant="secondary" onClick={() => setConfirmReadAll(true)}>
                    Đánh dấu đã đọc tất cả
                  </Button>
                )}
                <ul className="list">
                  {list.map((n) => {
                    const kind = kindOf(n);
                    return (
                      <li key={n.id}>
                        <button type="button" className={`notice${n.readAt ? "" : " is-unread"}`} onClick={() => open(n)}>
                          <span className={`notice__icon tone-${kind.tone}`}>
                            <Icon icon={kind.icon} size={24} />
                          </span>
                          <span className="notice__text">
                            {!n.readAt && <span className="badge badge--new">Mới</span>}
                            <span className="notice__title">{kind.title}</span>
                            <span className="notice__body">{kind.body(n)}</span>
                            <span className="notice__time">{timeOf(n.createdAt)}</span>
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>
            )
          }
        </Loadable>
      )}

      <Sheet visible={!!shown} onClose={() => setShown(null)} autoHeight mask handler title={shown ? kindOf(shown).title : ""}>
        {shown && (
          <div className="sheet-form form">
            <p>{kindOf(shown).body(shown)}</p>
            <p className="form__hint">Nhận lúc {timeOf(shown.createdAt)}. Mục này chưa có màn xem trên điện thoại.</p>
            <Button fullWidth size="large" onClick={() => setShown(null)}>Đóng</Button>
          </div>
        )}
      </Sheet>

      <ConfirmSheet
        visible={confirmReadAll}
        title="Đánh dấu đã đọc tất cả"
        message="Tất cả thông báo mới sẽ chuyển thành đã đọc và không đổi lại được."
        confirmText="Đánh dấu đã đọc"
        busy={markingAll}
        onClose={() => setConfirmReadAll(false)}
        onConfirm={() => void readAll()}
      />
    </ManagePage>
  );
}

export default NotificationsPage;
