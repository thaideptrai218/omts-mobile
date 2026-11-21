import type { CustomerPayment, PaymentSavedState } from "@/features/finance/models/CustomerPayment";
import { useState } from "react";
import { Button, useLocation, useNavigate, useParams } from "zmp-ui";

import { Actions } from "@/components/Actions/Actions";
import { Badge } from "@/components/Badge/Badge";
import { ConfirmSheet } from "@/components/ConfirmSheet/ConfirmSheet";
import { Facts } from "@/components/Facts/Facts";
import { Loadable } from "@/components/Loadable/Loadable";
import { ManagePage } from "@/components/ManagePage/ManagePage";
import { ReasonSheet } from "@/components/ReasonSheet/ReasonSheet";
import { Row } from "@/components/Row/Row";
import { Rows } from "@/components/Rows/Rows";
import { Section } from "@/components/Section/Section";
import { cancelCustomerPayment, confirmCustomerPayment, getCustomerPayment } from "@/features/finance/services/customerPaymentService";
import { debtSentence, KIND_TEXT, METHOD_TEXT, needsSettlement, PAYMENT_STATUS, paymentStatus, paymentTitle } from "@/features/finance/utils/financeText";
import { MAX_NOTE } from "@/features/finance/utils/paymentDraft";
import { useAction } from "@/hooks/useAction";
import { useBusinessPermission } from "@/hooks/useBusinessPermission";
import { useLoad } from "@/hooks/useLoad";
import { date, dateTime, money } from "@/utils/format";
import "@/features/finance/styles/finance.scss";

/**
 * Một phiếu thu hoặc phiếu trả lại tiền (`/manage/customer-payments/:id`): số tiền, người thu, các hóa đơn được trừ.
 * Khoản chờ xác nhận (tiền mặt nhận tại cảng) thì xác nhận được (DEBT-02.2, không đổi công nợ theo BR-DEBT-02); phiếu
 * chưa hủy thì hủy được kèm lý do (DEBT-02.4), phiếu đã hủy không còn tính vào công nợ.
 */
export default function CustomerPaymentDetailPage() {
  const { id = "" } = useParams();
  const navigate = useNavigate();
  // Công nợ sau khi ghi chỉ có khi vừa lưu từ form; mở lại phiếu sau đó thì không hiện.
  const saved = (useLocation().state as PaymentSavedState | null) ?? null;
  const [debtAfter, setDebtAfter] = useState<number | null>(saved?.debtAfter ?? null);
  const { data, error, reload, setData } = useLoad(() => getCustomerPayment(id), [id]);
  const can = useBusinessPermission();
  const canEdit = can("CUSTOMER_PAYMENTS", "Edit");
  const { busy, run } = useAction();
  const [confirming, setConfirming] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  const confirm = async (payment: CustomerPayment) => {
    const done = await run(() => confirmCustomerPayment(payment.id), `Đã xác nhận ${paymentTitle(payment, true)}.`);
    setConfirming(false);
    if (done) setData(done.payment);
    else void reload();
  };

  const cancel = async (payment: CustomerPayment, reason: string) => {
    const done = await run(() => cancelCustomerPayment(payment.id, { reason, rowVersion: payment.rowVersion }), `Đã hủy ${paymentTitle(payment, true)}.`);
    if (!done) {
      void reload();
      return false;
    }
    setData(done.payment);
    setDebtAfter(done.debtAfter);
    return true;
  };

  return (
    <ManagePage title={data ? paymentTitle(data) : "Phiếu thu"}>
      <Loadable data={data} error={error} reload={() => void reload()}>
        {(p) => {
          const st = paymentStatus(p);
          const awaiting = p.statusId === PAYMENT_STATUS.awaiting;
          const cancelled = p.statusId === PAYMENT_STATUS.cancelled;
          const unsettled = needsSettlement(p);
          const paidBack = p.kind === "PaidBack";
          const allocations = p.allocations ?? [];
          return (
            <>
              {debtAfter !== null && p.customer && (
                <p className="card form finance-notice" role="status">
                  Sau thao tác này: {debtSentence(p.customer.name, debtAfter)}
                </p>
              )}
              <Facts
                items={[
                  ["Trạng thái", <Badge key="st" text={st.text} tone={st.tone} />],
                  ["Loại", KIND_TEXT[p.kind]],
                  ["Thương lái", p.customer ? p.customer.name : "Chưa rõ thương lái"],
                  ["Số tiền", money(p.amount)],
                  ["Chiết khấu", p.discountAmount > 0 ? money(p.discountAmount) : null],
                  ["Hình thức", METHOD_TEXT[p.method] ?? p.method],
                  ["Mã giao dịch ngân hàng", p.bankReference],
                  ["Tài khoản của HTX", p.cashAccount ? `${p.cashAccount.providerName} ${p.cashAccount.accountNumber}` : null],
                  [paidBack ? "Lúc trả" : "Lúc nhận tiền", dateTime(p.paidAt)],
                  ["Hóa đơn đi kèm", p.invoice?.code],
                  ["Mã hóa đơn trong nội dung chuyển khoản", p.transferInvoiceCode],
                  ["Chuyển khoản lúc", p.transferredAt ? dateTime(p.transferredAt) : null],
                  [paidBack ? "Người trả tiền" : "Người nhận tiền", p.collectedBy?.name],
                  ["Người ghi", p.recordedBy ? p.recordedBy.name : "Hệ thống tự ghi"],
                  ["Người xác nhận", p.confirmedBy ? `${p.confirmedBy.name}${p.confirmedAt ? `, ${dateTime(p.confirmedAt)}` : ""}` : null],
                  ["Ghi chú", p.note],
                  ["Người hủy", p.cancelledBy ? `${p.cancelledBy.name}${p.cancelledAt ? `, ${dateTime(p.cancelledAt)}` : ""}` : null],
                  ["Lý do hủy", p.cancelReason],
                ]}
              />

              {!paidBack && (
                <Section title="Trừ vào hóa đơn">
                  {allocations.length === 0 ? (
                    <p className="form__hint">Phiếu không chỉ định hóa đơn: tiền được trừ dần vào các hóa đơn chưa trả, cũ nhất trước.</p>
                  ) : (
                    <Rows>
                      {allocations.map((a) => (
                        <Row
                          key={a.invoiceId}
                          title={`Hóa đơn ${a.invoiceCode}`}
                          meta={`${date(a.invoicedAt)} · tổng ${money(a.invoiceTotal)}`}
                          value={money(a.amount)}
                          onClick={() => navigate(`/manage/invoices/${a.invoiceId}`)}
                        />
                      ))}
                    </Rows>
                  )}
                </Section>
              )}

              {p.statusId === PAYMENT_STATUS.pendingTransfer && (
                <p className="form__hint">Khoản này đang chờ thương lái chuyển khoản, chưa tính vào công nợ. Khi tiền về, hệ thống tự ghi nhận.</p>
              )}
              {awaiting && unsettled && (
                <p className="form__hint">Khoản chuyển khoản này chưa gắn với thương lái hay hóa đơn nào nên chưa xác nhận được (DEBT-02.6). Nếu không phải tiền của HTX thì hủy.</p>
              )}

              {canEdit && !cancelled && (
                <Actions>
                  {awaiting && !unsettled && (
                    <Button fullWidth size="large" disabled={busy} onClick={() => setConfirming(true)}>
                      Xác nhận đã nhận tiền
                    </Button>
                  )}
                  <Button fullWidth size="large" variant="secondary" type="danger" disabled={busy} onClick={() => setCancelling(true)}>
                    Hủy phiếu
                  </Button>
                </Actions>
              )}

              <ConfirmSheet
                visible={confirming}
                title="Xác nhận đã nhận tiền?"
                message={`Xác nhận HTX đã nhận đủ ${money(p.amount)}${p.customer ? ` của ${p.customer.name}` : ""}. Công nợ không đổi vì khoản này đã được tính khi ghi.`}
                confirmText="Xác nhận đã nhận tiền"
                busy={busy}
                onClose={() => setConfirming(false)}
                onConfirm={() => void confirm(p)}
              />
              <ReasonSheet
                visible={cancelling}
                title={`Hủy ${paymentTitle(p, true)}?`}
                intro={
                  p.statusId === PAYMENT_STATUS.pendingTransfer
                    ? "Khoản chờ chuyển khoản chưa tính vào công nợ. Phiếu đã hủy không khôi phục được; thao tác được ghi vào nhật ký."
                    : "Phiếu đã hủy không còn tính vào công nợ và không khôi phục được. Thao tác được ghi vào nhật ký."
                }
                confirmText="Hủy phiếu"
                required
                maxLength={MAX_NOTE}
                danger
                busy={busy}
                onClose={() => setCancelling(false)}
                onConfirm={(reason) => cancel(p, reason)}
              />
            </>
          );
        }}
      </Loadable>
    </ManagePage>
  );
}
