export type LoginFormValues = Readonly<{
  identifier: string;
  password: string;
}>;

export type LoginCredentials = Readonly<{
  identifier: string;
  password: string;
}>;

export type LoginFormErrors = Readonly<
  Partial<Record<"identifier" | "password", string>>
>;

export type LoginValidationResult =
  | Readonly<{ credentials: LoginCredentials; isValid: true }>
  | Readonly<{ errors: LoginFormErrors; isValid: false }>;

export function validateLoginForm(
  values: LoginFormValues,
): LoginValidationResult {
  const errors: Partial<Record<"identifier" | "password", string>> = {};
  const identifier = values.identifier.trim();

  if (!identifier) {
    errors.identifier = "Vui lòng nhập tên đăng nhập, số điện thoại hoặc email.";
  }

  if (!values.password) {
    errors.password = "Vui lòng nhập mật khẩu.";
  }

  if (Object.keys(errors).length > 0) {
    return { errors, isValid: false };
  }

  return {
    credentials: {
      identifier,
      password: values.password,
    },
    isValid: true,
  };
}
