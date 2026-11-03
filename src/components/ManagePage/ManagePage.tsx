import { ReactNode } from "react";
import { Header, Page } from "zmp-ui";
/** Khung trang quản lý gồm tiêu đề, nội dung và vùng thao tác cuối trang. */

export function ManagePage({ title, children, footer }: { title: string; children: ReactNode; footer?: ReactNode }) {
  return (
    <Page className={`screen screen--detail${footer ? " screen--with-footer" : ""}`} hideScrollbar>
      <Header title={title} className="detail-header" />
      <div className="screen__body">{children}</div>
      {footer && <div className="page-footer">{footer}</div>}
    </Page>
  );
}
