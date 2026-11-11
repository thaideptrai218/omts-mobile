import "@/features/workforce/styles/workforce.scss";

/**
 * Ô chọn tháng hoặc giờ bằng bộ chọn có sẵn của máy. Nhãn nằm trên và cả khung bấm được; giá trị giữ nguyên định dạng
 * của ô nhập gốc ("YYYY-MM" với tháng, "HH:mm" với giờ).
 */
export default function NativePicker({ label, type, value, hint, disabled, onChange }: {
  label: string;
  type: "month" | "time";
  value: string;
  hint?: string;
  disabled?: boolean;
  onChange: (value: string) => void;
}) {
  return <label className="native-picker">
    <span className="native-picker__label">{label}</span>
    <input className="native-picker__input" type={type} value={value} disabled={disabled} onChange={e => onChange(e.target.value)} />
    {hint && <span className="native-picker__hint">{hint}</span>}
  </label>;
}
