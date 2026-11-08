import { ReactNode } from "react";
/** Bảng thông tin nhãn/giá trị. Dòng có giá trị rỗng được bỏ qua. */
export function Facts({ items }: { items: [string, ReactNode][] }) {
  const shown = items.filter(([, v]) => v !== null && v !== undefined && v !== "");
  return (
    <dl className="info info--flat card">
      {shown.map(([label, value]) => (
        <div key={label}>
          <dt>{label}</dt>
          <dd>{value}</dd>
        </div>
      ))}
    </dl>
  );
}
