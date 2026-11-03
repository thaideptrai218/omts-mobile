import { ReactNode } from "react";
/** Các nút thao tác của trang chi tiết, chia đều theo hàng. */
export function Actions({ children }: { children: ReactNode }) {
  return <div className="action-row">{children}</div>;
}
