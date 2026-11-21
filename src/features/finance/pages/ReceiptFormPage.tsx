import type { PaymentAllocationInput } from "@/features/finance/models/CustomerPayment";
import type { AllocationMode, CustomerPaymentForm, PaymentDraft, UnpaidInvoice } from "@/features/finance/models/CustomerPaymentForm";
import { useState } from "react";
import { Button, Checkbox, useLocation, useNavigate } from "zmp-ui";

import { ConfirmSheet } from "@/components/ConfirmSheet/ConfirmSheet";
import { Chips } from "@/components/Chips/Chips";
import { Facts } from "@/components/Facts/Facts";
import FormError from "@/components/FormError/FormError";
import { Loadable } from "@/components/Loadable/Loadable";
import { ManagePage } from "@/components/ManagePage/ManagePage";
import { NumberInput } from "@/components/NumberInput/NumberInput";
import { Row } from "@/components/Row/Row";
import { Rows } from "@/components/Rows/Rows";
import { Section } from "@/components/Section/Section";
import { MESSAGES } from "@/constants/messages";
import { CustomerPicker } from "@/features/finance/components/CustomerPicker/CustomerPicker";
import { PaymentFields } from "@/features/finance/components/PaymentFields/PaymentFields";
import { usePaymentSubmit } from "@/features/finance/hooks/usePaymentSubmit";
import { getPaymentForm, recordCustomerPayment } from "@/features/finance/services/customerPaymentService";
import { amountText, debtText, METHOD_TEXT, wholeVnd } from "@/features/finance/utils/financeText";
import { draftBody, draftError, newDraft } from "@/features/finance/utils/paymentDraft";
import { useLoad } from "@/hooks/useLoad";
import { date, money } from "@/utils/format";
import { newOperationId } from "@/utils/operationId";
import "@/features/finance/styles/finance.scss";

const TITLE = "Ghi phiếu thu";

/**
 * Ghi tiền đã nhận của thương lái (DEBT-02, `/manage/customer-payments/new?customer=<id>`). Chưa có thương lái thì chọn
 * trước. Phiếu hoàn tất ngay khi lưu và tính vào công nợ (BR-DEBT-03); Chủ HTX nhận thông báo MSG-DEBT-03 (BR-DEBT-06).
 */
export default function ReceiptFormPage() {
  const customerId = new URLSearchParams(useLocation().search).get("customer") ?? "";
  const navigate = useNavigate();
  if (!customerId) {
    return (
      <ManagePage title={TITLE}>
        <CustomerPicker mode="receive" onPick={(c) => navigate(`/manage/customer-payments/new?customer=${encodeURIComponent(c.id)}`, { replace: true })} />
      </ManagePage>
    );
  }
  return <ReceiptLoader key={customerId} customerId={customerId} />;
}

function ReceiptLoader({ customerId }: { customerId: string }) {
  const { data, error, reload } = useLoad(() => getPaymentForm(customerId), [customerId]);
  // Form đặt nút chính ở chân trang nên tự dựng ManagePage; khung dưới chỉ dùng khi đang tải hoặc lỗi.
  if (data) return <ReceiptForm form={data} />;
  return (
    <ManagePage title={TITLE}>
      <Loadable data={data} error={error} reload={() => void reload()}>
        {() => null}
      </Loadable>
    </ManagePage>
  );
}

/** Tổng các phần đã chọn, bỏ qua ô gõ sai (kiểm tra riêng khi lưu). */
function partsSum(parts: Record<string, string>) {
  return Object.values(parts).reduce((sum, text) => sum + (wholeVnd(text) ?? 0), 0);
}

function ReceiptForm({ form }: { form: CustomerPaymentForm }) {
  const navigate = useNavigate();
  const [draft, setDraft] = useState<PaymentDraft>(() => newDraft(form));
  const [discount, setDiscount] = useState("");
  const [mode, setMode] = useState<AllocationMode>("oldest");
  // Hóa đơn đã chọn → số tiền trừ vào hóa đơn đó (chữ người dùng gõ).
  const [parts, setParts] = useState<Record<string, string>>({});
  const [confirming, setConfirming] = useState(false);
  const [key] = useState(newOperationId);

  const amount = wholeVnd(draft.amount);
  const discountAmount = discount.trim() ? wholeVnd(discount) : 0;
  const covers = (amount ?? 0) + (discountAmount ?? 0);
  const invoices = form.unpaidInvoices;

  const allocations = (): PaymentAllocationInput[] | null =>
    mode === "oldest" ? null : invoices.filter((i) => i.id in parts).map((i) => ({ invoiceId: i.id, amount: wholeVnd(parts[i.id]) ?? 0 }));

  const { busy, error, setError, question, submit, answer } = usePaymentSubmit((flags) =>
    recordCustomerPayment({
      customerId: form.customer.id,
      ...draftBody(draft),
      discountAmount: discountAmount ?? 0,
      allocations: allocations(),
      confirmAboveDebt: flags.confirmAboveDebt ?? false,
      confirmDuplicateBankReference: flags.confirmDuplicateBankReference ?? false,
      deduplicationKey: key,
    }),
  );

  const change = (patch: Partial<PaymentDraft>) => {
    setDraft((d) => ({ ...d, ...patch }));
    setError("");
  };

  const toggle = (invoice: UnpaidInvoice, on: boolean) => {
    setError("");
    setParts((current) => {
      const next = { ...current };
      if (!on) {
        delete next[invoice.id];
        return next;
      }
      // Gợi ý phần còn lại của khoản thu, tối đa bằng số hóa đơn còn nợ.
      const left = Math.min(invoice.unpaid, Math.max(covers - partsSum(current), 0));
      next[invoice.id] = left > 0 ? amountText(left) : "";
      return next;
    });
  };

  /** Kiểm tra tại chỗ trước khi hỏi lại; máy chủ vẫn kiểm tra lần cuối. */
  const check = () => {
    const common = draftError(draft);
    if (common) return common;
    if (discountAmount === null) return MESSAGES.MSG01("Chiết khấu (số đồng nguyên)");
    if (amount === 0 && !discountAmount) return "Nhập số tiền đã nhận. Chỉ để 0 khi cả khoản là chiết khấu.";
    if (mode === "pick") {
      const chosen = invoices.filter((i) => i.id in parts);
      if (chosen.length === 0) return "Chọn ít nhất một hóa đơn, hoặc chọn “Hóa đơn cũ nhất trước”.";
      const wrong = chosen.find((i) => { const v = wholeVnd(parts[i.id]); return v === null || v <= 0 || v > i.unpaid; });
      if (wrong) return `Số tiền trừ vào hóa đơn ${wrong.code} phải lớn hơn 0 và không quá ${money(wrong.unpaid)}.`;
      if (partsSum(parts) > covers) return `Tổng tiền trừ vào các hóa đơn (${money(partsSum(parts))}) không được lớn hơn số tiền thu cộng chiết khấu (${money(covers)}).`;
    }
    return "";
  };

  const askSave = () => {
    const problem = check();
    setError(problem);
    if (!problem) setConfirming(true);
  };

  const chosenCodes = invoices.filter((i) => i.id in parts).map((i) => i.code).join(", ");
  const footer = (
    <Button fullWidth size="large" loading={busy} disabled={busy} onClick={askSave}>
      Lưu phiếu thu
    </Button>
  );

  return (
    <ManagePage title={TITLE} footer={footer}>
      <Section step={1} title="Thương lái">
        <Facts
          items={[
            ["Thương lái", form.customer.name],
            ["Mã", form.customer.code],
            ["Số điện thoại", form.customer.phoneNumber],
            ["Công nợ hôm nay", <span key="debt" className={form.debt > 0 ? "text-danger" : undefined}>{debtText(form.debt)}</span>],
            ["Nợ lâu nhất", form.debtAgeDays === null ? null : `${form.debtAgeDays} ngày`],
          ]}
        />
        <div className="action-row">
          {form.debt > 0 && (
            <Button fullWidth variant="secondary" size="large" disabled={busy} onClick={() => change({ amount: amountText(form.debt) })}>
              Điền đủ số nợ ({money(form.debt)})
            </Button>
          )}
          <Button fullWidth variant="secondary" size="large" disabled={busy} onClick={() => navigate("/manage/customer-payments/new", { replace: true })}>
            Chọn thương lái khác
          </Button>
        </div>
      </Section>

      <Section step={2} title="Tiền đã nhận">
        <PaymentFields form={form} draft={draft} onChange={change} disabled={busy} amountLabel="Số tiền đã nhận (đồng)" dateLabel="Ngày thu" personLabel="Người nhận tiền" />
        <div className="form card">
          <NumberInput
            label="Chiết khấu (đồng, không bắt buộc)"
            value={discount}
            onChange={(v) => { setDiscount(v); setError(""); }}
            disabled={busy}
            helperText="Phần nợ HTX bỏ qua cho thương lái, không thu tiền. Được trừ vào nợ như tiền thu."
          />
        </div>
      </Section>

      <Section step={3} title="Trừ vào hóa đơn">
        {invoices.length === 0 ? (
          <p className="form__hint">Thương lái không còn hóa đơn nào chưa trả đủ. Khoản thu sẽ thành tiền trả trước.</p>
        ) : (
          <>
            <Chips<AllocationMode>
              options={[
                ["oldest", "Hóa đơn cũ nhất trước"],
                ["pick", "Tự chọn hóa đơn"],
              ]}
              value={mode}
              onChange={(m) => { setMode(m); setError(""); }}
            />
            {mode === "oldest" ? (
              <>
                <p className="form__hint">Tiền thu được trừ dần vào các hóa đơn chưa trả, cũ nhất trước (BR-DEBT-05).</p>
                <Rows>
                  {invoices.map((i) => (
                    <Row key={i.id} title={`Hóa đơn ${i.code}`} meta={`${date(i.invoiceDate)} · ${i.ageDays} ngày`} value={`Còn ${money(i.unpaid)}`} />
                  ))}
                </Rows>
              </>
            ) : (
              <div className="form">
                {invoices.map((i) => {
                  const chosen = i.id in parts;
                  return (
                    <div key={i.id} className="line-item card">
                      <Checkbox className="finance-option" value={i.id} checked={chosen} disabled={busy} onChange={(e) => toggle(i, e.target.checked)}>
                        Hóa đơn {i.code}
                      </Checkbox>
                      <p className="form__hint">
                        Ngày {date(i.invoiceDate)} · tổng {money(i.total)} · còn nợ {money(i.unpaid)}
                      </p>
                      {chosen && (
                        <NumberInput
                          label="Số tiền trừ vào hóa đơn này (đồng)"
                          value={parts[i.id]}
                          onChange={(v) => { setParts((p) => ({ ...p, [i.id]: v })); setError(""); }}
                          disabled={busy}
                        />
                      )}
                    </div>
                  );
                })}
                <p className="finance-total">
                  Đã trừ vào hóa đơn {money(partsSum(parts))} / {money(covers)}
                </p>
                <p className="form__hint">Phần không trừ vào hóa đơn đã chọn sẽ trừ dần vào các hóa đơn cũ nhất.</p>
              </div>
            )}
          </>
        )}
      </Section>

      <FormError text={error} />

      <ConfirmSheet
        visible={confirming}
        title="Lưu phiếu thu?"
        message={
          <div className="form">
            <Facts
              items={[
                ["Thương lái", form.customer.name],
                ["Số tiền", money(amount)],
                ["Chiết khấu", discountAmount ? money(discountAmount) : null],
                ["Hình thức", METHOD_TEXT[draft.method]],
                ["Mã giao dịch", draft.method === "OtherTransfer" ? draft.bankReference.trim() : null],
                ["Ngày thu", date(draft.paymentDate)],
                ["Trừ vào", mode === "oldest" || invoices.length === 0 ? "Hóa đơn cũ nhất trước" : chosenCodes],
              ]}
            />
            <p>Phiếu được tính vào công nợ ngay khi lưu. Ghi sai thì hủy phiếu, không sửa được.</p>
          </div>
        }
        confirmText="Lưu phiếu thu"
        onClose={() => setConfirming(false)}
        onConfirm={() => {
          // Đóng sheet trước để lỗi từ máy chủ hiện ở FormError của form.
          setConfirming(false);
          submit();
        }}
      />
      <ConfirmSheet
        visible={question !== null}
        title="Xác nhận lại"
        message={question?.text ?? ""}
        confirmText="Có, vẫn lưu"
        busy={busy}
        onClose={() => answer(false)}
        onConfirm={() => answer(true)}
      />
    </ManagePage>
  );
}
