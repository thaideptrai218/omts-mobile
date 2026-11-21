import type { CustomerPayment, CustomerPaymentKind, CustomerPaymentMethod, PaymentQuestion, PaymentQuestionField, PaymentQuestionFlags } from "@/features/finance/models/CustomerPayment";
import type { Label } from "@/models/UI";
import { ApiError } from "@/services/errors";
import { date, money, parseNumber } from "@/utils/format";

/** Mã trạng thái của phiếu thu trong danh mục Status (nhóm CustomerPayment, STD-CUSTOMER-PAYMENT). */
export const PAYMENT_STATUS = { awaiting: 3601, completed: 3602, cancelled: 3603, pendingTransfer: 3604 } as const;

export const METHOD_TEXT: Record<CustomerPaymentMethod, string> = {
  Cash: "Tiền mặt",
  OtherTransfer: "Chuyển khoản",
  VietQrInvoice: "VietQR của hóa đơn",
  EWallet: "Ví điện tử",
};

export const KIND_TEXT: Record<CustomerPaymentKind, string> = {
  Payment: "Thu tiền",
  PaidBack: "Trả lại tiền",
};

/** Nhãn trạng thái của phiếu: luôn có chữ, không chỉ dựa vào màu. */
export function paymentStatus(p: Pick<CustomerPayment, "statusId" | "status">): Label {
  switch (p.statusId) {
    case PAYMENT_STATUS.awaiting: return { text: "Chờ xác nhận", tone: "warning" };
    case PAYMENT_STATUS.completed: return { text: "Đã hoàn tất", tone: "success" };
    case PAYMENT_STATUS.cancelled: return { text: "Đã hủy", tone: "neutral" };
    case PAYMENT_STATUS.pendingTransfer: return { text: "Chờ chuyển khoản", tone: "warning" };
    default: return { text: p.status, tone: "neutral" };
  }
}

/** "Phiếu thu PT000123" hoặc "Phiếu trả lại tiền PT000124"; `inSentence` viết thường chữ "phiếu" để đặt giữa câu. */
export function paymentTitle(p: Pick<CustomerPayment, "kind" | "code">, inSentence = false) {
  const kind = p.kind === "PaidBack" ? "phiếu trả lại tiền" : "phiếu thu";
  return `${inSentence ? kind : kind[0].toUpperCase() + kind.slice(1)} ${p.code}`;
}

/** Công nợ theo BR-DEBT-02: lớn hơn 0 là thương lái nợ HTX, nhỏ hơn 0 là HTX nợ lại thương lái. */
export function debtText(debt: number) {
  if (debt > 0) return `Đang nợ HTX ${money(debt)}`;
  if (debt < 0) return `HTX đang nợ lại ${money(-debt)}`;
  return "Không còn nợ";
}

/** Câu đầy đủ về công nợ của một thương lái: "Bà Năm đang nợ HTX 2.000.000 đ." */
export function debtSentence(name: string, debt: number) {
  if (debt > 0) return `${name} đang nợ HTX ${money(debt)}.`;
  if (debt < 0) return `HTX đang nợ lại ${name} ${money(-debt)}.`;
  return `${name} không còn nợ HTX.`;
}

/**
 * Số tiền điền sẵn vào ô nhập, có dấu chấm phân cách nghìn để đọc lại được: 1250000 → "1.250.000". Làm tròn xuống để số
 * điền sẵn không bao giờ vượt mức tối đa (tiền còn nợ của hóa đơn, tiền HTX nợ lại).
 */
export function amountText(value: number) {
  return new Intl.NumberFormat("vi-VN", { maximumFractionDigits: 0 }).format(Math.floor(value));
}

/**
 * Khoản chuyển khoản hệ thống ghi mà không gắn với thương lái hay hóa đơn nào (DEBT-02.6): máy chủ không cho xác nhận
 * thẳng, chỉ cho hủy.
 */
export function needsSettlement(p: Pick<CustomerPayment, "customer" | "invoice" | "kind">) {
  return p.customer === null && p.invoice === null && p.kind === "Payment";
}

/** Số đồng nguyên người dùng gõ ("1.250.000"); rỗng, âm, có phần lẻ hoặc sai thì null. */
export function wholeVnd(text: string): number | null {
  const n = parseNumber(text);
  return n !== null && Number.isSafeInteger(n) && n >= 0 ? n : null;
}

const QUESTION_FIELDS: PaymentQuestionField[] = ["confirmAboveDebt", "confirmDuplicateBankReference"];

/**
 * Câu hỏi lại của máy chủ khi ghi phiếu (409 có `confirmationField`), viết bằng tiếng Việt từ các tham số máy chủ gửi kèm.
 * MSG-DEBT-04 (DEBT-02.1): khoản thu lớn hơn công nợ; MSG-DEBT-05 (DEBT-02.5): mã giao dịch ngân hàng đã có ở phiếu khác.
 */
export function paymentQuestion(error: unknown, flags: PaymentQuestionFlags): PaymentQuestion | null {
  if (!(error instanceof ApiError) || error.status !== 409) return null;
  const d = error.details;
  const field = QUESTION_FIELDS.find((f) => f === d.confirmationField);
  if (!field) return null;
  const name = typeof d.customerName === "string" && d.customerName ? d.customerName : null;
  if (field === "confirmAboveDebt") {
    const who = name ?? "thương lái";
    const debt = Number(d.debtAmount ?? 0);
    const before = debt > 0 ? `${who} đang nợ HTX ${money(debt)}.` : debt === 0 ? `${who} hiện không nợ HTX.` : `HTX đang nợ lại ${who} ${money(-debt)}.`;
    return {
      field,
      flags,
      text: `${before} Khoản này trừ ${money(Number(d.amount ?? 0))} vào nợ, nên sau khi lưu HTX sẽ nợ lại ${who} ${money(Number(d.owedBackAmount ?? 0))}. Vẫn lưu phiếu thu?`,
    };
  }
  const paymentDate = typeof d.paymentDate === "string" ? d.paymentDate : null;
  return {
    field,
    flags,
    text: `Phiếu ${String(d.paymentCode ?? "")} (${money(Number(d.amount ?? 0))}, ngày ${date(paymentDate)}${name ? `, ${name}` : ""}) đã có mã giao dịch ${String(d.bankReference ?? "")}. Vẫn lưu thêm phiếu này?`,
  };
}
