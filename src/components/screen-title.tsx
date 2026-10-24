/** Tiêu đề đơn giản cho các tab không phải dashboard. Chừa chỗ cho thanh trạng thái và menu Zalo. */
function ScreenTitle({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <header className="screen-title">
      <h1 className="screen-title__text">{title}</h1>
      {subtitle && <p className="screen-title__sub">{subtitle}</p>}
    </header>
  );
}

export default ScreenTitle;
