import { ReactNode } from "react";

import "@/features/purchasing/components/MetaLines/MetaLines.scss";

/**
 * Các dòng "nhãn: giá trị" trong một hàng danh sách, mỗi thông tin một dòng để đọc được ở cỡ chữ lớn. Dòng có giá trị
 * rỗng được bỏ qua. Chỉ dùng thẻ `span` vì hàng danh sách có thể là một nút bấm.
 */
export function MetaLines({ items }: { items: [string, ReactNode][] }) {
  const shown = items.filter(([, v]) => v !== null && v !== undefined && v !== "");
  return (
    <span className="meta-lines">
      {shown.map(([label, value]) => (
        <span key={label} className="meta-lines__item">
          {label}: <span className="meta-lines__value">{value}</span>
        </span>
      ))}
    </span>
  );
}
