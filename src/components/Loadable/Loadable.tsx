import { ReactNode } from "react";
import { Button } from "zmp-ui";
/** Đang tải lần đầu: chữ "Đang tải..." và khung xám; lỗi: chữ lỗi và nút thử lại; xong: nội dung. */
export function Loadable<T>({
  data,
  error,
  reload,
  children,
}: {
  data: T | null;
  error: string;
  reload: () => void;
  children: (data: T) => ReactNode;
}) {
  if (error && data === null) {
    return (
      <div className="empty">
        <p className="empty__title">Không tải được dữ liệu</p>
        <p className="empty__text">{error}</p>
        <div className="empty__action">
          <Button fullWidth size="large" onClick={reload}>
            Thử lại
          </Button>
        </div>
      </div>
    );
  }
  if (data === null) {
    return (
      <div className="loading" role="status" aria-busy>
        <p className="loading__text">Đang tải...</p>
        <div className="skeleton skeleton--form" aria-hidden />
      </div>
    );
  }
  return <>{children(data)}</>;
}
