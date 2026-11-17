import type { WagePaymentMethod } from "@/features/payroll/models/PayrollPayment";
import { useEffect, useState } from "react";
import { Button, Sheet } from "zmp-ui";
import FormError from "@/components/FormError/FormError";
import { NumberInput } from "@/components/NumberInput/NumberInput";
import PaymentFields from "@/features/payroll/components/PaymentFields/PaymentFields";
import { payPayroll } from "@/features/payroll/services/payrollService";
import { paidAtProblem, wholeAmount } from "@/features/payroll/utils/payText";
import { errorText } from "@/utils/errorText";
import { fromLocalInput, money, num, parseNumber, toLocalInput } from "@/utils/format";
import "@/features/payroll/styles/payroll.scss";

/** Phiếu lương còn phải trả, đủ để hiện và trả trong sheet. */
type PayableSlip = { id: string; employeeName: string; outstanding: number };
type Choice = { on: boolean; amount: string };

/**
 * Trả các phiếu lương của một bảng lương đã chốt (LABOR-14): chọn người, số tiền mỗi người (mặc định trả đủ, không quá số
 * còn phải trả, BR-LABOR-11), hình thức và ngày giờ trả. Mỗi người thành một lần trả và một phiếu chi trong sổ quỹ.
 */
export default function PayLinesSheet({ visible, payrollId, slips, onClose, onPaid }: {
  visible: boolean;
  payrollId: string;
  slips: PayableSlip[];
  onClose: () => void;
  onPaid: (people: number) => void;
}) {
  const [choices, setChoices] = useState<Record<string, Choice>>({});
  const [method, setMethod] = useState<WagePaymentMethod>("Cash");
  const [paidAt, setPaidAt] = useState(toLocalInput());
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  // Mỗi lần mở: chọn sẵn mọi người với số còn phải trả, giờ trả là bây giờ.
  useEffect(() => {
    if (!visible) return;
    setChoices(Object.fromEntries(slips.map((s) => [s.id, { on: true, amount: num(s.outstanding) }])));
    setPaidAt(toLocalInput());
    setNote("");
    setError("");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  const chosen = slips.filter((s) => choices[s.id]?.on);
  const amounts = chosen.map((s) => ({ slip: s, amount: wholeAmount(parseNumber(choices[s.id]?.amount ?? ""), s.outstanding) }));
  const total = amounts.reduce((sum, a) => sum + (a.amount ?? 0), 0);
  const close = () => { if (!busy) onClose(); };
  const edit = (id: string, change: Partial<Choice>) => setChoices((c) => ({ ...c, [id]: { ...(c[id] ?? { on: false, amount: "" }), ...change } }));

  const submit = async () => {
    if (!chosen.length) { setError("Chọn ít nhất một người để trả."); return; }
    const wrong = amounts.find((a) => a.amount === null);
    if (wrong) { setError(`${wrong.slip.employeeName}: số tiền phải là số nguyên từ 1 đồng đến ${money(wrong.slip.outstanding)}.`); return; }
    const when = paidAtProblem(paidAt, toLocalInput());
    if (when) { setError(when); return; }
    setBusy(true);
    setError("");
    try {
      await payPayroll(payrollId, {
        paidAt: fromLocalInput(paidAt),
        method,
        note: note.trim() || null,
        lines: amounts.map((a) => ({ slipId: a.slip.id, amount: a.amount as number })),
      });
      onPaid(chosen.length);
      onClose();
    } catch (err) {
      setError(errorText(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Sheet visible={visible} onClose={close} autoHeight mask handler maskClosable={!busy} title="Ghi trả lương">
      <div className="sheet-form form">
        <p className="form__intro">Bỏ chọn người chưa trả lần này; sửa số tiền nếu chỉ trả một phần. Mỗi người được ghi thành một phiếu chi trong sổ quỹ.</p>
        <div className="payroll-choices">
          {slips.map((s) => {
            const choice = choices[s.id] ?? { on: false, amount: "" };
            return (
              <div key={s.id} className={`payroll-choice${choice.on ? " is-selected" : ""}`}>
                <label className="payroll-choice__head">
                  <input type="checkbox" checked={choice.on} disabled={busy} onChange={(e) => edit(s.id, { on: e.target.checked })} />
                  <span className="payroll-choice__text">
                    <span className="payroll-choice__name">{s.employeeName}</span>
                    <span className="payroll-choice__meta">Còn phải trả {money(s.outstanding)}</span>
                  </span>
                </label>
                {choice.on && <NumberInput label="Số tiền trả lần này (đồng)" value={choice.amount} onChange={(v) => edit(s.id, { amount: v })} disabled={busy} />}
              </div>
            );
          })}
        </div>
        <p className="payroll-total" role="status">Tổng trả: {money(total)} cho {chosen.length} người</p>
        <PaymentFields method={method} paidAt={paidAt} note={note} disabled={busy} onMethod={setMethod} onPaidAt={setPaidAt} onNote={setNote} />
        <FormError text={error} />
        <div className="sheet-actions">
          <Button fullWidth size="large" loading={busy} disabled={busy} onClick={() => void submit()}>Ghi trả lương</Button>
          <Button fullWidth size="large" variant="secondary" disabled={busy} onClick={close}>Không, quay lại</Button>
        </div>
      </div>
    </Sheet>
  );
}
