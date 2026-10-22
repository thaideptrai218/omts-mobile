export type NewPasswordFormValues = Readonly<{
  password: string;
  passwordConfirmation: string;
}>;

type NewPasswordField = "password" | "passwordConfirmation";

export type NewPasswordErrors = Readonly<
  Partial<Record<NewPasswordField, string>>
>;

export type NewPasswordValidationResult =
  | Readonly<{ data: Readonly<{ password: string }>; isValid: true }>
  | Readonly<{ errors: NewPasswordErrors; isValid: false }>;

export const newPasswordRequirement =
  "Ít nhất 8 ký tự, bao gồm chữ và số.";

const hasLetter = (value: string) => /\p{L}/u.test(value);
const hasNumber = (value: string) => /\p{N}/u.test(value);

export function validateNewPassword(
  values: NewPasswordFormValues,
): NewPasswordValidationResult {
  const errors: Partial<Record<NewPasswordField, string>> = {};

  if (!values.password) {
    errors.password = "Vui lòng nhập mật khẩu.";
  } else if (
    values.password.length < 8 ||
    !hasLetter(values.password) ||
    !hasNumber(values.password)
  ) {
    errors.password =
      "Mật khẩu phải có ít nhất 8 ký tự, bao gồm chữ và số.";
  }

  if (!values.passwordConfirmation) {
    errors.passwordConfirmation = "Vui lòng nhập lại mật khẩu.";
  } else if (values.passwordConfirmation !== values.password) {
    errors.passwordConfirmation = "Mật khẩu nhập lại chưa khớp.";
  }

  if (Object.keys(errors).length > 0) {
    return { errors, isValid: false };
  }

  return {
    data: { password: values.password },
    isValid: true,
  };
}
