/**
 * Tên ngắn của các ngân hàng hay gặp theo mã BIN của VietQR, để thương lái biết chuyển vào ngân hàng nào khi chép số tài
 * khoản bằng tay. Danh sách đầy đủ (`api/banks`) chỉ Chủ HTX đọc được; mã không có ở đây thì hiện nguyên mã.
 */
export const BANK_NAMES: Record<string, string> = {
  "970436": "Vietcombank",
  "970415": "VietinBank",
  "970418": "BIDV",
  "970405": "Agribank",
  "970422": "MB",
  "970407": "Techcombank",
  "970416": "ACB",
  "970432": "VPBank",
  "970423": "TPBank",
  "970403": "Sacombank",
  "970437": "HDBank",
  "970441": "VIB",
  "970443": "SHB",
  "970426": "MSB",
  "970448": "OCB",
  "970431": "Eximbank",
  "970440": "SeABank",
  "970452": "KienlongBank",
};

export const bankName = (bin: string) => BANK_NAMES[bin] ?? (bin ? `Mã ngân hàng ${bin}` : "");
