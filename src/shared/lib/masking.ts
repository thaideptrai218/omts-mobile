/** Che số điện thoại theo quy ước của ticket: "0912345689" → "09******89". */
export function maskPhone(phone: string | null | undefined): string {
  if (!phone) return "";
  if (phone.length <= 4) return "*".repeat(phone.length);
  return `${phone.slice(0, 2)}${"*".repeat(phone.length - 4)}${phone.slice(-2)}`;
}
