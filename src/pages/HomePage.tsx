import NotificationBell from "@/features/notifications/components/NotificationBell/NotificationBell";
import { useAtomValue } from "jotai";
import { Button, Page, useNavigate } from "zmp-ui";

import { AreaCard } from "@/components/AreaCard/AreaCard";
import { seaGreeting } from "@/constants/seaGreetings";
import HomeMenu from "@/features/dashboard/components/HomeMenu/HomeMenu";
import OwnerDashboard from "@/features/dashboard/components/OwnerDashboard/OwnerDashboard";
import PageHeader from "@/components/PageHeader/PageHeader";
import TestRoleSwitcher from "@/features/development/components/TestRoleSwitcher/TestRoleSwitcher";
import TraceLookup from "@/features/traceability/components/TraceLookup/TraceLookup";
import { COOPERATIVE } from "@/constants/cooperative";
import { describeGrants, roleKeyFor } from "@/utils/featureAccess";
import { ROLES } from "@/constants/roles";
import { permissionsAtom, sessionAtom } from "@/features/auth/state/authAtoms";

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
 * lọc theo `GET api/me/permissions`. Số liệu chỉ lấy từ API, hiện có ở Tổng quan của Chủ HTX.
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
          scene
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

  return (
    <Page className="screen screen--with-nav" hideScrollbar>
      <PageHeader
        bell={<NotificationBell />}
        kicker={greeting(now)}
        title={session.displayName}
        subtitle={permissions ? describeGrants(permissions) : undefined}
        scene
      />
      <div className="screen__body">
        <div className="sea-note">
          <p className="sea-note__date">{today(now)}</p>
          <p>{seaGreeting(now)}</p>
        </div>
        {!permissions || !role ? (
          <div className="skeleton skeleton--dashboard" aria-busy />
        ) : permissions.isCooperativeOwner ? (
          <OwnerDashboard role={role} permissions={permissions} />
        ) : permissions.subjectType === "Trader" ? (
          <>
            <AreaCard area="sell" title="Mua hàng của tôi" hint="Đặt lồng, xem phản hồi" onClick={() => navigate("/account/purchases")} />
            <HomeMenu role={role} permissions={permissions} exclude="orders" />
          </>
        ) : (
          <>
            {role.key !== "accountant" && (
              <AreaCard area="people" title="Công việc của tôi" hint="Phân công, chấm công" onClick={() => navigate("/account/work")} />
            )}
            <HomeMenu role={role} permissions={permissions} exclude={role.key !== "accountant" ? "myWork" : undefined} />
            {role.note && <p className="screen__note">{role.note}</p>}
          </>
        )}
        {/* Ô thử vai trò chỉ có ở bản dev; để cuối trang cho trang chủ giống bản thật. */}
        {import.meta.env.DEV && <TestRoleSwitcher key={session.accountId} />}
      </div>
    </Page>
  );
}

export default HomePage;
