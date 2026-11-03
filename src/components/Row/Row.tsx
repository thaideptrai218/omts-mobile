import { ReactNode } from "react";
import { Icon } from "zmp-ui";
/** Một dòng trong danh sách: tiêu đề, dòng phụ, nhãn trạng thái, số ở bên phải. Bấm để mở chi tiết. */
export function Row({
  title,
  meta,
  badge,
  value,
  onClick,
}: {
  title: ReactNode;
  meta?: ReactNode;
  badge?: ReactNode;
  value?: ReactNode;
  onClick?: () => void;
}) {
  const body = (
    <>
      <span className="row__text">
        <span className="row__title">{title}</span>
        {meta && <span className="row__meta">{meta}</span>}
        {badge && <span className="row__badges">{badge}</span>}
      </span>
      {value !== undefined && <span className="row__value">{value}</span>}
      {onClick && <Icon icon="zi-chevron-right" className="chevron" />}
    </>
  );
  return (
    <li>
      {onClick ? (
        <button type="button" className="row" onClick={onClick}>
          {body}
        </button>
      ) : (
        <div className="row">{body}</div>
      )}
    </li>
  );
}
