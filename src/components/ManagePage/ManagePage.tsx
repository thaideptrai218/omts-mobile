import type { AreaKey } from "@/models/Navigation";
import { ReactNode, useState } from "react";
import { Icon, Page, useLocation, useNavigate } from "zmp-ui";

import { AreaArt } from "@/components/AreaArt/AreaArt";
import { Waves } from "@/components/Waves/Waves";
import { areaForPath } from "@/utils/areas";

/**
 * Khung trang quản lý: thanh "Quay lại", tiêu đề lớn có viền sóng, nội dung và vùng thao tác cuối trang. Thanh trên chừa
 * góc phải cho menu của Zalo. Màn tự đổi nội dung tại chỗ thì truyền `onBack`, mặc định lùi một trang. Màu đầu trang theo
 * khu vực của đường dẫn, hoặc theo `area` nếu truyền vào.
 */
export function ManagePage({
  title,
  children,
  footer,
  onBack,
  area,
}: {
  title: string;
  children: ReactNode;
  footer?: ReactNode;
  onBack?: () => void;
  area?: AreaKey;
}) {
  const navigate = useNavigate();
  const location = useLocation();
  // Chốt màu lúc mở màn: khi chuyển trang, màn cũ còn trên màn hình thêm một nhịp và không được đổi màu theo đường dẫn mới.
  const [pathArea] = useState(() => areaForPath(location.pathname));
  const current = area ?? pathArea;
  return (
    <Page className="screen screen--manage" hideScrollbar data-area={current}>
      <div className="manage-bar">
        <button type="button" className="manage-bar__back" onClick={onBack ?? (() => navigate(-1))}>
          <Icon icon="zi-arrow-left" />
          <span>Quay lại</span>
        </button>
      </div>
      <div className="manage-head">
        <h1 className="manage-title">{title}</h1>
        {current && (
          <span className="manage-head__art">
            <AreaArt area={current} />
          </span>
        )}
        <Waves />
      </div>
      <div className="screen__body">{children}</div>
      {footer && <div className="page-footer">{footer}</div>}
    </Page>
  );
}
