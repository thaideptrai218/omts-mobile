import type { SaveSupplierPayment, SupplierPayment, SupplierPaymentConfirmFlag, SupplierPaymentMethod } from "@/features/purchasing/models/SupplierPayment";
import { useState } from "react";
import { Button, Input, Select, Sheet } from "zmp-ui";

import { ConfirmSheet } from "@/components/ConfirmSheet/ConfirmSheet";
import DateField from "@/components/DateField/DateField";
import FormError from "@/components/FormError/FormError";
import { NumberInput } from "@/components/NumberInput/NumberInput";
import { MESSAGES } from "@/constants/messages";
import { ApiError } from "@/services/errors";
import { errorText } from "@/utils/errorText";
import { money, parseNumber, todayIso } from "@/utils/format";
import { PAYMENT_METHOD } from "@/utils/labels";
import { newDeduplicationKey, recordSupplierPayment } from "@/features/purchasing/services/purchasingService";
import { paymentQuestion } from "@/features/purchasing/utils/paymentText";

const METHODS: SupplierPaymentMethod[] = ["BankTransfer", "Cash"];

type Confirmations = Record<SupplierPaymentConfirmFlag, boolean>;

/**
 * Ghi một lần HTX trả tiền nhà cung cấp (PURCHASE-05). Mở từ một phiếu nhập thì tiền tính vào phiếu đó (`receipt`);
 * mở từ màn công nợ thì sổ công nợ tự tính vào các phiếu cũ nhất. Trả quá số nợ (MSG-PURCHASE-05) hoặc trùng mã giao
 * dịch (MSG-PURCHASE-06) thì backend hỏi lại: người dùng đồng ý thì gửi lại cùng yêu cầu kèm cờ xác nhận.
 */
export function SupplierPaymentSheet({
  visible,
  supplier,
  receipt,
  suggested,
  onClose,
  onPaid,
}: {
  visible: boolean;
  supplier: { id: string; name: string | null };
  /** Phiếu được trả; bỏ trống thì không gắn phiếu. */
  receipt?: { id: string; code: string | null; remaining: number };
  /** Nút điền nhanh số tiền, ví dụ "Trả hết nợ". */
  suggested?: { label: string; amount: number };
  onClose: () => void;
  onPaid: (payment: SupplierPayment) => void;
}) {
  const [amount, setAmount] = useState("");
  const [paymentDate, setPaymentDate] = useState(todayIso());
  const [method, setMethod] = useState<SupplierPaymentMethod>("BankTransfer");
  const [bankReference, setBankReference] = useState("");
  const [note, setNote] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [question, setQuestion] = useState<{ flag: SupplierPaymentConfirmFlag; text: string } | null>(null);
  const [confirmed, setConfirmed] = useState<Confirmations>({ confirmAdvance: false, confirmDuplicateBankReference: false });
  // Một khóa cho một lần ghi: bấm lưu lại sau lỗi mạng hoặc sau câu hỏi xác nhận không ghi trùng.
  const [dedupKey, setDedupKey] = useState(newDeduplicationKey);

  const reset = () => {
    setAmount("");
    setBankReference("");
    setNote("");
    setError("");
    setConfirmed({ confirmAdvance: false, confirmDuplicateBankReference: false });
    setDedupKey(newDeduplicationKey());
  };

  const send = async (flags: Confirmations) => {
    const value = parseNumber(amount);
    if (value === null || value <= 0 || !Number.isInteger(value)) {
      setError(MESSAGES.MSG01("Số tiền"));
      return;
    }
    if (!paymentDate || paymentDate > todayIso()) {
      setError(MESSAGES.MSG01("Ngày trả"));
      return;
    }
    if (method === "BankTransfer" && !bankReference.trim()) {
      setError(MESSAGES.MSG01("Mã giao dịch ngân hàng"));
      return;
    }
    const body: SaveSupplierPayment = {
      supplierId: supplier.id,
      kind: "Payment",
      paymentDate,
      amount: value,
      method,
      bankReference: method === "BankTransfer" ? bankReference.trim() : null,
      note: note.trim() || null,
      allocations: receipt ? [{ receiptId: receipt.id, amount: Math.min(value, receipt.remaining) }] : null,
      ...flags,
      deduplicationKey: dedupKey,
    };
    setError("");
    setBusy(true);
    try {
      const saved = await recordSupplierPayment(body);
      reset();
      onClose();
      onPaid(saved);
    } catch (err) {
      const flag = err instanceof ApiError && err.status === 409 ? (err.details.confirmFlag as SupplierPaymentConfirmFlag | undefined) : undefined;
      if (flag === "confirmAdvance" || flag === "confirmDuplicateBankReference") {
        setConfirmed(flags);
        setQuestion({ flag, text: paymentQuestion(err as ApiError) });
      } else {
        setError(errorText(err));
      }
    } finally {
      setBusy(false);
    }
  };

  const answer = (yes: boolean) => {
    if (!question) return;
    const flag = question.flag;
    setQuestion(null);
    if (!yes) return;
    void send({ ...confirmed, [flag]: true });
  };

  return (
    <>
      <Sheet visible={visible && !question} onClose={onClose} autoHeight mask handler swipeToClose={!busy} maskClosable={!busy} title="Ghi trả tiền nhà cung cấp">
        <div className="sheet-form form">
          <p className="form__intro">
            {receipt ? `Trả cho phiếu ${receipt.code ?? ""} của ${supplier.name ?? "nhà cung cấp"}, còn phải trả ${money(receipt.remaining)}.` : `Trả cho ${supplier.name ?? "nhà cung cấp"}. Tiền được tính vào các phiếu nhập cũ nhất trước.`}
          </p>
          <NumberInput label="Số tiền (bắt buộc)" value={amount} onChange={setAmount} disabled={busy} helperText="Số đồng, không có phần lẻ." />
          {suggested && suggested.amount > 0 && (
            <Button fullWidth variant="secondary" size="large" onClick={() => setAmount(String(suggested.amount))} disabled={busy}>
              {suggested.label} {money(suggested.amount)}
            </Button>
          )}
          <DateField label="Ngày trả (bắt buộc)" value={paymentDate} onChange={setPaymentDate} disabled={busy} />
          <Select label="Hình thức" value={method} onChange={(v) => setMethod(v as SupplierPaymentMethod)} closeOnSelect disabled={busy}>
            {METHODS.map((k) => (
              <Select.Option key={k} value={k} title={PAYMENT_METHOD[k]} />
            ))}
          </Select>
          {method === "BankTransfer" && (
            <Input
              label="Mã giao dịch ngân hàng (bắt buộc)"
              value={bankReference}
              onChange={(e) => setBankReference(e.target.value)}
              maxLength={100}
              disabled={busy}
              helperText="Mã in trên biên lai chuyển khoản, để đối chiếu với ngân hàng."
            />
          )}
          <Input label="Ghi chú (không bắt buộc)" value={note} onChange={(e) => setNote(e.target.value)} maxLength={1000} disabled={busy} />
          <FormError text={error} />
          <Button fullWidth size="large" loading={busy} disabled={busy} onClick={() => void send(confirmed)}>
            Lưu
          </Button>
        </div>
      </Sheet>
      <ConfirmSheet
        visible={question !== null}
        title="Xác nhận lần trả tiền"
        message={question?.text ?? ""}
        confirmText="Có, vẫn lưu"
        busy={busy}
        onClose={() => answer(false)}
        onConfirm={() => answer(true)}
      />
    </>
  );
}
