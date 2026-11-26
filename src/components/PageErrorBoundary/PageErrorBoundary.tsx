import type { ErrorFallbackProps } from "@/components/ErrorBoundary/ErrorBoundary";
import type { ReactNode } from "react";
import { Button, useLocation, useNavigate } from "zmp-ui";

import { Empty } from "@/components/Empty/Empty";
import { ErrorBoundary } from "@/components/ErrorBoundary/ErrorBoundary";
import { ManagePage } from "@/components/ManagePage/ManagePage";

/** Màn thay thế khi một màn bị lỗi: vẫn có "Quay lại", nút thử lại và nút về trang chủ, thanh dưới vẫn dùng được. */
function PageError({ chunk, retry }: ErrorFallbackProps) {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const home = pathname === "/";

  // Lỗi tải mã: về trang chủ rồi mới tải lại app, để lần tải lại mở đúng địa chỉ gốc của Mini App.
  const reload = () => {
    if (!home) navigate("/", { replace: true, animate: false });
    window.setTimeout(() => window.location.reload(), 0);
  };

  return (
    <ManagePage
      title="Không mở được màn này"
      footer={
        <div className="sheet-actions">
          <Button fullWidth size="large" onClick={chunk ? reload : retry}>
            {chunk ? "Tải lại app" : "Thử lại"}
          </Button>
          {!home && (
            <Button fullWidth size="large" variant="secondary" onClick={() => navigate("/", { replace: true })}>
              Về trang chủ
            </Button>
          )}
        </div>
      }
    >
      <Empty
        icon="zi-warning-circle"
        title={chunk ? "Không tải được màn này" : "Màn này vừa gặp lỗi"}
        text={
          chunk
            ? "Thường do mạng yếu. Kiểm tra kết nối rồi bấm Tải lại app. Những gì đã lưu không bị ảnh hưởng."
            : "Những gì đã lưu không bị ảnh hưởng. Bấm Thử lại; nếu vẫn lỗi, về trang chủ và báo cho HTX."
        }
      />
    </ManagePage>
  );
}

/** Bọc một màn: lỗi khi vẽ màn chỉ thay màn đó bằng màn báo lỗi, không làm trắng cả app. */
export function PageErrorBoundary({ children }: { children: ReactNode }) {
  return <ErrorBoundary fallback={(props) => <PageError {...props} />}>{children}</ErrorBoundary>;
}
