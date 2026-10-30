import { useAtom, useAtomValue } from "jotai";
import { useCallback, useEffect, useState } from "react";
import { Button, Header, Icon, Page, useNavigate } from "zmp-ui";

import type { IconName } from "@/data/features";
import type { Tone } from "@/data/roles";
import { listNotifications, markAllNotificationsRead, markNotificationRead } from "@/services/acs/inbox";
import { errorText } from "@/services/acs/messages";
import type { NotificationView } from "@/services/acs/types";
import { unreadCountAtom } from "@/state/inbox";
import { sessionAtom } from "@/state/session";

type Kind = { title: string; body: (n: NotificationView) => string; icon: IconName; tone: Tone; to?: string };

/**
 * Cách hiện từng loại thông báo của backend (`NotificationTypes`). Server viết tiêu đề và nội dung bằng tiếng
 * Anh nên app không hiện chữ đó: mỗi loại có chữ tiếng Việt riêng, loại chưa biết hiện câu chung.
 * `to`: màn mở ra khi bấm vào.
 */
const KINDS: Record<string, Kind> = {
  TRADER_ACCESS_REQUESTED: {
    title: "Thương lái xin tài khoản",
    body: () => "Có yêu cầu tài khoản thương lái mới từ Zalo. Bấm để xem và duyệt.",
    icon: "zi-user-check",
    tone: "warning",
    to: "/account/trader-requests",
  },
  TRADER_ACCESS_APPROVED: {
    title: "Tài khoản đã được duyệt",
    body: () => "HTX đã duyệt tài khoản thương lái của bạn. Bạn đã dùng được các chức năng của thương lái.",
    icon: "zi-check-circle",
    tone: "success",
  },
  WATER_ALERT: { title: "Cảnh báo chất lượng nước", body: () => "Chỉ số nước tại vùng nuôi vượt ngưỡng đã đặt. Vui lòng kiểm tra ngay.", icon: "zi-warning", tone: "danger" },
  WATER_MEASUREMENT_OVERDUE: {
    title: "Quá hạn đo nước",
    body: (n) => `Vùng ${n.relatedRecordCode ?? ""} đã hơn 1 tháng chưa có số đo nước được xác nhận. Vui lòng đo và ghi nhận.`,
    icon: "zi-clock-1",
    tone: "warning",
  },
  ZONE_LICENSE_EXPIRY: { title: "Giấy phép vùng nuôi sắp hết hạn", body: () => "Có giấy phép vùng nuôi sắp hết hạn hoặc đã hết hạn. Vui lòng gia hạn.", icon: "zi-calendar", tone: "warning" },
  WORK_ASSIGNMENT: { title: "Cập nhật phân công", body: () => "Công việc của bạn vừa được cập nhật. Bấm để xem phân công mới nhất.", icon: "zi-list-1", tone: "neutral", to: "/account/work" },
  EMPLOYEE_LEAVE_REQUESTED: { title: "Yêu cầu nghỉ phép", body: () => "Có nhân viên gửi yêu cầu nghỉ phép. Bấm để xem và phản hồi.", icon: "zi-calendar", tone: "warning", to: "/manage/leave-requests" },
  EMPLOYEE_LEAVE_REVIEWED: { title: "Phản hồi nghỉ phép", body: () => "Chủ HTX đã phản hồi yêu cầu nghỉ phép của bạn. Bấm để xem kết quả.", icon: "zi-user-check", tone: "neutral", to: "/account/work" },
  PAYROLL_SENT_BACK: { title: "Bảng lương bị trả lại", body: () => "Bảng lương được gửi lại để chỉnh sửa.", icon: "zi-note", tone: "warning" },
  NEW_ORDER: { title: "Đơn hàng mới", body: () => "Có đơn hàng mới cần xử lý.", icon: "zi-poll", tone: "neutral" },
  TRACE_QR_SENT: { title: "Đã gửi mã QR truy xuất", body: () => "Mã QR truy xuất nguồn gốc đã được gửi.", icon: "zi-qrline", tone: "success" },
};

const OTHER: Kind = { title: "Thông báo mới", body: () => "Bạn có một thông báo mới từ HTX.", icon: "zi-notif", tone: "neutral" };

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
    <Page className="screen screen--detail" hideScrollbar>
      <Header title={unread > 0 ? `Thông báo (${unread} mới)` : "Thông báo"} className="detail-header" />
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
                const kind = KINDS[n.type] ?? OTHER;
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
          </>
        )}
      </div>
    </Page>
  );
}

export default NotificationsPage;
