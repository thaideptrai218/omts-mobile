import type { ReceiptView } from "@/features/purchasing/models/PurchaseReceipt";
import type { PaymentMethod } from "@/features/purchasing/models/SupplierPayment";
import { useEffect, useState } from "react";
import { Button, Input, Select, useNavigate, useParams, useSnackbar } from "zmp-ui";

import { ConfirmSheet } from "@/components/ConfirmSheet/ConfirmSheet";
import DateField from "@/components/DateField/DateField";
import FormError from "@/components/FormError/FormError";
import { Empty } from "@/components/Empty/Empty";
import { Facts } from "@/components/Facts/Facts";
import { Loadable } from "@/components/Loadable/Loadable";
import { ManagePage } from "@/components/ManagePage/ManagePage";
import { NumberInput } from "@/components/NumberInput/NumberInput";
import { Section } from "@/components/Section/Section";
import { MESSAGES } from "@/constants/messages";
import { createPurchaseReturn, getReceipt } from "@/features/purchasing/services/purchasingService";
import { useLoad } from "@/hooks/useLoad";
import { errorText } from "@/utils/errorText";
import { money, num, parseNumber, todayIso } from "@/utils/format";
import { PAYMENT_METHOD } from "@/utils/labels";

const TITLE = "Trả hàng nhà cung cấp";

/** Giá trị hàng trả như server tính: số lượng × đơn giá × (phải trả ÷ tổng tiền hàng), làm tròn đến nghìn đồng. */
function estimateValue(receipt: ReceiptView, quantities: Record<string, string>) {
  if (receipt.subtotal === 0) return 0;
  const total = receipt.lines.reduce((sum, line) => {
    const quantity = parseNumber(quantities[line.id] ?? "") ?? 0;
    return sum + Math.round((quantity * line.unitPrice * receipt.payable) / receipt.subtotal / 1000) * 1000;
  }, 0);
  return Math.min(total, receipt.payable - receipt.returned);
}

/**
 * Trả hàng nhà cung cấp (`/manage/purchases/:id/return`). Giá trị trả phải bằng tiền trừ công nợ cộng tiền nhận lại.
 * App điền sẵn phần trừ công nợ trước; server tính lại giá trị và báo số đúng nếu khác do làm tròn.
 */
function PurchaseReturnPage() {
  const { id = "" } = useParams();
  const { data, error: loadError, reload } = useLoad(() => getReceipt(id), [id]);

  // Form đặt nút chính ở chân trang nên tự dựng ManagePage; khung dưới chỉ dùng khi đang tải hoặc lỗi.
  if (data) return <ReturnForm receipt={data} />;

  return (
    <ManagePage title={TITLE}>
      <Loadable data={data} error={loadError} reload={() => void reload()}>
        {() => null}
      </Loadable>
    </ManagePage>
  );
}

function ReturnForm({ receipt }: { receipt: ReceiptView }) {
  const navigate = useNavigate();
  const { openSnackbar } = useSnackbar();
  const [quantities, setQuantities] = useState<Record<string, string>>({});
  const [returnDate, setReturnDate] = useState<string | null>(todayIso());
  const [reason, setReason] = useState("");
  const [debt, setDebt] = useState("");
  const [refund, setRefund] = useState("");
  const [method, setMethod] = useState<PaymentMethod>("BankTransfer");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [confirming, setConfirming] = useState(false);

  const lines = receipt.lines.filter((l) => l.returnable > 0);
  const value = estimateValue(receipt, quantities);

  // Đổi số lượng thì chia lại tiền: trừ công nợ trước, phần vượt công nợ là tiền nhà cung cấp hoàn lại.
  useEffect(() => {
    const reduced = Math.min(value, receipt.outstanding);
    setDebt(reduced ? String(reduced) : "");
    setRefund(value > reduced ? String(value - reduced) : "");
  }, [value, receipt.outstanding]);

  const save = async () => {
    if (busy) return;
    const chosen = lines.flatMap((l) => {
      const quantity = parseNumber(quantities[l.id] ?? "");
      return quantity ? [{ receiptLineId: l.id, quantity }] : [];
    });
    if (chosen.length === 0) {
      setError(MESSAGES.MSG01("Số lượng trả"));
      return;
    }
    if (!returnDate || !reason.trim()) {
      setError(MESSAGES.MSG01(!returnDate ? "Ngày trả hàng" : "Lý do trả hàng"));
      return;
    }
    const refundAmount = parseNumber(refund) ?? 0;
    setBusy(true);
    setError("");
    try {
      await createPurchaseReturn(receipt.id, {
        returnDate,
        reason: reason.trim(),
        refundAmount,
        refundMethod: refundAmount > 0 ? method : null,
        debtReductionAmount: parseNumber(debt) ?? 0,
        lines: chosen,
      });
      openSnackbar({ text: "Đã ghi trả hàng.", type: "success", duration: 4000 });
      navigate(`/manage/purchases/${receipt.id}`, { replace: true });
    } catch (err) {
      setError(errorText(err));
    } finally {
      setBusy(false);
    }
  };

  // Còn thiếu thì để save báo lỗi như cũ (chưa gửi gì lên server); đủ rồi mới hỏi lại trước khi ghi.
  const askSave = () => {
    const hasQuantity = lines.some((l) => parseNumber(quantities[l.id] ?? ""));
    if (!hasQuantity || !returnDate || !reason.trim()) {
      void save();
      return;
    }
    setConfirming(true);
  };

  if (lines.length === 0) {
    return (
      <ManagePage title={TITLE}>
        <Empty icon="zi-check-circle" title="Không còn hàng để trả" text="Các dòng của phiếu này đã trả hết hoặc đã dùng để thả giống." />
      </ManagePage>
    );
  }

  const refundValue = parseNumber(refund) ?? 0;

  return (
    <ManagePage
      title={TITLE}
      footer={
        <Button fullWidth size="large" loading={busy} disabled={busy} onClick={askSave}>
          Ghi trả hàng
        </Button>
      }
    >
      <div className="form">
        <Facts
          items={[
            ["Phiếu nhập", receipt.code],
            ["Nhà cung cấp", receipt.supplier.name],
            ["Còn nợ", money(receipt.outstanding)],
          ]}
        />
        <Section step={1} title="Hàng trả">
          <div className="form">
            <p className="form__intro">Nhập số lượng trả cho ít nhất một loại hàng.</p>
            {lines.map((l) => (
              <NumberInput
                key={l.id}
                decimal
                label={l.itemName ?? l.itemCode ?? "Vật tư"}
                helperText={`Trả được tối đa ${num(l.returnable, l.unit ?? undefined)}, đơn giá ${money(l.unitPrice)}`}
                value={quantities[l.id] ?? ""}
                onChange={(v) => { setError(""); setQuantities((current) => ({ ...current, [l.id]: v })); }}
                disabled={busy}
              />
            ))}
          </div>
        </Section>
        <Section step={2} title="Thông tin trả hàng">
          <div className="form card">
            <DateField label="Ngày trả hàng (bắt buộc)" value={returnDate} onChange={setReturnDate} disabled={busy} />
            <Input.TextArea label="Lý do trả hàng (bắt buộc)" value={reason} onChange={(e) => setReason(e.target.value)} maxLength={1000} showCount disabled={busy} />
          </div>
        </Section>
        <Section step={3} title="Trừ nợ và hoàn tiền">
          <div className="form card">
            <p className="form__intro">Giá trị hàng trả ước tính: <strong>{money(value)}</strong></p>
            <NumberInput label="Trừ vào công nợ (đồng)" value={debt} onChange={setDebt} disabled={busy} />
            <NumberInput label="Nhà cung cấp hoàn lại (đồng)" value={refund} onChange={setRefund} disabled={busy} />
            {refundValue > 0 && (
              <Select label="Hình thức hoàn tiền" value={method} onChange={(v) => setMethod(v as PaymentMethod)} closeOnSelect disabled={busy}>
                {Object.keys(PAYMENT_METHOD).map((k) => (
                  <Select.Option key={k} value={k} title={PAYMENT_METHOD[k]} />
                ))}
              </Select>
            )}
          </div>
        </Section>
        <FormError text={error} />
      </div>

      <ConfirmSheet
        visible={confirming}
        title="Ghi trả hàng?"
        message={
          <div className="form">
            <Facts
              items={[
                ["Nhà cung cấp", receipt.supplier.name],
                ["Giá trị hàng trả ước tính", money(value)],
                ["Trừ vào công nợ", money(parseNumber(debt) ?? 0)],
                ["Nhà cung cấp hoàn lại", refundValue > 0 ? money(refundValue) : null],
              ]}
            />
            <p>Ghi xong không sửa hay hủy được trên ứng dụng.</p>
          </div>
        }
        confirmText="Ghi trả hàng"
        onClose={() => setConfirming(false)}
        onConfirm={() => {
          // Đóng sheet trước để lỗi từ server hiện ở FormError của form.
          setConfirming(false);
          void save();
        }}
      />
    </ManagePage>
  );
}

export default PurchaseReturnPage;
