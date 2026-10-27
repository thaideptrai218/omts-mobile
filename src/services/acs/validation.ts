import type { VerificationChannel } from "./types";

/**
 * Kiểm tra định dạng trước khi gửi, giống quy tắc chung của ACS trong backend
 * (`PhoneNumbers`, `EmailAddresses`, `PasswordPolicy`). Backend vẫn là nơi quyết định cuối cùng.
 */

/** Số Việt Nam 10 chữ số bắt đầu bằng 0; "+84…" và "84…" đổi về "0…"; bỏ khoảng trắng, chấm, gạch, ngoặc. */
export function normalizePhone(input: string | null | undefined): string | null {
  if (!input) return null;
  let digits = input.trim().replace(/[\s.\-()]/g, "");
  if (digits.startsWith("+84")) digits = "0" + digits.slice(3);
  else if (digits.startsWith("84") && digits.length === 11) digits = "0" + digits.slice(2);
  return /^0\d{9}$/.test(digits) ? digits : null;
}

export function normalizeEmail(input: string | null | undefined): string | null {
  if (!input) return null;
  const value = input.trim().toLowerCase();
  return value.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) ? value : null;
}

export function normalizeContact(channel: VerificationChannel, input: string): string | null {
  return channel === "Sms" ? normalizePhone(input) : normalizeEmail(input);
}

/** Ít nhất 8 ký tự, có chữ và có số, tối đa 128. */
export function isValidPassword(password: string): boolean {
  return password.length >= 8 && password.length <= 128 && /\p{L}/u.test(password) && /\d/.test(password);
}

/** Người dùng gõ số điện thoại hay email (dùng ở khôi phục mật khẩu để biết kênh nhận mã). */
export function identifierChannel(input: string): VerificationChannel | null {
  if (normalizePhone(input)) return "Sms";
  if (normalizeEmail(input)) return "Email";
  return null;
}
