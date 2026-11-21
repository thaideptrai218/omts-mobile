import type { AdjustmentDirection, DebtAdjustmentSaved } from "@/features/customers/models/CustomerDebt";
import { useEffect, useState } from "react";
import { Button, Input, Sheet } from "zmp-ui";

import { Chips } from "@/components/Chips/Chips";
import FormError from "@/components/FormError/FormError";
import { NumberInput } from "@/components/NumberInput/NumberInput";
import { MESSAGES } from "@/constants/messages";
import { errorText } from "@/utils/errorText";
import { money, parseNumber } from "@/utils/format";
import { recordDebtAdjustment } from "@/features/customers/services/customerDebtService";
import { debtLabel } from "@/features/customers/utils/customerText";

const DIRECTIONS: [AdjustmentDirection, string][] = [
  ["increase", "Tăng nợ"],
  ["decrease", "Giảm nợ"],
];

const MAX_REASON = 1000;

/**
 * Điều chỉnh công nợ bằng tay ("Điều chỉnh"): số tiền nguyên đồng, khác 0, có lý do; tăng nợ là thương lái nợ thêm.
 * Điều chỉnh không sửa được, ghi nhầm thì hủy có lý do. Chủ HTX và Kế toán (CUSTOMER_PAYMENTS Edit) mới được ghi.
 */
export function DebtAdjustmentSheet({
  visible,
  customerId,
  customerName,
  debtToday,
  onClose,
  onSaved,
}: {
  visible: boolean;
  customerId: string;
  customerName: string;
  debtToday: number;
  onClose: () => void;
  onSaved: (saved: DebtAdjustmentSaved) => void;
}) {
  const [direction, setDirection] = useState<AdjustmentDirection>("decrease");
  const [amountText, setAmountText] = useState("");
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  // Đóng là xóa phần đang nhập, để lần mở sau bắt đầu lại từ đầu.
  useEffect(() => {
    if (visible) return;
    setDirection("decrease");
    setAmountText("");
    setReason("");
    setError("");
  }, [visible]);

  const amount = parseNumber(amountText);
  const valid = amount !== null && amount > 0 && Number.isInteger(amount);
  const signed = valid ? (direction === "increase" ? amount : -amount) : 0;
  const after = debtLabel(debtToday + signed);

  const save = async () => {
    if (!valid) {
      setError(MESSAGES.MSG01("Số tiền (số nguyên đồng, lớn hơn 0)"));
      return;
    }
    if (!reason.trim()) {
      setError(MESSAGES.MSG01("Lý do"));
      return;
    }
    setError("");
    setBusy(true);
    try {
      const saved = await recordDebtAdjustment({ customerId, amount: signed, reason: reason.trim() });
      onSaved(saved);
      onClose();
    } catch (err) {
      setError(errorText(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Sheet visible={visible} onClose={onClose} autoHeight mask handler swipeToClose={!busy} maskClosable={!busy} title="Điều chỉnh công nợ">
      <div className="sheet-form form">
        <p className="form__intro">
          Sửa nợ của {customerName} bằng tay khi có sai lệch. Điều chỉnh hiện trong sao kê và không sửa được; ghi nhầm thì hủy kèm lý do.
        </p>
        <Chips options={DIRECTIONS} value={direction} onChange={setDirection} />
        <NumberInput label="Số tiền điều chỉnh (đồng)" value={amountText} onChange={(v) => { setAmountText(v); setError(""); }} disabled={busy} />
        {valid && (
          <p className="form__hint">
            Sau điều chỉnh: {after.text} {money(Math.abs(debtToday + signed))}.
          </p>
        )}
        <Input.TextArea label="Lý do (bắt buộc)" value={reason} onChange={(e) => { setReason(e.target.value); setError(""); }} maxLength={MAX_REASON} showCount disabled={busy} />
        <FormError text={error} />
        <div className="sheet-actions">
          <Button fullWidth size="large" loading={busy} disabled={busy} onClick={() => void save()}>
            Lưu điều chỉnh
          </Button>
          <Button fullWidth size="large" variant="secondary" disabled={busy} onClick={onClose}>
            Không, quay lại
          </Button>
        </div>
      </div>
    </Sheet>
  );
}
