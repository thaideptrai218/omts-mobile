import { useState } from "react";
import { Button, Input, Modal, Select, Sheet, Switch, useNavigate, useParams } from "zmp-ui";

import FormError from "@/components/form-error";
import { Actions, Badge, Facts, Loadable, ManagePage, NumberInput, ReasonSheet, Row, Rows, Section } from "@/components/manage/ui";
import { useAction } from "@/hooks/use-action";
import { useBusinessPermission } from "@/hooks/use-business-permission";
import { useLoad } from "@/hooks/use-load";
import { errorText, MESSAGES } from "@/services/acs/messages";
import { date, dateTime, money, num, parseNumber, todayIso } from "@/services/format";
import { INPUT_GROUP, PAYMENT_METHOD, statusLabel } from "@/services/labels";
import {
  cancelReceipt,
  completeReceipt,
  getReceipt,
  newDeduplicationKey,
  RECEIPT_COMPLETED,
  RECEIPT_DRAFT,
  recordSupplierPayment,
  type PaymentMethod,
  type ReceiptView,
} from "@/services/purchasing";

import DateField from "@/components/manage/date-field";

/**
 * Chi tiết phiếu nhập: dòng hàng, tiền, các lần trả tiền và trả hàng. Phiếu nháp thì sửa hoặc hoàn tất; phiếu hoàn
 * tất còn nợ thì ghi trả tiền; phiếu chưa hủy thì hủy kèm lý do. Trả hàng làm trên bản web.
 */
function PurchaseDetailPage() {
  const allowed = useBusinessPermission();
  const { id = "" } = useParams();
  const navigate = useNavigate();
  const { data, error, reload, setData } = useLoad(() => getReceipt(id), [id]);
  const { busy, run } = useAction();
  const [completing, setCompleting] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [cancelPayments, setCancelPayments] = useState(true);
  const [paying, setPaying] = useState(false);

  const complete = async () => {
    if (!data) return;
    const saved = await run(() => completeReceipt(id, data.rowVersion), "Đã hoàn tất phiếu nhập.");
    if (saved) setData(saved);
    setCompleting(false);
  };

  const cancel = async (reason: string) => {
    if (!data) return false;
    const hasPayments = data.payments.some((p) => p.status === "Recorded");
    const saved = await run(
      () => cancelReceipt(id, { reason, cancelPayments: hasPayments ? cancelPayments : null, rowVersion: data.rowVersion }),
      "Đã hủy phiếu nhập.",
    );
    if (saved) setData(saved);
    return Boolean(saved);
  };

  return (
    <ManagePage title="Phiếu nhập">
      <Loadable data={data} error={error} reload={() => void reload()}>
        {(r) => {
          const st = statusLabel(r.status);
          const isDraft = r.statusId === RECEIPT_DRAFT;
          const canPay = allowed("SUPPLIER_PAYMENTS", "Create") && r.statusId === RECEIPT_COMPLETED && r.outstanding > 0;
          const canCancel = allowed("PURCHASE_RECEIPTS", "Delete", r.zone.id) && (r.statusId === RECEIPT_DRAFT || r.statusId === RECEIPT_COMPLETED);
          const hasPayments = r.payments.some((p) => p.status === "Recorded");
          return (
            <>
              <Facts
                items={[
                  ["Mã phiếu", r.code],
                  ["Trạng thái", <Badge key="st" text={st.text} tone={st.tone} />],
                  ["Ngày nhập", date(r.receiptDate)],
                  ["Nhà cung cấp", r.supplier.name],
                  ["Vùng nuôi", `${r.zone.code ?? ""} ${r.zone.name ?? ""}`.trim()],
                  ["Bè", r.raft?.code],
                  ["Ghi chú", r.notes],
                  ["Lý do hủy", r.cancelReason],
                  ["Hoàn tất lúc", r.completedAt ? dateTime(r.completedAt) : null],
                  ["Hủy lúc", r.cancelledAt ? dateTime(r.cancelledAt) : null],
                ]}
              />

              <Section title="Dòng hàng">
                <Rows>
                  {r.lines.map((l) => (
                    <Row
                      key={l.id}
                      title={l.itemName}
                      meta={`${INPUT_GROUP[l.group] ?? l.group} · ${num(l.quantity, l.unit ?? undefined)} × ${money(l.unitPrice)}${
                        l.returnedQuantity > 0 ? ` · Đã trả ${num(l.returnedQuantity)}` : ""
                      }${l.seedLotCode ? ` · Lô giống ${l.seedLotCode}` : ""}`}
                      value={money(l.lineAmount)}
                    />
                  ))}
                </Rows>
              </Section>

              <Section title="Tiền">
                <Facts
                  items={[
                    ["Tiền hàng", money(r.subtotal)],
                    ["Chiết khấu", r.discountAmount > 0 ? money(r.discountAmount) : null],
                    ["Phải trả", money(r.payable)],
                    ["Trả hàng", r.returned > 0 ? money(r.returned) : null],
                    ["Đã trả", money(r.paid)],
                    ["Đã hoàn lại", r.refunded > 0 ? money(r.refunded) : null],
                    ["Còn nợ", <span key="o" className={r.outstanding > 0 ? "text-danger" : undefined}>{money(r.outstanding)}</span>],
                  ]}
                />
              </Section>

              {r.payments.length > 0 && (
                <Section title="Các lần trả tiền">
                  <Rows>
                    {r.payments.map((p) => {
                      const ps = statusLabel(p.status);
                      return (
                        <Row
                          key={p.id}
                          title={money(p.amount)}
                          meta={`${date(p.paymentDate)} · ${PAYMENT_METHOD[p.method] ?? p.method}${p.referenceCode ? ` · ${p.referenceCode}` : ""}`}
                          badge={p.status !== "Recorded" ? <Badge text={ps.text} tone={ps.tone} /> : undefined}
                        />
                      );
                    })}
                  </Rows>
                </Section>
              )}

              {r.returns.length > 0 && (
                <Section title="Trả hàng">
                  <Rows>
                    {r.returns.map((x) => (
                      <Row key={x.id} title={x.code} meta={`${date(x.returnDate)}${x.reason ? ` · ${x.reason}` : ""}`} value={money(x.returnValue)} />
                    ))}
                  </Rows>
                </Section>
              )}

              {isDraft && (
                <Actions>
                  <Button variant="secondary" size="large" onClick={() => navigate(`/manage/purchases/${r.id}/edit`)}>
                    Sửa
                  </Button>
                  <Button size="large" onClick={() => setCompleting(true)}>
                    Hoàn tất
                  </Button>
                </Actions>
              )}
              {canPay && (
                <Actions>
                  <Button size="large" onClick={() => setPaying(true)}>
                    Ghi trả tiền
                  </Button>
                </Actions>
              )}
              {canCancel && (
                <Actions>
                  <Button variant="tertiary" type="danger" size="large" onClick={() => setCancelling(true)}>
                    Hủy phiếu
                  </Button>
                </Actions>
              )}

              <Modal
                visible={completing}
                title="Hoàn tất phiếu nhập?"
                description="Phiếu hoàn tất sẽ được tính vào công nợ nhà cung cấp và không sửa được nữa."
                onClose={() => setCompleting(false)}
                actions={[
                  { text: "Để sau", close: true },
                  { text: "Hoàn tất", highLight: true, disabled: busy, onClick: () => void complete() },
                ]}
              />

              <ReasonSheet
                visible={cancelling}
                title="Hủy phiếu nhập"
                intro="Phiếu đã hủy không dùng lại được. Muốn nhập lại, lập phiếu mới."
                confirmText="Hủy phiếu"
                required
                maxLength={1000}
                busy={busy}
                onClose={() => setCancelling(false)}
                onConfirm={cancel}
              >
                {hasPayments && (
                  <Switch
                    label="Hủy luôn các lần trả tiền của phiếu"
                    checked={cancelPayments}
                    onChange={(e) => setCancelPayments(e.target.checked)}
                  />
                )}
                {hasPayments && !cancelPayments && <p className="form__hint">Tiền đã trả được giữ lại làm tiền trả trước cho nhà cung cấp, chưa gắn phiếu nào.</p>}
              </ReasonSheet>

              <PaymentSheet visible={paying} receipt={r} onClose={() => setPaying(false)} onPaid={() => void reload()} />
            </>
          );
        }}
      </Loadable>
    </ManagePage>
  );
}

/** Ghi một lần trả tiền cho phiếu đã hoàn tất. Số tiền là bội số 1.000 đồng, không quá số còn nợ. */
function PaymentSheet({ visible, receipt, onClose, onPaid }: { visible: boolean; receipt: ReceiptView; onClose: () => void; onPaid: () => void }) {
  const [amount, setAmount] = useState("");
  const [paymentDate, setPaymentDate] = useState(todayIso());
  const [method, setMethod] = useState<PaymentMethod>("BankTransfer");
  const [reference, setReference] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  // Một khóa cho một lần mở sheet: bấm lưu lại sau lỗi mạng không ghi trùng.
  const [dedupKey, setDedupKey] = useState(newDeduplicationKey);

  const save = async () => {
    const value = parseNumber(amount);
    if (value === null || value <= 0) {
      setError(MESSAGES.MSG01("Số tiền"));
      return;
    }
    if (!paymentDate) {
      setError(MESSAGES.MSG01("Ngày trả"));
      return;
    }
    setError("");
    setBusy(true);
    try {
      await recordSupplierPayment({
        supplierId: receipt.supplier.id,
        receiptId: receipt.id,
        amount: value,
        paymentDate,
        method,
        referenceCode: reference.trim() || null,
        deduplicationKey: dedupKey,
      });
      setAmount("");
      setReference("");
      setDedupKey(newDeduplicationKey());
      onClose();
      onPaid();
    } catch (err) {
      setError(errorText(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Sheet visible={visible} onClose={onClose} autoHeight mask handler swipeToClose title="Ghi trả tiền nhà cung cấp">
      <div className="sheet-form form">
        <p className="form__intro">
          Phiếu {receipt.code} còn nợ {money(receipt.outstanding)}.
        </p>
        <NumberInput label="Số tiền (đồng)" value={amount} onChange={setAmount} disabled={busy} helperText="Bội số của 1.000 đồng." />
        <Button variant="tertiary" size="small" onClick={() => setAmount(String(receipt.outstanding))} disabled={busy}>
          Trả hết {money(receipt.outstanding)}
        </Button>
        <DateField label="Ngày trả" value={paymentDate} onChange={setPaymentDate} disabled={busy} />
        <Select label="Hình thức" value={method} onChange={(v) => setMethod(v as PaymentMethod)} closeOnSelect disabled={busy}>
          {(Object.keys(PAYMENT_METHOD) as PaymentMethod[]).map((k) => (
            <Select.Option key={k} value={k} title={PAYMENT_METHOD[k]} />
          ))}
        </Select>
        <Input label="Mã giao dịch (không bắt buộc)" value={reference} onChange={(e) => setReference(e.target.value)} maxLength={100} disabled={busy} />
        <FormError text={error} />
        <Button fullWidth size="large" loading={busy} disabled={busy} onClick={() => void save()}>
          Lưu
        </Button>
      </div>
    </Sheet>
  );
}

export default PurchaseDetailPage;
