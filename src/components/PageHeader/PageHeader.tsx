import { ReactNode } from "react";

import { OysterArt } from "@/components/OysterArt/OysterArt";
import { Waves } from "@/components/Waves/Waves";

type Props = {
  /** Dòng nhỏ phía trên tiêu đề, ví dụ lời chào. */
  kicker?: string;
  title: string;
  subtitle?: string;
  /** Chuông thông báo ở góc trên bên trái (các trang chính có thanh điều hướng dưới). */
  bell?: ReactNode;
  children?: ReactNode;
  /** Trang chủ: thêm hình con hàu và sóng cao, sóng trôi nhẹ. */
  scene?: boolean;
};

/**
 * Đầu trang màu biển, viền dưới là sóng bọt trắng tràn vào nền cát.
 * Nền biển đậm giúp chữ trắng của thanh trạng thái và menu Zalo (app-config `textColor: white`) luôn đủ tương phản.
 * Góc trên bên phải được chừa trống cho nút menu cố định của Zalo, nên chuông nằm góc trên bên trái.
 */
function PageHeader({ kicker, title, subtitle, bell, children, scene = false }: Props) {
  return (
    <header className={`page-header${scene ? " page-header--scene" : ""}`}>
      {bell}
      {kicker && <p className="page-header__kicker">{kicker}</p>}
      <h1 className="page-header__title">{title}</h1>
      {subtitle && <p className="page-header__sub">{subtitle}</p>}
      {children}
      {scene && <OysterArt className="page-header__art" />}
      <Waves tall={scene} />
    </header>
  );
}

export default PageHeader;
