import type { AreaKey } from "@/models/Navigation";
import type { IconName } from "@/models/UI";
import { ReactNode } from "react";
import { Icon } from "zmp-ui";

type MenuRowItem = {
  key: string;
  title: string;
  hint?: string;
  icon: IconName;
  /** Khu vực của dòng: quyết định màu ô biểu tượng. */
  area?: AreaKey;
  badge?: ReactNode;
  onClick: () => void;
};

/** Danh sách dòng menu lớn: ô biểu tượng màu, tiêu đề đậm, gợi ý ngắn và mũi tên. Mỗi dòng cao tối thiểu 80px. */
export function MenuRows({ items }: { items: MenuRowItem[] }) {
  return (
    <ul className="menu-rows">
      {items.map(({ key, title, hint, icon, area, badge, onClick }) => (
        <li key={key} data-area={area}>
          <button type="button" className="menu-rows__row" onClick={onClick}>
            <span className="menu-rows__icon">
              <Icon icon={icon} />
            </span>
            <span className="menu-rows__text">
              <span className="menu-rows__title">{title}</span>
              {hint && <span className="menu-rows__hint">{hint}</span>}
              {badge && <span className="menu-rows__badge">{badge}</span>}
            </span>
            <Icon icon="zi-chevron-right" className="chevron" />
          </button>
        </li>
      ))}
    </ul>
  );
}
