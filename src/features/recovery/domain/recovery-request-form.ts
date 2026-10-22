export type RecoveryRequestFormValues = Readonly<{
  identifier: string;
}>;

export type RecoveryRequestFormErrors = Readonly<{
  identifier?: string;
}>;

export type RecoveryRequestValidationResult =
  | Readonly<{ identifier: string; isValid: true }>
  | Readonly<{ errors: RecoveryRequestFormErrors; isValid: false }>;

export function validateRecoveryRequest(
  values: RecoveryRequestFormValues,
): RecoveryRequestValidationResult {
  const identifier = values.identifier.trim();

  if (!identifier) {
    return {
      errors: {
        identifier: "Vui lòng nhập email hoặc số điện thoại đã xác minh.",
      },
      isValid: false,
    };
  }

  return { identifier, isValid: true };
}
