import { Input } from "zmp-ui";
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
      size="large"
      value={value}
      inputMode={decimal ? "decimal" : "numeric"}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
      helperText={helperText}
    />
  );
}
