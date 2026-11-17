import type { CustomerPaymentForm, PaymentDraft } from "@/features/finance/models/CustomerPaymentForm";
import { MESSAGES } from "@/constants/messages";
import { todayIso } from "@/utils/format";
import { wholeVnd } from "@/features/finance/utils/financeText";

/** Giới hạn của máy chủ (BR-DEBT-03, như BR-PURCHASE-08). */
export const MAX_BANK_REFERENCE = 100;
export const MAX_NOTE = 1000;

/** Form mới: tiền mặt, hôm nay, người thu là người đang ghi (máy chủ mặc định), tài khoản nhận tiền của HTX nếu có. */
export function newDraft(form: CustomerPaymentForm): PaymentDraft {
  return {
    amount: "",
    method: "Cash",
    bankReference: "",
    cashAccountId: form.bankAccounts.find((a) => a.isDefault)?.id ?? "",
    paymentDate: todayIso(),
    collectedById: "",
    note: "",
  };
}

/** Kiểm tra tại chỗ các ô chung, trước khi gửi máy chủ; trả về câu lỗi tiếng Việt, hoặc chuỗi rỗng khi hợp lệ. */
export function draftError(draft: PaymentDraft) {
  if (wholeVnd(draft.amount) === null) return MESSAGES.MSG01("Số tiền (số đồng nguyên, không có phần lẻ)");
  if (!draft.paymentDate || draft.paymentDate > todayIso()) return MESSAGES.MSG01("Ngày (không được sau hôm nay)");
  if (draft.method === "OtherTransfer" && !draft.bankReference.trim()) return MESSAGES.MSG01("Mã giao dịch ngân hàng");
  return "";
}

/** Phần chung của thân request từ các ô của form. */
export function draftBody(draft: PaymentDraft) {
  const transfer = draft.method === "OtherTransfer";
  return {
    paymentDate: draft.paymentDate,
    amount: wholeVnd(draft.amount) ?? 0,
    method: draft.method,
    bankReference: transfer ? draft.bankReference.trim() : null,
    cashAccountId: transfer && draft.cashAccountId ? draft.cashAccountId : null,
    collectedByAccountId: draft.collectedById || null,
    note: draft.note.trim() || null,
  };
}
