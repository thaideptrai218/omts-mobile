import { ReactNode } from "react";

import NotificationBell from "@/components/notification-bell";

type Props = {
  /** Dòng nhỏ phía trên tiêu đề, ví dụ lời chào. */
  kicker?: string;
  title: string;
  subtitle?: string;
  /** Chuông thông báo ở góc trên bên trái (các trang chính có thanh điều hướng dưới). */
  bell?: boolean;
  children?: ReactNode;
};

/**
 * Dải đầu trang màu xanh Zalo, dùng chung cho mọi tab.
 * Nền xanh đậm giúp chữ trắng của thanh trạng thái và menu Zalo (app-config `textColor: white`) luôn đủ tương phản.
 * Góc trên bên phải được chừa trống cho nút menu cố định của Zalo.
 */
function PageHeader({ kicker, title, subtitle, bell, children }: Props) {
  return (
    <header className="page-header">
      {bell && <NotificationBell />}
      {kicker && <p className="page-header__kicker">{kicker}</p>}
      <h1 className="page-header__title">{title}</h1>
      {subtitle && <p className="page-header__sub">{subtitle}</p>}
      {children}
    </header>
  );
}

export default PageHeader;
