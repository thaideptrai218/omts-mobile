import type { PayableEmployee, WagePaymentMethod } from "@/features/payroll/models/PayrollPayment";
import { useEffect, useState } from "react";
import { Button, Sheet } from "zmp-ui";
import FormError from "@/components/FormError/FormError";
import { Loadable } from "@/components/Loadable/Loadable";
import { NumberInput } from "@/components/NumberInput/NumberInput";
import { SearchBox } from "@/components/SearchBox/SearchBox";
import PaymentFields from "@/features/payroll/components/PaymentFields/PaymentFields";
import { payableEmployees, payEmployee } from "@/features/payroll/services/payrollService";
import { paidAtProblem, wholeAmount } from "@/features/payroll/utils/payText";
import { useLoad } from "@/hooks/useLoad";
import { errorText } from "@/utils/errorText";
import { fromLocalInput, money, num, parseNumber, toLocalInput } from "@/utils/format";
import "@/features/payroll/styles/payroll.scss";

/**
 * Trả tiền cho một nhân viên ngoài bảng lương (LABOR-14, `POST api/payroll-payments`): server trả các phiếu lương đã chốt còn
 * nợ, cũ nhất trước; phần dư (hoặc cả khoản khi không nợ gì) thành tạm ứng, bảng lương chốt kế tiếp của người đó sẽ trừ lại
 * (BR-LABOR-11). Chỉ nhân viên thời vụ đang làm mới được tạm ứng; người khác chỉ trả được tối đa số còn nợ (MSG-LABOR-34).
 */
export default function PayEmployeeSheet({ visible, onClose, onPaid }: { visible: boolean; onClose: () => void; onPaid: () => void }) {
  const [search, setSearch] = useState("");
  const [picked, setPicked] = useState<PayableEmployee | null>(null);
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState<WagePaymentMethod>("Cash");
  const [paidAt, setPaidAt] = useState(toLocalInput());
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  // Chỉ tải danh sách khi sheet đang mở; người còn nợ đứng trước để dễ chọn.
  const people = useLoad(async () => {
    if (!visible) return [];
    const result = await payableEmployees(search, true);
    return [...result.items].sort((a, b) => b.outstanding - a.outstanding || a.name.localeCompare(b.name, "vi"));
  }, [visible, search]);

  useEffect(() => {
    if (!visible) return;
    setPicked(null);
    setAmount("");
    setPaidAt(toLocalInput());
    setNote("");
    setError("");
  }, [visible]);

  const close = () => { if (!busy) onClose(); };

  const submit = async () => {
    if (!picked) { setError("Chọn nhân viên cần trả."); return; }
    const value = wholeAmount(parseNumber(amount));
    if (value === null) { setError("Số tiền phải là số nguyên từ 1 đồng trở lên."); return; }
    const when = paidAtProblem(paidAt, toLocalInput());
    if (when) { setError(when); return; }
    setBusy(true);
    setError("");
    try {
      await payEmployee({ employeeId: picked.employeeId, amount: value, paidAt: fromLocalInput(paidAt), method, note: note.trim() || null });
      onPaid();
      onClose();
    } catch (err) {
      setError(errorText(err));
    } finally {
      setBusy(false);
    }
  };

  const value = wholeAmount(parseNumber(amount));
  const advance = picked && value !== null && value > picked.outstanding ? value - picked.outstanding : 0;

  return (
    <Sheet visible={visible} onClose={close} autoHeight mask handler maskClosable={!busy} title="Trả lương hoặc tạm ứng">
      <div className="sheet-form form">
        <p className="form__intro">Tiền trả cho các phiếu lương đã chốt còn nợ, phiếu cũ nhất trước. Phần còn dư thành tiền tạm ứng, được trừ vào bảng lương chốt kế tiếp của người đó.</p>
        {picked ? (
          <div className="payroll-choice is-selected">
            <div className="payroll-choice__text">
              <span className="payroll-choice__name">{picked.name}{picked.code ? ` (${picked.code})` : ""}</span>
              <span className="payroll-choice__meta">{picked.outstanding > 0 ? `Còn phải trả ${money(picked.outstanding)}` : "Không còn nợ lương"}</span>
            </div>
            <Button fullWidth size="large" variant="secondary" disabled={busy} onClick={() => setPicked(null)}>Chọn người khác</Button>
          </div>
        ) : (
          <>
            <SearchBox label="Tìm nhân viên" placeholder="Tên hoặc mã nhân viên" onSearch={setSearch} />
            <Loadable data={people.data} error={people.error} reload={() => void people.reload()}>
              {(items) => items.length === 0 ? <p className="form__hint">Không có nhân viên phù hợp.</p> : (
                <div className="payroll-choices">
                  {items.map((p) => (
                    <button key={p.employeeId} type="button" className="payroll-choice payroll-choice--button" disabled={busy}
                      onClick={() => { setPicked(p); setAmount(p.outstanding > 0 ? num(p.outstanding) : ""); setError(""); }}>
                      <span className="payroll-choice__text">
                        <span className="payroll-choice__name">{p.name}{p.code ? ` (${p.code})` : ""}</span>
                        <span className="payroll-choice__meta">{p.outstanding > 0 ? `Còn phải trả ${money(p.outstanding)}` : "Không còn nợ lương"}</span>
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </Loadable>
          </>
        )}
        {picked && (
          <>
            <NumberInput label="Số tiền trả (đồng, bắt buộc)" value={amount} onChange={setAmount} disabled={busy}
              helperText={advance > 0 ? `${money(advance)} vượt số còn nợ sẽ thành tiền tạm ứng.` : undefined} />
            {picked.outstanding > 0 && (
              <Button fullWidth size="large" variant="secondary" disabled={busy} onClick={() => setAmount(num(picked.outstanding))}>
                Trả hết {money(picked.outstanding)}
              </Button>
            )}
            <PaymentFields method={method} paidAt={paidAt} note={note} disabled={busy} onMethod={setMethod} onPaidAt={setPaidAt} onNote={setNote} />
          </>
        )}
        <FormError text={error} />
        <div className="sheet-actions">
          <Button fullWidth size="large" loading={busy} disabled={busy || !picked} onClick={() => void submit()}>Ghi trả tiền</Button>
          <Button fullWidth size="large" variant="secondary" disabled={busy} onClick={close}>Không, quay lại</Button>
        </div>
      </div>
    </Sheet>
  );
}
