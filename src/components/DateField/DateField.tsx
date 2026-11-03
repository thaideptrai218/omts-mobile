import { useMemo } from "react";
import { DatePicker } from "zmp-ui";

/** "2026-10-28" ↔ Date theo giờ trên máy, chỉ lấy phần ngày lịch (không đổi múi giờ). */
function toDate(iso: string | null) {
  if (!iso) return undefined;
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d);
}

function toIso(value: Date) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${value.getFullYear()}-${pad(value.getMonth() + 1)}-${pad(value.getDate())}`;
}

/**
 * Ô chọn ngày của các màn quản lý. Giá trị gửi API dạng "YYYY-MM-DD"; null là chưa chọn. DatePicker của ZaUI chỉ
 * hiện giá trị ban đầu qua `defaultValue` (prop `value` chỉ được đọc sau khi đã hiện), nên truyền cả hai.
 */
function DateField({
  label,
  value,
  onChange,
  disabled,
  startYear,
  endYear,
}: {
  label: string;
  value: string | null;
  onChange: (value: string) => void;
  disabled?: boolean;
  startYear?: number;
  endYear?: number;
}) {
  const picked = useMemo(() => toDate(value), [value]);
  return (
    <DatePicker
      label={label}
      title={label}
      placeholder="Chọn ngày"
      value={picked}
      defaultValue={picked}
      onChange={(d) => onChange(toIso(d))}
      dateFormat="dd/mm/yyyy"
      columnsFormat="DD-MM-YYYY"
      locale="vi-VN"
      mask
      maskClosable
      disabled={disabled}
      startDate={startYear ? new Date(startYear, 0, 1) : undefined}
      endDate={endYear ? new Date(endYear, 11, 31) : undefined}
      action={{ text: "Xong", close: true }}
    />
  );
}

export default DateField;
