import type { WagePaymentMethod } from "@/features/payroll/models/PayrollPayment";
import { Input, Select } from "zmp-ui";
import { METHOD_TEXT, PAY_METHODS } from "@/features/payroll/utils/payText";
import { toLocalInput } from "@/utils/format";

/**
 * Các ô chung của một lần trả lương hoặc tạm ứng (LABOR-14): hình thức (tiền mặt hay chuyển khoản), ngày giờ trả (giờ HTX,
 * không sau hiện tại) và ghi chú (in kèm trên phiếu chi, tối đa 500 ký tự).
 */
export default function PaymentFields({ method, paidAt, note, disabled, onMethod, onPaidAt, onNote }: {
  method: WagePaymentMethod;
  paidAt: string;
  note: string;
  disabled: boolean;
  onMethod: (value: WagePaymentMethod) => void;
  onPaidAt: (value: string) => void;
  onNote: (value: string) => void;
}) {
  return (
    <>
      <Select label="Hình thức trả" value={method} onChange={(v) => onMethod(v as WagePaymentMethod)} closeOnSelect disabled={disabled}>
        {PAY_METHODS.map((m) => <Select.Option key={m} value={m} title={METHOD_TEXT[m]} />)}
      </Select>
      <Input label="Ngày giờ trả (bắt buộc)" type={"datetime-local" as never} value={paidAt} max={toLocalInput()} onChange={(e) => onPaidAt(e.target.value)} disabled={disabled} />
      <Input.TextArea label="Ghi chú (không bắt buộc)" value={note} onChange={(e) => onNote(e.target.value)} maxLength={500} showCount disabled={disabled} />
    </>
  );
}
