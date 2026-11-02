import { Icon, useLocation, useNavigate } from "zmp-ui";

import type { IconName } from "@/shared/navigation/features";
import { useScan } from "@/shared/hooks/use-scan";

const TABS: { key: string; label: string; icon: IconName }[] = [
  { key: "/", label: "Tổng quan", icon: "zi-home" },
  { key: "/account", label: "Tài khoản", icon: "zi-user" },
];

/**
 * Thanh điều hướng dưới: Tổng quan | nút quét QR tròn ở giữa | Tài khoản (2 tab, trong giới hạn 4 tab của Zalo).
 * Nút giữa là hành động, không phải tab: quét xong mở màn theo loại mã (`useScan`). Thông báo nằm ở chuông góc
 * trên bên trái. Ẩn ở trang chi tiết.
 */
function BottomNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const scan = useScan();
  if (!TABS.some((t) => t.key === location.pathname)) return null;

  const tab = ({ key, label, icon }: (typeof TABS)[number]) => {
    const active = location.pathname === key;
    return (
      <button
        key={key}
        type="button"
        className={`tabbar__item${active ? " is-active" : ""}`}
        aria-current={active ? "page" : undefined}
        onClick={() => navigate(key, { animate: false })}
      >
        <span className="tabbar__icon">
          <Icon icon={icon} />
        </span>
        <span className="tabbar__label">{label}</span>
      </button>
    );
  };

  return (
    <nav className="tabbar" aria-label="Điều hướng chính">
      {tab(TABS[0])}
      <button type="button" className="tabbar__scan" onClick={() => void scan()}>
        <span className="tabbar__scan-circle">
          <Icon icon="zi-qrline" size={32} />
        </span>
        <span className="tabbar__label">Quét QR</span>
      </button>
      {tab(TABS[1])}
    </nav>
  );
}

export default BottomNav;
