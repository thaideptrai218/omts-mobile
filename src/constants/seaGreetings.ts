/** Lời chúc đầu trang chủ, đổi theo ngày. Chỉ là lời chúc, không phải số liệu con nước hay thời tiết. */
export const SEA_GREETINGS = [
  "Chúc bà con biển êm, hàu béo.",
  "Nước sạch thì hàu mới ngon.",
  "Chăm bè mỗi ngày, hàu lớn mỗi mùa.",
  "Con nước lên xuống, việc vẫn đều tay.",
  "Hàu ngon nhờ nước, nước sạch nhờ người.",
];

export function seaGreeting(now: Date) {
  const day = Math.floor(now.getTime() / 86_400_000);
  return SEA_GREETINGS[day % SEA_GREETINGS.length];
}
