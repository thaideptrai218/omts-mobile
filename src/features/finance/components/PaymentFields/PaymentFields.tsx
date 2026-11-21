import type { CustomerPaymentForm, PaymentDraft } from "@/features/finance/models/CustomerPaymentForm";
import type { RecordedPaymentMethod } from "@/features/finance/models/CustomerPayment";
import { useAtomValue } from "jotai";
import { Input, Select } from "zmp-ui";

import { Chips } from "@/components/Chips/Chips";
import DateField from "@/components/DateField/DateField";
import { NumberInput } from "@/components/NumberInput/NumberInput";
import { permissionsAtom } from "@/features/auth/state/authAtoms";
import { MAX_BANK_REFERENCE, MAX_NOTE } from "@/features/finance/utils/paymentDraft";
import { METHOD_TEXT } from "@/features/finance/utils/financeText";

/**
 * Các ô chung của phiếu thu và phiếu trả lại tiền (BR-DEBT-03): số tiền, hình thức, mã giao dịch ngân hàng và tài khoản khi
 * chuyển khoản, ngày, người thu hoặc người trả, ghi chú. Chỉ có tiền mặt và chuyển khoản: VietQR của hóa đơn do hệ thống ghi.
 */
export function PaymentFields({
  form,
  draft,
  onChange,
  disabled,
  amountLabel,
  dateLabel,
  personLabel,
}: {
  form: CustomerPaymentForm;
  draft: PaymentDraft;
  onChange: (patch: Partial<PaymentDraft>) => void;
  disabled: boolean;
  amountLabel: string;
  dateLabel: string;
  personLabel: string;
}) {
  const transfer = draft.method === "OtherTransfer";
  // Ô trống là người đang ghi phiếu (máy chủ tự điền), nên bỏ tên người đó khỏi danh sách để không hiện hai lần.
  const selfId = useAtomValue(permissionsAtom)?.accountId;
  const others = form.cashCollectors.filter((a) => a.id !== selfId);
  return (
    <div className="form card">
      <NumberInput label={amountLabel} value={draft.amount} onChange={(amount) => onChange({ amount })} disabled={disabled} helperText="Số đồng nguyên, ví dụ 1.500.000." />
      <p className="finance-label">Hình thức</p>
      <Chips<RecordedPaymentMethod>
        options={[
          ["Cash", METHOD_TEXT.Cash],
          ["OtherTransfer", METHOD_TEXT.OtherTransfer],
        ]}
        value={draft.method}
        onChange={(method) => onChange({ method })}
      />
      {transfer && (
        <>
          <Input
            label="Mã giao dịch ngân hàng (bắt buộc)"
            size="large"
            value={draft.bankReference}
            onChange={(e) => onChange({ bankReference: e.target.value })}
            maxLength={MAX_BANK_REFERENCE}
            disabled={disabled}
            helperText="Chép từ tin nhắn hoặc sao kê của ngân hàng."
          />
          {form.bankAccounts.length > 0 && (
            <Select label="Tài khoản của HTX" value={draft.cashAccountId} onChange={(v) => onChange({ cashAccountId: String(v ?? "") })} closeOnSelect disabled={disabled}>
              <Select.Option value="" title="Không chọn" />
              {form.bankAccounts.map((a) => (
                <Select.Option key={a.id} value={a.id} title={`${a.providerName} ${a.accountNumber}${a.isDefault ? " (tài khoản nhận tiền)" : ""}`} />
              ))}
            </Select>
          )}
        </>
      )}
      <DateField label={dateLabel} value={draft.paymentDate} onChange={(paymentDate) => onChange({ paymentDate })} disabled={disabled} />
      {others.length > 0 && (
        <Select label={personLabel} value={draft.collectedById} onChange={(v) => onChange({ collectedById: String(v ?? "") })} closeOnSelect disabled={disabled}>
          <Select.Option value="" title="Tôi (người đang ghi phiếu)" />
          {others.map((a) => (
            <Select.Option key={a.id} value={a.id} title={a.name || "Không rõ tên"} />
          ))}
        </Select>
      )}
      <Input.TextArea label="Ghi chú (không bắt buộc)" value={draft.note} onChange={(e) => onChange({ note: e.target.value })} maxLength={MAX_NOTE} showCount disabled={disabled} />
    </div>
  );
}
