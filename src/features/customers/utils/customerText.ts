import type { CustomerType, CustomerView, Gender } from "@/features/customers/models/Customer";
import type { CustomerPaymentMethod, StatementEntry, StatementEntryKind } from "@/features/customers/models/CustomerDebt";
import type { Label } from "@/models/UI";

/** Mã trạng thái của hồ sơ khách hàng trong danh mục Status (nhóm Usage). */
export const CUSTOMER_STATUS = { inUse: 101, discontinued: 102 } as const;

export const CUSTOMER_TYPE_TEXT: Record<CustomerType, string> = {
  Individual: "Cá nhân",
  Company: "Công ty",
};

export const GENDER_TEXT: Record<Gender, string> = {
  Male: "Nam",
  Female: "Nữ",
  Other: "Khác",
};

/** Nhãn trạng thái hồ sơ: luôn có chữ, không chỉ dựa vào màu. Hồ sơ đã gộp chỉ còn để xem. */
export function customerStatus(c: Pick<CustomerView, "statusId" | "status"> & { mergedIntoCustomerId?: string | null }): Label {
  if (c.mergedIntoCustomerId) return { text: "Đã gộp vào hồ sơ khác", tone: "neutral" };
  if (c.statusId === CUSTOMER_STATUS.inUse) return { text: "Đang dùng", tone: "success" };
  if (c.statusId === CUSTOMER_STATUS.discontinued) return { text: "Ngừng dùng", tone: "neutral" };
  return { text: c.status || "Trạng thái khác", tone: "neutral" };
}

/** Nợ lớn hơn 0 là thương lái còn nợ HTX; nhỏ hơn 0 là HTX còn nợ lại thương lái (BR-DEBT-02). */
export function debtLabel(debt: number): Label {
  if (debt > 0) return { text: "Còn nợ HTX", tone: "danger" };
  if (debt < 0) return { text: "HTX còn nợ lại", tone: "warning" };
  return { text: "Không còn nợ", tone: "success" };
}

export const ENTRY_KIND_TEXT: Record<StatementEntryKind, string> = {
  Invoice: "Hóa đơn",
  PriceCut: "Giảm giá hóa đơn",
  Return: "Trả hàng",
  Payment: "Thương lái trả tiền",
  Discount: "Chiết khấu khi trả tiền",
  PaidBack: "HTX trả lại tiền",
  Adjustment: "Điều chỉnh công nợ",
};

export const METHOD_TEXT: Record<CustomerPaymentMethod, string> = {
  VietQrInvoice: "Mã VietQR của hóa đơn",
  OtherTransfer: "Chuyển khoản",
  Cash: "Tiền mặt",
  EWallet: "Ví điện tử",
};

/** Nhãn của một dòng sao kê không tính vào nợ, hoặc chưa tính hẳn. */
export function entryBadges(e: StatementEntry): Label[] {
  const badges: Label[] = [];
  if (e.cancelled) badges.push({ text: "Đã hủy, không tính", tone: "neutral" });
  if (e.pending) badges.push({ text: "Chờ tiền chuyển khoản về", tone: "warning" });
  if (e.awaitingConfirmation && !e.cancelled) badges.push({ text: "Chờ xác nhận đã nhận tiền", tone: "warning" });
  return badges;
}

/** Tên tiếng Anh của backend (CustomerReferences) cho các bản ghi chuyển sang hồ sơ giữ lại khi gộp. */
export const REFERENCE_TEXT: Record<string, string> = {
  "Merged customer profiles": "Hồ sơ đã gộp trước đó",
  "Purchase requests": "Yêu cầu mua hàng",
  "Quality claims": "Khiếu nại chất lượng",
  "Sales invoices": "Hóa đơn bán",
  "Customer payments": "Phiếu thu và lần trả lại tiền",
  "Customer debt adjustments": "Điều chỉnh công nợ",
  "Sales awaiting their transfer": "Đơn chờ tiền chuyển khoản",
};

/**
 * Số điện thoại Việt Nam như backend chuẩn hóa (PhoneNumbers.Normalize): bỏ khoảng trắng, dấu chấm, gạch, ngoặc;
 * "+84…" hoặc "84…" (11 số) thành "0…"; hợp lệ khi đủ 10 số bắt đầu bằng 0. Sai thì trả null.
 */
export function normalizePhone(text: string): string | null {
  let digits = text.trim().replace(/[\s.\-()]/g, "");
  if (digits.startsWith("+84")) digits = `0${digits.slice(3)}`;
  else if (digits.startsWith("84") && digits.length === 11) digits = `0${digits.slice(2)}`;
  return /^0\d{9}$/.test(digits) ? digits : null;
}
