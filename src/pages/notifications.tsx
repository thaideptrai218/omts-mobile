import { useAtomValue } from "jotai";
import { Button, Icon, Page, useNavigate } from "zmp-ui";

import PageHeader from "@/components/page-header";
import { NOTICES } from "@/data/content";
import { roleKeyFor } from "@/data/feature-access";
import { permissionsAtom, sessionAtom } from "@/state/session";

/** Danh sách thông báo. Vẫn là dữ liệu mẫu theo vai trò gần nhất; module thông báo sẽ nối API sau. */
function NotificationsPage() {
  const navigate = useNavigate();
  const session = useAtomValue(sessionAtom);
  const permissions = useAtomValue(permissionsAtom);
  const notices = session && permissions ? NOTICES[roleKeyFor(permissions)] : [];
  const unread = notices.filter((n) => n.unread).length;

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
        ) : notices.length === 0 ? (
          <div className="empty">
            <span className="empty__badge">
              <Icon icon="zi-notif-off" size={32} />
            </span>
            <p className="empty__title">Chưa có thông báo</p>
          </div>
        ) : (
          <ul className="list">
            {notices.map((n) => (
              <li key={n.id} className={`notice${n.unread ? " is-unread" : ""}`}>
                <span className={`notice__icon tone-${n.tone}`}>
                  <Icon icon={n.icon} size={24} />
                </span>
                <span className="notice__text">
                  {n.unread && <span className="badge badge--new">Mới</span>}
                  <span className="notice__title">{n.title}</span>
                  <span className="notice__body">{n.body}</span>
                  <span className="notice__time">{n.time}</span>
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </Page>
  );
}

export default NotificationsPage;
