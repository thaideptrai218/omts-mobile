export type ProfileFormValues = Readonly<{
  displayName: string;
}>;

export type ProfileFormErrors = Readonly<{
  displayName?: string;
}>;

export type ProfileValidationResult =
  | Readonly<{ data: Readonly<{ displayName: string }>; isValid: true }>
  | Readonly<{ errors: ProfileFormErrors; isValid: false }>;

export type ProfileContact = Readonly<{
  value: string | null;
  verified: boolean;
}>;

export type ProfileAccountSummary = Readonly<{
  accessSummary: readonly string[];
  accountCode: string;
  accountTypeLabel: string;
  email: ProfileContact;
  phone: ProfileContact;
  username: string;
}>;

export function validateProfileForm(
  values: ProfileFormValues,
): ProfileValidationResult {
  const displayName = values.displayName.trim();

  if (!displayName) {
    return {
      errors: { displayName: "Vui lòng nhập tên hiển thị." },
      isValid: false,
    };
  }

  return { data: { displayName }, isValid: true };
}
