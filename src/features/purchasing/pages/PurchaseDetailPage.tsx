import type { ReceiptView } from "@/features/purchasing/models/PurchaseReceipt";
import type { PaymentMethod } from "@/features/purchasing/models/SupplierPayment";
import { useState } from "react";
import { Button, Input, Select, Sheet, Switch, useNavigate, useParams } from "zmp-ui";

import FormError from "@/components/FormError/FormError";
import { Actions } from "@/components/Actions/Actions";
import { Badge } from "@/components/Badge/Badge";
import { ConfirmSheet } from "@/components/ConfirmSheet/ConfirmSheet";
import { Facts } from "@/components/Facts/Facts";
import { Loadable } from "@/components/Loadable/Loadable";
import { ManagePage } from "@/components/ManagePage/ManagePage";
import { NumberInput } from "@/components/NumberInput/NumberInput";
import { ReasonSheet } from "@/components/ReasonSheet/ReasonSheet";
import { Row } from "@/components/Row/Row";
import { Rows } from "@/components/Rows/Rows";
import { Section } from "@/components/Section/Section";
import { useAction } from "@/hooks/useAction";
import { useBusinessPermission } from "@/hooks/useBusinessPermission";
import { useLoad } from "@/hooks/useLoad";
import { errorText } from "@/utils/errorText";
import { MESSAGES } from "@/constants/messages";
import { date, dateTime, money, num, parseNumber, todayIso } from "@/utils/format";
import { INPUT_GROUP, PAYMENT_METHOD, statusLabel } from "@/utils/labels";
import { MetaLines } from "@/features/purchasing/components/MetaLines/MetaLines";
import { cancelReceipt, completeReceipt, getReceipt, newDeduplicationKey, RECEIPT_COMPLETED, RECEIPT_DRAFT, recordSupplierPayment } from "@/features/purchasing/services/purchasingService";

import DateField from "@/components/DateField/DateField";

/**
 * Chi tiết phiếu nhập: dòng hàng, tiền, các lần trả tiền và trả hàng. Phiếu nháp thì sửa hoặc hoàn tất; phiếu hoàn
 * tất còn nợ thì ghi trả tiền; phiếu chưa hủy thì hủy kèm lý do; phiếu đã hoàn tất còn hàng thì trả nhà cung cấp.
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

  // Nháp thì hoàn tất; đã hoàn tất còn nợ thì ghi trả tiền. Hai điều kiện loại trừ nhau nên chân trang chỉ có một nút chính.
  const isDraft = data?.statusId === RECEIPT_DRAFT;
  const canPay = data !== null && allowed("SUPPLIER_PAYMENTS", "Create") && data.statusId === RECEIPT_COMPLETED && data.outstanding > 0;
  const footer = isDraft ? (
    <Button fullWidth size="large" onClick={() => setCompleting(true)}>
      Hoàn tất
    </Button>
  ) : canPay ? (
    <Button fullWidth size="large" onClick={() => setPaying(true)}>
      Ghi trả tiền
    </Button>
  ) : undefined;

  return (
    <ManagePage title="Phiếu nhập" footer={footer}>
      <Loadable data={data} error={error} reload={() => void reload()}>
        {(r) => {
          const st = statusLabel(r.status);
          const canReturn = allowed("PURCHASE_RECEIPTS", "Create", r.zone.id) && r.statusId === RECEIPT_COMPLETED && r.lines.some((l) => l.returnable > 0);
          const canCancel = allowed("PURCHASE_RECEIPTS", "Delete", r.zone.id) && (r.statusId === RECEIPT_DRAFT || r.statusId === RECEIPT_COMPLETED);
          const hasPayments = r.payments.some((p) => p.status === "Recorded");
          return (
            <>
              <Section title="Tình trạng phiếu">
                <Facts
                  items={[
                    ["Mã phiếu", r.code],
                    ["Trạng thái", <Badge key="st" text={st.text} tone={st.tone} />],
                    ["Còn nợ", <span key="o" className={r.outstanding > 0 ? "text-danger" : undefined}>{money(r.outstanding)}</span>],
                    ["Lý do hủy", r.cancelReason],
                  ]}
                />
              </Section>

              {(isDraft || canReturn || canCancel) && (
                <Actions>
                  {isDraft && (
                    <Button variant="secondary" size="large" onClick={() => navigate(`/manage/purchases/${r.id}/edit`)}>
                      Sửa
                    </Button>
                  )}
                  {canReturn && (
                    <Button variant="secondary" size="large" onClick={() => navigate(`/manage/purchases/${r.id}/return`)}>
                      Trả hàng
                    </Button>
                  )}
                  {canCancel && (
                    <Button variant="tertiary" type="danger" size="large" onClick={() => setCancelling(true)}>
                      Hủy phiếu
                    </Button>
                  )}
                </Actions>
              )}

              <Section title="Thông tin phiếu">
                <Facts
                  items={[
                    ["Ngày nhập", date(r.receiptDate)],
                    ["Nhà cung cấp", r.supplier.name],
                    ["Vùng nuôi", `${r.zone.code ?? ""} ${r.zone.name ?? ""}`.trim()],
                    ["Bè", r.raft?.code],
                    ["Ghi chú", r.notes],
                    ["Hoàn tất lúc", r.completedAt ? dateTime(r.completedAt) : null],
                    ["Hủy lúc", r.cancelledAt ? dateTime(r.cancelledAt) : null],
                  ]}
                />
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
                  ]}
                />
              </Section>

              <Section title="Dòng hàng">
                <Rows>
                  {r.lines.map((l) => (
                    <Row
                      key={l.id}
                      title={l.itemName}
                      meta={
                        <MetaLines
                          items={[
                            ["Nhóm", INPUT_GROUP[l.group] ?? l.group],
                            ["Số lượng", num(l.quantity, l.unit ?? undefined)],
                            ["Đơn giá", money(l.unitPrice)],
                            ["Thành tiền", money(l.lineAmount)],
                            ["Đã trả lại", l.returnedQuantity > 0 ? num(l.returnedQuantity) : null],
                            ["Lô giống", l.seedLotCode],
                          ]}
                        />
                      }
                    />
                  ))}
                </Rows>
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
                          meta={
                            <MetaLines
                              items={[
                                ["Ngày trả", date(p.paymentDate)],
                                ["Hình thức", PAYMENT_METHOD[p.method] ?? p.method],
                                ["Mã giao dịch", p.referenceCode],
                              ]}
                            />
                          }
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
                      <Row
                        key={x.id}
                        title={x.code}
                        meta={
                          <MetaLines
                            items={[
                              ["Ngày trả", date(x.returnDate)],
                              ["Lý do", x.reason],
                              ["Giá trị", money(x.returnValue)],
                            ]}
                          />
                        }
                      />
                    ))}
                  </Rows>
                </Section>
              )}

              <ConfirmSheet
                visible={completing}
                title="Hoàn tất phiếu nhập?"
                message={
                  <div className="form">
                    <Facts
                      items={[
                        ["Nhà cung cấp", r.supplier.name],
                        ["Tổng phải trả", money(r.payable)],
                      ]}
                    />
                    <p>Phiếu hoàn tất sẽ được tính vào công nợ nhà cung cấp và không sửa được nữa.</p>
                  </div>
                }
                confirmText="Hoàn tất"
                busy={busy}
                onClose={() => setCompleting(false)}
                onConfirm={() => void complete()}
              />

              <ReasonSheet
                visible={cancelling}
                title="Hủy phiếu nhập"
                intro="Phiếu đã hủy không dùng lại được. Muốn nhập lại, lập phiếu mới."
                confirmText="Hủy phiếu"
                required
                danger
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
        <NumberInput label="Số tiền (bắt buộc)" value={amount} onChange={setAmount} disabled={busy} helperText="Bội số của 1.000 đồng." />
        <Button fullWidth variant="secondary" size="large" onClick={() => setAmount(String(receipt.outstanding))} disabled={busy}>
          Trả hết {money(receipt.outstanding)}
        </Button>
        <DateField label="Ngày trả (bắt buộc)" value={paymentDate} onChange={setPaymentDate} disabled={busy} />
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
