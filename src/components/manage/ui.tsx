import { ReactNode, useEffect, useRef, useState } from "react";
import { Button, Header, Icon, Input, Page, Sheet } from "zmp-ui";

import FormError from "@/components/form-error";
import type { IconName } from "@/data/features";
import { FIELD, MESSAGES } from "@/services/acs/messages";
import type { Tone } from "@/services/labels";

/**
 * Khối giao diện dùng chung cho các màn quản lý của Chủ HTX: trang chi tiết, trạng thái tải, dòng danh sách,
 * bảng thông tin, chip lọc, sheet nhập lý do. Giữ ở một file để mỗi màn chỉ còn phần riêng của nó.
 */

export function ManagePage({ title, children, footer }: { title: string; children: ReactNode; footer?: ReactNode }) {
  return (
    <Page className={`screen screen--detail${footer ? " screen--with-footer" : ""}`} hideScrollbar>
      <Header title={title} className="detail-header" />
      <div className="screen__body">{children}</div>
      {footer && <div className="page-footer">{footer}</div>}
    </Page>
  );
}

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

export function Empty({ icon = "zi-inbox", title, text }: { icon?: IconName; title: string; text?: string }) {
  return (
    <div className="empty">
      <span className="empty__badge">
        <Icon icon={icon} size={32} />
      </span>
      <p className="empty__title">{title}</p>
      {text && <p className="empty__text">{text}</p>}
    </div>
  );
}

export function Badge({ text, tone }: { text: string; tone: Tone }) {
  return <span className={`badge badge--${tone}`}>{text}</span>;
}

/** Một dòng trong danh sách: tiêu đề, dòng phụ, nhãn trạng thái, số ở bên phải. Bấm để mở chi tiết. */
export function Row({
  title,
  meta,
  badge,
  value,
  onClick,
}: {
  title: ReactNode;
  meta?: ReactNode;
  badge?: ReactNode;
  value?: ReactNode;
  onClick?: () => void;
}) {
  const body = (
    <>
      <span className="row__text">
        <span className="row__title">{title}</span>
        {meta && <span className="row__meta">{meta}</span>}
        {badge && <span className="row__badges">{badge}</span>}
      </span>
      {value !== undefined && <span className="row__value">{value}</span>}
      {onClick && <Icon icon="zi-chevron-right" className="chevron" />}
    </>
  );
  return (
    <li>
      {onClick ? (
        <button type="button" className="row" onClick={onClick}>
          {body}
        </button>
      ) : (
        <div className="row">{body}</div>
      )}
    </li>
  );
}

export function Rows({ children }: { children: ReactNode }) {
  return <ul className="rows">{children}</ul>;
}

/** Bảng thông tin nhãn/giá trị. Dòng có giá trị rỗng được bỏ qua. */
export function Facts({ items }: { items: [string, ReactNode][] }) {
  const shown = items.filter(([, v]) => v !== null && v !== undefined && v !== "");
  return (
    <dl className="info info--flat card">
      {shown.map(([label, value]) => (
        <div key={label}>
          <dt>{label}</dt>
          <dd>{value}</dd>
        </div>
      ))}
    </dl>
  );
}

export function Section({ title, action, children }: { title: string; action?: ReactNode; children: ReactNode }) {
  return (
    <section className="block">
      <div className="block__head">
        <h2 className="block__title">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  );
}

/** Chip lọc chọn một: bấm lại chip đang chọn không bỏ chọn (luôn có một lựa chọn). */
export function Chips<K extends string>({ options, value, onChange }: { options: [K, string][]; value: NoInfer<K>; onChange: (v: NoInfer<K>) => void }) {
  const ref = useRef<HTMLDivElement>(null);
  // Chip đang chọn có thể nằm ngoài màn (ví dụ mở danh sách nước của vùng thứ tư): cuộn ngang tới nó.
  useEffect(() => {
    ref.current?.querySelector(".chip.is-active")?.scrollIntoView({ block: "nearest", inline: "center" });
  }, [value, options.length]);
  return (
    <div className="chips" role="tablist" ref={ref}>
      {options.map(([key, label]) => (
        <button key={key} type="button" role="tab" aria-selected={key === value} className={`chip${key === value ? " is-active" : ""}`} onClick={() => onChange(key)}>
          {label}
        </button>
      ))}
    </div>
  );
}

/** Ô tìm kiếm: tìm khi bấm Enter hoặc nút kính lúp, không gọi API theo từng ký tự. */
export function SearchBox({ placeholder, onSearch }: { placeholder: string; onSearch: (text: string) => void }) {
  const [text, setText] = useState("");
  return (
    <form
      className="search"
      onSubmit={(e) => {
        e.preventDefault();
        onSearch(text.trim());
      }}
    >
      <Input.Search placeholder={placeholder} value={text} onChange={(e) => setText(e.target.value)} onSearch={(v) => onSearch(String(v ?? "").trim())} clearable />
    </form>
  );
}

/** Các nút thao tác của trang chi tiết, chia đều theo hàng. */
export function Actions({ children }: { children: ReactNode }) {
  return <div className="action-row">{children}</div>;
}

/**
 * Sheet xác nhận có ô lý do (ngừng dùng, khóa, hủy phiếu…). `required` thì bắt nhập lý do. `onConfirm` trả về
 * true khi thao tác thành công để đóng sheet.
 */
export function ReasonSheet({
  visible,
  title,
  intro,
  confirmText,
  required = false,
  maxLength = 500,
  busy,
  onClose,
  onConfirm,
  children,
}: {
  visible: boolean;
  title: string;
  intro?: string;
  confirmText: string;
  required?: boolean;
  maxLength?: number;
  busy: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => Promise<boolean>;
  children?: ReactNode;
}) {
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");

  const submit = async () => {
    const text = reason.trim();
    if (required && !text) {
      setError(MESSAGES.MSG01(FIELD.reason));
      return;
    }
    setError("");
    if (await onConfirm(text)) {
      setReason("");
      onClose();
    }
  };

  return (
    <Sheet visible={visible} onClose={onClose} autoHeight mask handler swipeToClose title={title}>
      <div className="sheet-form form">
        {intro && <p className="form__intro">{intro}</p>}
        {children}
        <Input.TextArea label={required ? "Lý do" : "Lý do (không bắt buộc)"} value={reason} onChange={(e) => setReason(e.target.value)} maxLength={maxLength} showCount disabled={busy} />
        <FormError text={error} />
        <Button fullWidth size="large" loading={busy} disabled={busy} onClick={() => void submit()}>
          {confirmText}
        </Button>
      </div>
    </Sheet>
  );
}

/** Ô số tiền/số lượng: bàn phím số, cho gõ dấu chấm phân cách nghìn và dấu phẩy thập phân. */
export function NumberInput({
  label,
  value,
  onChange,
  disabled,
  helperText,
  decimal = false,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  disabled?: boolean;
  helperText?: string;
  decimal?: boolean;
}) {
  return (
    <Input
      label={label}
      value={value}
      inputMode={decimal ? "decimal" : "numeric"}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
      helperText={helperText}
    />
  );
}
