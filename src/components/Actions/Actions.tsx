import { ReactNode } from "react";
/** Các nút thao tác của trang chi tiết: xếp dọc, chiếm hết chiều rộng, cách nhau 12px. */
export function Actions({ children }: { children: ReactNode }) {
  return <div className="action-row">{children}</div>;
}
