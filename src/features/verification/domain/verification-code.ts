export const verificationCodeLength = 6;

export function normalizeVerificationCode(value: string): string {
  return value.replace(/\D/g, "").slice(0, verificationCodeLength);
}

export function isCompleteVerificationCode(value: string): boolean {
  return /^\d{6}$/.test(value);
}
