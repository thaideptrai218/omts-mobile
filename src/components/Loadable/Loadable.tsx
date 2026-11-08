import { ReactNode } from "react";
import { Button } from "zmp-ui";
/** Đang tải lần đầu: khung xám; lỗi: chữ lỗi và nút thử lại; xong: nội dung. */
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
        <Button size="large" onClick={reload}>
          Thử lại
        </Button>
      </div>
    );
  }
  if (data === null) return <div className="skeleton skeleton--form" aria-busy />;
  return <>{children(data)}</>;
}
