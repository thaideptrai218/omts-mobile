import {
  validateNewPassword,
} from "@/shared/security/new-password-policy";

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

export function validateTraderRegistration(
  values: RegistrationFormValues,
): RegistrationValidationResult {
  const errors: Partial<Record<RegistrationFormField, string>> = {};
  const identifier = values.identifier.trim();
  const passwordValidation = validateNewPassword(values);

  if (!identifier) {
    errors.identifier =
      values.method === "email"
        ? "Vui lòng nhập email."
        : "Vui lòng nhập số điện thoại.";
  }

  if (!passwordValidation.isValid) {
    Object.assign(errors, passwordValidation.errors);
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
