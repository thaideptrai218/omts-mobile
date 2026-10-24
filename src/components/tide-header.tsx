import { ReactNode } from "react";

type Props = {
  /** Dòng nhỏ phía trên tiêu đề, ví dụ lời chào. */
  kicker: string;
  title: string;
  children?: ReactNode;
};

/**
 * Dải đầu trang màu biển sâu với mép dưới uốn sóng.
 * Góc trên bên phải được chừa trống cho nút menu cố định của Zalo.
 */
function TideHeader({ kicker, title, children }: Props) {
  return (
    <header className="tide">
      <div className="tide__inner">
        <p className="tide__kicker">{kicker}</p>
        <h1 className="tide__title">{title}</h1>
        {children}
      </div>
      <svg
        className="tide__wave"
        viewBox="0 0 390 28"
        preserveAspectRatio="none"
        aria-hidden
      >
        <path d="M0 14 C 60 2 120 2 195 14 S 330 26 390 12 V28 H0 Z" />
      </svg>
    </header>
  );
}

export default TideHeader;
