import type { SupplierStatementEntryKind } from "@/features/purchasing/models/SupplierDebt";
import type { SupplierPaymentKind } from "@/features/purchasing/models/SupplierPayment";
import type { Label } from "@/models/UI";
import type { ApiError } from "@/services/errors";
import { date, money } from "@/utils/format";

/** Công nợ với nhà cung cấp: dương là HTX còn nợ, âm là HTX đã trả trước. */
export function supplierDebtLabel(debt: number): Label {
  if (debt > 0) return { text: "HTX còn nợ", tone: "danger" };
  if (debt < 0) return { text: "HTX đã trả trước", tone: "warning" };
  return { text: "Không còn nợ", tone: "success" };
}

/** Dư nợ sau một dòng sao kê. */
export const supplierDebtText = (debt: number) => (debt < 0 ? `Trả trước ${money(-debt)}` : money(debt));

export const STATEMENT_KIND_TEXT: Record<SupplierStatementEntryKind, string> = {
  Receipt: "Phiếu nhập",
  Return: "Trả hàng",
  Payment: "HTX trả tiền",
  PaidBack: "Nhà cung cấp hoàn tiền",
};

export const PAYMENT_KIND_TEXT: Record<SupplierPaymentKind, string> = {
  Payment: "HTX trả tiền",
  PaidBack: "Nhà cung cấp hoàn tiền",
};

/** Câu hỏi lại khi backend trả 409 kèm `confirmFlag` (MSG-PURCHASE-05, MSG-PURCHASE-06), dựng từ dữ liệu kèm theo. */
export function paymentQuestion(err: ApiError): string {
  const d = err.details;
  if (d.confirmFlag === "confirmAdvance") {
    const debt = Number(d.debtAmount ?? 0);
    const advance = money(Number(d.advanceAmount ?? 0));
    const name = String(d.supplierName ?? "nhà cung cấp");
    return debt > 0
      ? `HTX đang nợ ${name} ${money(debt)}. Sau lần trả này HTX sẽ trả trước ${advance}. Bạn vẫn lưu lần trả này?`
      : `HTX không còn nợ ${name}. Cả lần trả này (${advance}) sẽ thành tiền trả trước. Bạn vẫn lưu?`;
  }
  return `Lần trả ${String(d.paymentCode ?? "")} ngày ${date(String(d.paymentDate ?? ""))}, số tiền ${money(Number(d.amount ?? 0))}, đã ghi mã giao dịch ${String(d.bankReference ?? "")}. Bạn vẫn lưu thêm lần trả này?`;
}
