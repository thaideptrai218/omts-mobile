/** Che số điện thoại theo quy ước của ticket: "0912345689" → "09******89". */
export function maskPhone(phone: string | null | undefined): string {
  if (!phone) return "";
  if (phone.length <= 4) return "*".repeat(phone.length);
  return `${phone.slice(0, 2)}${"*".repeat(phone.length - 4)}${phone.slice(-2)}`;
}

/** Che email: "nguyen@mail.com" → "n***@mail.com". */
export function maskEmail(email: string | null | undefined): string {
  if (!email) return "";
  const at = email.indexOf("@");
  return at <= 0 ? "***" : `${email[0]}***${email.slice(at)}`;
}

export function maskContact(channel: "Sms" | "Email", value: string): string {
  return channel === "Sms" ? maskPhone(value) : maskEmail(value);
}
