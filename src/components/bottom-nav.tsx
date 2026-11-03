import { BottomNavigation, Icon, useLocation, useNavigate } from "zmp-ui";

const TABS = [
  { key: "/", label: "Tổng quan", icon: "zi-home" },
  { key: "/trace", label: "Truy xuất", icon: "zi-qrline" },
  { key: "/notifications", label: "Thông báo", icon: "zi-notif" },
  { key: "/account", label: "Tài khoản", icon: "zi-user" },
] as const;

/** Thanh điều hướng dưới, đúng 4 tab theo hướng dẫn thiết kế của Zalo. Ẩn ở trang chi tiết. */
function BottomNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const isTab = TABS.some((t) => t.key === location.pathname);
  if (!isTab) return null;

  return (
    <BottomNavigation
      fixed
      activeKey={location.pathname}
      onChange={(key) => navigate(key, { animate: false })}
      className="bottom-nav"
    >
      {TABS.map((t) => (
        <BottomNavigation.Item key={t.key} itemKey={t.key} label={t.label} icon={<Icon icon={t.icon} />} />
      ))}
    </BottomNavigation>
  );
}

export default BottomNav;
