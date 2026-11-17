import type { CustomerPaymentForm, PaymentDraft } from "@/features/finance/models/CustomerPaymentForm";
import { useState } from "react";
import { Button, useLocation, useNavigate } from "zmp-ui";

import { ConfirmSheet } from "@/components/ConfirmSheet/ConfirmSheet";
import { Empty } from "@/components/Empty/Empty";
import { Facts } from "@/components/Facts/Facts";
import FormError from "@/components/FormError/FormError";
import { Loadable } from "@/components/Loadable/Loadable";
import { ManagePage } from "@/components/ManagePage/ManagePage";
import { Section } from "@/components/Section/Section";
import { CustomerPicker } from "@/features/finance/components/CustomerPicker/CustomerPicker";
import { PaymentFields } from "@/features/finance/components/PaymentFields/PaymentFields";
import { usePaymentSubmit } from "@/features/finance/hooks/usePaymentSubmit";
import { getPaymentForm, recordPayBack } from "@/features/finance/services/customerPaymentService";
import { amountText, debtText, METHOD_TEXT, wholeVnd } from "@/features/finance/utils/financeText";
import { draftBody, draftError, newDraft } from "@/features/finance/utils/paymentDraft";
import { useLoad } from "@/hooks/useLoad";
import { date, money } from "@/utils/format";
import { newOperationId } from "@/utils/operationId";
import "@/features/finance/styles/finance.scss";

const TITLE = "Trả lại tiền cho thương lái";

/**
 * Trả lại tiền HTX đang nợ thương lái (DEBT-02.3, `/manage/customer-payments/pay-back?customer=<id>`), ví dụ sau khi
 * thương lái trả dư hoặc hóa đơn được giảm giá. Tối đa bằng số HTX đang nợ lại (DEBT-02.3.E1, MSG-DEBT-06). Phiếu hoàn
 * tất ngay khi lưu và làm công nợ tăng lại; Chủ HTX nhận thông báo MSG-DEBT-03 (BR-DEBT-06).
 */
export default function PayBackPage() {
  const customerId = new URLSearchParams(useLocation().search).get("customer") ?? "";
  const navigate = useNavigate();
  if (!customerId) {
    return (
      <ManagePage title={TITLE}>
        <CustomerPicker mode="payBack" onPick={(c) => navigate(`/manage/customer-payments/pay-back?customer=${encodeURIComponent(c.id)}`, { replace: true })} />
      </ManagePage>
    );
  }
  return <PayBackLoader key={customerId} customerId={customerId} />;
}

function PayBackLoader({ customerId }: { customerId: string }) {
  const { data, error, reload } = useLoad(() => getPaymentForm(customerId), [customerId]);
  if (data) return <PayBackForm form={data} />;
  return (
    <ManagePage title={TITLE}>
      <Loadable data={data} error={error} reload={() => void reload()}>
        {() => null}
      </Loadable>
    </ManagePage>
  );
}

function PayBackForm({ form }: { form: CustomerPaymentForm }) {
  const navigate = useNavigate();
  // Thường trả lại đúng số HTX đang nợ, nên điền sẵn số đó; người dùng sửa được.
  const [draft, setDraft] = useState<PaymentDraft>(() => ({ ...newDraft(form), amount: form.owedBack > 0 ? amountText(form.owedBack) : "" }));
  const [confirming, setConfirming] = useState(false);
  const [key] = useState(newOperationId);
  const amount = wholeVnd(draft.amount);
  const canPayBack = form.owedBack > 0;

  const { busy, error, setError, question, submit, answer } = usePaymentSubmit((flags) =>
    recordPayBack({
      customerId: form.customer.id,
      ...draftBody(draft),
      discountAmount: 0,
      allocations: null,
      confirmAboveDebt: false,
      confirmDuplicateBankReference: flags.confirmDuplicateBankReference ?? false,
      deduplicationKey: key,
    }),
  );

  const change = (patch: Partial<PaymentDraft>) => {
    setDraft((d) => ({ ...d, ...patch }));
    setError("");
  };

  const askSave = () => {
    const problem = draftError(draft)
      || (amount === 0 ? "Số tiền trả lại phải lớn hơn 0." : "")
      || (amount !== null && amount > form.owedBack ? `HTX đang nợ lại ${form.customer.name} ${money(form.owedBack)}. Số tiền trả lại không được lớn hơn số này.` : "");
    setError(problem);
    if (!problem) setConfirming(true);
  };

  const changeCustomer = () => navigate("/manage/customer-payments/pay-back", { replace: true });
  const footer = canPayBack ? (
    <Button fullWidth size="large" loading={busy} disabled={busy} onClick={askSave}>
      Lưu phiếu trả lại tiền
    </Button>
  ) : undefined;

  return (
    <ManagePage title={TITLE} footer={footer}>
      <Section step={1} title="Thương lái">
        <Facts
          items={[
            ["Thương lái", form.customer.name],
            ["Mã", form.customer.code],
            ["Số điện thoại", form.customer.phoneNumber],
            ["Công nợ hôm nay", debtText(form.debt)],
            ["HTX có thể trả lại tối đa", money(form.owedBack)],
          ]}
        />
        <div className="action-row">
          <Button fullWidth variant="secondary" size="large" disabled={busy} onClick={changeCustomer}>
            Chọn thương lái khác
          </Button>
        </div>
      </Section>

      {canPayBack ? (
        <Section step={2} title="Tiền trả lại">
          <PaymentFields form={form} draft={draft} onChange={change} disabled={busy} amountLabel="Số tiền trả lại (đồng)" dateLabel="Ngày trả" personLabel="Người trả tiền" />
        </Section>
      ) : (
        <Empty icon="zi-check-circle" title="HTX không nợ lại thương lái này" text="Chỉ trả lại được khi công nợ nhỏ hơn 0, tức HTX đang nợ lại thương lái (ví dụ thương lái đã trả dư)." />
      )}

      <FormError text={error} />

      <ConfirmSheet
        visible={confirming}
        title="Lưu phiếu trả lại tiền?"
        message={
          <div className="form">
            <Facts
              items={[
                ["Thương lái", form.customer.name],
                ["Số tiền trả lại", money(amount)],
                ["Hình thức", METHOD_TEXT[draft.method]],
                ["Mã giao dịch", draft.method === "OtherTransfer" ? draft.bankReference.trim() : null],
                ["Ngày trả", date(draft.paymentDate)],
              ]}
            />
            <p>Phiếu được tính vào công nợ ngay khi lưu. Ghi sai thì hủy phiếu, không sửa được.</p>
          </div>
        }
        confirmText="Lưu phiếu trả lại tiền"
        onClose={() => setConfirming(false)}
        onConfirm={() => {
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
