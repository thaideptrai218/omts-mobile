import { Input } from "zmp-ui";

import { PASSWORD_RULE } from "@/services/acs/messages";

type Props = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  /** Ô mật khẩu mới: hiện dòng quy tắc bên dưới. */
  isNew?: boolean;
  autoComplete?: string;
  disabled?: boolean;
  errorText?: string;
};

/** Ô mật khẩu che chữ, có nút hiện/ẩn; ô mật khẩu mới luôn kèm quy tắc "At least 8 characters…". */
function PasswordField({ label, value, onChange, isNew, autoComplete, disabled, errorText }: Props) {
  return (
    <Input.Password
      label={label}
      size="large"
      visibilityToggle
      value={value}
      onChange={(e) => onChange(e.target.value)}
      autoComplete={autoComplete ?? (isNew ? "new-password" : "current-password")}
      disabled={disabled}
      helperText={isNew ? PASSWORD_RULE : undefined}
      status={errorText ? "error" : undefined}
      errorText={errorText}
    />
  );
}

export default PasswordField;
