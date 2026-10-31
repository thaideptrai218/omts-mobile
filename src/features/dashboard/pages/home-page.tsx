import NotificationBell from "@/features/notifications/components/notification-bell";
import { useAtomValue } from "jotai";
import { Button, Icon, Page, useNavigate } from "zmp-ui";

import ActionGrid from "@/features/dashboard/components/action-grid";
import OwnerDashboard from "@/features/dashboard/components/owner-dashboard";
import PageHeader from "@/shared/ui/page-header";
import TestRoleSwitcher from "@/features/development/components/test-role-switcher";
import StatPanel from "@/features/dashboard/components/stat-panel";
import TaskList from "@/features/dashboard/components/task-list";
import TraceLookup from "@/features/traceability/components/trace-lookup";
import { COOPERATIVE } from "@/shared/config/cooperative";
import {
  canUseFeature,
  describeGrants,
  roleKeyFor,
} from "@/shared/navigation/feature-access";
import { ROLES } from "@/shared/navigation/roles";
import { permissionsAtom, sessionAtom } from "@/shared/auth/state";

const TZ = "Asia/Ho_Chi_Minh";

function greeting(now: Date) {
  const hour = Number(
    new Intl.DateTimeFormat("en-GB", {
      hour: "2-digit",
      hour12: false,
      timeZone: TZ,
    }).format(now),
  );
  if (hour < 11) return "Chào buổi sáng";
  if (hour < 14) return "Chào buổi trưa";
  if (hour < 18) return "Chào buổi chiều";
  return "Chào buổi tối";
}

function today(now: Date) {
  return now.toLocaleDateString("vi-VN", {
    weekday: "long",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: TZ,
  });
}

/**
 * Tổng quan. Chưa liên kết: tra cứu truy xuất công khai và lối vào liên kết tài khoản. Đã đăng nhập: chức năng
 * lọc theo `GET api/me/permissions`; số liệu và việc cần làm vẫn là dữ liệu mẫu theo vai trò gần nhất
 * cho tới khi các module đó nối API.
 */
function HomePage() {
  const navigate = useNavigate();
  const session = useAtomValue(sessionAtom);
  const permissions = useAtomValue(permissionsAtom);
  const now = new Date();

  if (!session) {
    return (
      <Page className="screen screen--with-nav" hideScrollbar>
        <PageHeader
          kicker={COOPERATIVE.shortName}
          title="Truy xuất nguồn gốc hàu"
          subtitle="Quét mã QR trên bao bì để xem hàu được nuôi ở đâu và thu hoạch khi nào."
        />
        <div className="screen__body">
          <div className="card">
            <TraceLookup />
          </div>
          <div className="card link-box">
            <p className="link-box__text">
              Nhân viên HTX và thương lái: liên kết tài khoản Zalo một lần để
              xem công việc, đơn hàng và công nợ của mình.
            </p>
            <Button fullWidth size="large" onClick={() => navigate("/link")}>
              Liên kết tài khoản
            </Button>
          </div>
        </div>
      </Page>
    );
  }

  const role = permissions ? ROLES[roleKeyFor(permissions)] : null;
  const actions =
    permissions && role
      ? role.actions.filter((key) => canUseFeature(permissions, key))
      : [];
  const tasks =
    permissions && role
      ? role.tasks.filter((t) => canUseFeature(permissions, t.feature))
      : [];

  return (
    <Page className="screen screen--with-nav" hideScrollbar>
      <PageHeader
        bell={<NotificationBell />}
        kicker={`${greeting(now)}, ${today(now)}`}
        title={session.displayName}
        subtitle={permissions ? describeGrants(permissions) : undefined}
      />
      <div className="screen__body">
        {!permissions || !role ? (
          <div className="skeleton skeleton--dashboard" aria-busy />
        ) : permissions.isCooperativeOwner ? (
          <OwnerDashboard role={role} />
        ) : permissions.subjectType === "Trader" ? (
          <>
            <div className="card form">
              <p className="block__title">Mua hàng cùng HTX</p>
              <p className="form__hint">Chọn sản phẩm, đặt số lồng và gửi yêu cầu đến Chủ HTX. Bạn có thể xem phản hồi trong Mua hàng của tôi.</p>
              <Button fullWidth size="large" onClick={() => navigate("/account/purchases")}>Mua hàng của tôi</Button>
            </div>
            <ActionGrid actions={actions} />
          </>
        ) : (
          <>
            {role.key === "accountant" && <TaskList title={role.tasksTitle} tasks={tasks} />}
            {role.key !== "accountant" && <div className="card form">
              <p className="block__title">Công việc và giờ làm của bạn</p>
              <p className="form__hint">Xem phân công, đưa mã chấm công cho Quản lý vùng và theo dõi giờ đã ghi nhận.</p>
              <Button fullWidth size="large" onClick={() => navigate("/account/work")}>Mở công việc cá nhân</Button>
            </div>}
            <ActionGrid actions={actions} />
            {actions.length === 0 && (
              <div className="empty">
                <span className="empty__badge">
                  <Icon icon="zi-lock" size={32} />
                </span>
                <p className="empty__title">Chưa có chức năng nào</p>
                <p className="empty__text">
                  Tài khoản của bạn chưa được cấp quyền. Liên hệ Chủ HTX để được
                  phân công.
                </p>
              </div>
            )}
            {role.key === "accountant" && <StatPanel stats={role.stats} />}
            {role.note && <p className="screen__note">{role.note}</p>}
          </>
        )}
        {import.meta.env.DEV && <TestRoleSwitcher key={session.accountId} />}
      </div>
    </Page>
  );
}

export default HomePage;
