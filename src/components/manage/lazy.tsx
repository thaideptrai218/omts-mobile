import { ComponentType, lazy, ReactElement, Suspense } from "react";
import { Header, Page } from "zmp-ui";

/** Khung tạm khi mã của màn đang tải về (lần đầu mở màn đó). */
function PageFallback() {
  return (
    <Page className="screen screen--detail" hideScrollbar>
      <Header title="" className="detail-header" />
      <div className="screen__body">
        <div className="skeleton skeleton--form" aria-busy />
      </div>
    </Page>
  );
}

/**
 * Màn tải theo yêu cầu: mã của màn tách thành file riêng, chỉ tải khi người dùng mở. Giữ gói ban đầu nhỏ để app
 * mở nhanh trong Zalo (CLAUDE.md mục giới hạn kỹ thuật); vai trò không dùng màn đó không phải tải.
 */
export function lazyPage(load: () => Promise<{ default: ComponentType }>): ReactElement {
  const Component = lazy(load);
  return (
    <Suspense fallback={<PageFallback />}>
      <Component />
    </Suspense>
  );
}

export type ManageRoute = { path: string; element: ReactElement };
