import {
  validateNewPassword,
  type NewPasswordErrors,
} from "@/shared/security/new-password-policy";

export type PasswordChangeFormValues = Readonly<{
  currentPassword: string;
  password: string;
  passwordConfirmation: string;
}>;

export type PasswordChangeFormErrors = NewPasswordErrors &
  Readonly<{ currentPassword?: string }>;

export type PasswordChangeSubmission = Readonly<{
  currentPassword: string;
  newPassword: string;
}>;

export type PasswordChangeValidationResult =
  | Readonly<{ data: PasswordChangeSubmission; isValid: true }>
  | Readonly<{ errors: PasswordChangeFormErrors; isValid: false }>;

export function validatePasswordChange(
  values: PasswordChangeFormValues,
): PasswordChangeValidationResult {
  const errors: {
    currentPassword?: string;
    password?: string;
    passwordConfirmation?: string;
  } = {};
  const newPasswordValidation = validateNewPassword(values);

  if (!values.currentPassword) {
    errors.currentPassword = "Vui lòng nhập mật khẩu hiện tại.";
  }

  if (!newPasswordValidation.isValid) {
    Object.assign(errors, newPasswordValidation.errors);
  }

  if (Object.keys(errors).length > 0) {
    return { errors, isValid: false };
  }

  return {
    data: {
      currentPassword: values.currentPassword,
      newPassword: values.password,
    },
    isValid: true,
  };
}
