import { ComponentType, lazy, ReactElement, Suspense } from "react";

import { ManagePage } from "@/components/ManagePage/ManagePage";

/** Khung tải màn dùng chung cho các nhóm nghiệp vụ. */
function PageFallback() {
  return (
    <ManagePage title="Đang mở màn hình">
      <div className="loading" role="status" aria-busy>
        <p className="loading__text">Đang tải...</p>
        <div className="skeleton skeleton--form" aria-hidden />
      </div>
    </ManagePage>
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
