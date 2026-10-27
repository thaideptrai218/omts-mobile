import { ChangeEvent } from "react";

type Props = {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  /** Gọi khi đã đủ 6 số (dán hoặc gõ xong) để luồng có thể tự kiểm tra. */
  onComplete?: (value: string) => void;
};

export const CODE_LENGTH = 6;

/**
 * Ô nhập mã 6 số: một input duy nhất, bàn phím số (`inputMode="numeric"`), dán được, gợi ý mã từ SMS
 * (`autoComplete="one-time-code"`). Chữ to, giãn cách để người lớn tuổi đọc rõ.
 */
function CodeInput({ value, onChange, disabled, onComplete }: Props) {
  const handle = (e: ChangeEvent<HTMLInputElement>) => {
    const digits = e.target.value.replace(/\D/g, "").slice(0, CODE_LENGTH);
    onChange(digits);
    if (digits.length === CODE_LENGTH && digits !== value) onComplete?.(digits);
  };
  return (
    <input
      className="code-input"
      type="text"
      inputMode="numeric"
      pattern="[0-9]*"
      autoComplete="one-time-code"
      maxLength={CODE_LENGTH}
      placeholder="······"
      aria-label="Mã xác minh 6 số"
      value={value}
      disabled={disabled}
      onChange={handle}
    />
  );
}

export default CodeInput;
