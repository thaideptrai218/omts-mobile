export type RegistrationMethod = "email" | "phone";

export type RegistrationFormValues = Readonly<{
  identifier: string;
  method: RegistrationMethod;
  password: string;
  passwordConfirmation: string;
}>;

export type RegistrationFormData = Readonly<{
  identifier: string;
  method: RegistrationMethod;
  password: string;
}>;

type RegistrationFormField =
  | "identifier"
  | "password"
  | "passwordConfirmation";

export type RegistrationFormErrors = Readonly<
  Partial<Record<RegistrationFormField, string>>
>;

export type RegistrationValidationResult =
  | Readonly<{ data: RegistrationFormData; isValid: true }>
  | Readonly<{ errors: RegistrationFormErrors; isValid: false }>;

const hasLetter = (value: string) => /\p{L}/u.test(value);
const hasNumber = (value: string) => /\p{N}/u.test(value);

export function validateTraderRegistration(
  values: RegistrationFormValues,
): RegistrationValidationResult {
  const errors: Partial<Record<RegistrationFormField, string>> = {};
  const identifier = values.identifier.trim();

  if (!identifier) {
    errors.identifier =
      values.method === "email"
        ? "Vui lòng nhập email."
        : "Vui lòng nhập số điện thoại.";
  }

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
    data: {
      identifier,
      method: values.method,
      password: values.password,
    },
    isValid: true,
  };
}
