import { useAtomValue } from "jotai";
import { Icon, Page } from "zmp-ui";

import ScreenTitle from "@/components/screen-title";
import { NOTICES } from "@/data/content";
import { roleAtom } from "@/state/role";

function NotificationsPage() {
  const role = useAtomValue(roleAtom);
  const notices = NOTICES[role];
  const unread = notices.filter((n) => n.unread).length;

  return (
    <Page className="screen screen--with-nav screen--plain" hideScrollbar>
      <ScreenTitle title="Thông báo" subtitle={unread > 0 ? `${unread} thông báo chưa đọc` : undefined} />
      <div className="screen__body">
        {notices.length === 0 ? (
          <div className="empty">
            <Icon icon="zi-notif-off" size={32} />
            <p className="empty__title">Chưa có thông báo</p>
            <p className="empty__text">Liên kết tài khoản trong mục Tài khoản để nhận thông báo về đơn hàng và lịch làm việc.</p>
          </div>
        ) : (
          <ul className="notices">
            {notices.map((n) => (
              <li key={n.id} className={`notices__item${n.unread ? " is-unread" : ""}`}>
                <span className={`notices__icon tone-${n.tone}`}>
                  <Icon icon={n.icon} size={20} />
                </span>
                <span className="notices__text">
                  <span className="notices__title">{n.title}</span>
                  <span className="notices__body">{n.body}</span>
                </span>
                <span className="notices__time">{n.time}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </Page>
  );
}

export default NotificationsPage;
