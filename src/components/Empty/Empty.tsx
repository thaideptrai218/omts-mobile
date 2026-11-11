import type { IconName } from "@/models/UI";
import { ReactNode } from "react";
import { Icon } from "zmp-ui";

import { OysterArt } from "@/components/OysterArt/OysterArt";

/** Màn trống. Không truyền `icon` thì hiện hình con hàu; `icon` dùng khi cần nói rõ lý do, ví dụ ổ khóa khi chưa có quyền. */
export function Empty({ icon, title, text, action }: { icon?: IconName; title: string; text?: string; action?: ReactNode }) {
  return (
    <div className="empty">
      <span className={`empty__badge${icon ? "" : " empty__badge--art"}`}>
        {icon ? <Icon icon={icon} size={36} /> : <OysterArt />}
      </span>
      <p className="empty__title">{title}</p>
      {text && <p className="empty__text">{text}</p>}
      {action && <div className="empty__action">{action}</div>}
    </div>
  );
}
