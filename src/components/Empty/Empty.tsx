import type { IconName } from "@/models/UI";
import { Icon } from "zmp-ui";

export function Empty({ icon = "zi-inbox", title, text }: { icon?: IconName; title: string; text?: string }) {
  return (
    <div className="empty">
      <span className="empty__badge">
        <Icon icon={icon} size={32} />
      </span>
      <p className="empty__title">{title}</p>
      {text && <p className="empty__text">{text}</p>}
    </div>
  );
}
