import type { AreaKey } from "@/models/Navigation";
import { Icon } from "zmp-ui";

import { AreaArt } from "@/components/AreaArt/AreaArt";

/** Thẻ lớn nguyên màu của một khu vực: hình, tên, một dòng ngắn. Dùng cho các lối vào chính ở trang chủ. */
export function AreaCard({ area, title, hint, onClick }: { area: AreaKey; title: string; hint?: string; onClick: () => void }) {
  return (
    <button type="button" className="area-card" data-area={area} onClick={onClick}>
      <span className="area-card__art">
        <AreaArt area={area} />
      </span>
      <span className="area-card__text">
        <span className="area-card__title">{title}</span>
        {hint && <span className="area-card__hint">{hint}</span>}
      </span>
      <Icon icon="zi-chevron-right" className="area-card__chevron" />
    </button>
  );
}
