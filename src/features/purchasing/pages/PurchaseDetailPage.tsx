import type { CancelPreview } from "@/features/purchasing/models/PurchaseReceipt";
import { useState } from "react";
import { Button, useNavigate, useParams } from "zmp-ui";

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
import { useAction } from "@/hooks/useAction";
import { useBusinessPermission } from "@/hooks/useBusinessPermission";
import { useLoad } from "@/hooks/useLoad";
import { date, dateTime, money, num } from "@/utils/format";
import { INPUT_GROUP, PAYMENT_METHOD, statusLabel } from "@/utils/labels";
import { MetaLines } from "@/features/purchasing/components/MetaLines/MetaLines";
import { SupplierPaymentSheet } from "@/features/purchasing/components/SupplierPaymentSheet/SupplierPaymentSheet";
import {
  cancelReceipt,
  completeReceipt,
  getReceipt,
  getReceiptPayments,
  previewCancelReceipt,
  RECEIPT_COMPLETED,
  RECEIPT_DRAFT,
  removeDraftReceipt,
} from "@/features/purchasing/services/purchasingService";
import { receiptRemaining } from "@/features/purchasing/utils/receiptMoney";

const RETURN_CANCELLED = 1902;

/**
 * Chi tiết phiếu nhập: dòng hàng (bè, giảm giá, lô giống từng dòng), tiền, các lần trả tiền sổ công nợ tính vào phiếu và các
 * lần trả hàng. Phiếu nháp thì sửa, hoàn tất hoặc xóa; phiếu hoàn tất còn nợ thì ghi trả tiền, còn hàng thì trả nhà cung cấp,
 * và hủy kèm lý do sau khi xem công nợ thay đổi thế nào (PURCHASE-06).
 */
function PurchaseDetailPage() {
  const allowed = useBusinessPermission();
  const { id = "" } = useParams();
  const navigate = useNavigate();
  const { data, error, reload, setData } = useLoad(async () => {
    const [receipt, payments] = await Promise.all([getReceipt(id), getReceiptPayments(id)]);
    return { receipt, payments };
  }, [id]);
  const { busy, run } = useAction();
  const [completing, setCompleting] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [cancelPreview, setCancelPreview] = useState<CancelPreview | null>(null);
  const [paying, setPaying] = useState(false);

  const receipt = data?.receipt ?? null;
  const isDraft = receipt?.statusId === RECEIPT_DRAFT;
  const isCompleted = receipt?.statusId === RECEIPT_COMPLETED;
  const remaining = receipt && isCompleted ? receiptRemaining(receipt) : 0;

  const complete = async () => {
    if (!receipt || !data) return;
    const saved = await run(() => completeReceipt(id, receipt.rowVersion), "Đã hoàn tất phiếu nhập.");
    if (saved) setData({ ...data, receipt: saved });
    setCompleting(false);
  };

  const remove = async () => {
    const done = await run(async () => {
      await removeDraftReceipt(id);
      return true;
    }, "Đã xóa phiếu nháp.");
    setRemoving(false);
    if (done) navigate("/manage/purchases", { replace: true });
  };

  const startCancel = async () => {
    const preview = await run(() => previewCancelReceipt(id));
    if (preview) setCancelPreview(preview);
  };

  const cancel = async (reason: string) => {
    if (!receipt || !data) return false;
    const saved = await run(() => cancelReceipt(id, { reason, rowVersion: receipt.rowVersion }), "Đã hủy phiếu nhập.");
    if (!saved) return false;
    setCancelPreview(null);
    void reload();
    return true;
  };

  // Nháp thì hoàn tất; đã hoàn tất còn nợ thì ghi trả tiền. Hai điều kiện loại trừ nhau nên chân trang chỉ có một nút chính.
  const canPay = isCompleted && remaining > 0 && allowed("SUPPLIER_PAYMENTS", "Create");
  const footer = isDraft && allowed("PURCHASE_RECEIPTS", "Edit") ? (
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
        {({ receipt: r, payments }) => {
          const st = statusLabel(r.status);
          const zoneId = r.zone?.id;
          const canEdit = isDraft && allowed("PURCHASE_RECEIPTS", "Edit", zoneId);
          const canReturn = isCompleted && allowed("PURCHASE_RECEIPTS", "Create", zoneId) && r.lines.some((l) => l.returnable > 0);
          const canRemove = isDraft && allowed("PURCHASE_RECEIPTS", "Delete", zoneId);
          const canCancel = isCompleted && allowed("PURCHASE_RECEIPTS", "Delete", zoneId);
          return (
            <>
              <Section title="Tình trạng phiếu">
                <Facts
                  items={[
                    ["Mã phiếu", r.code],
                    ["Trạng thái", <Badge key="st" text={st.text} tone={st.tone} />],
                    ["Còn phải trả", isCompleted ? <span key="o" className={remaining > 0 ? "text-danger" : undefined}>{money(remaining)}</span> : null],
                    ["Lý do hủy", r.cancelReason],
                  ]}
                />
              </Section>

              {(canEdit || canReturn || canRemove || canCancel) && (
                <Actions>
                  {canEdit && (
                    <Button variant="secondary" size="large" onClick={() => navigate(`/manage/purchases/${r.id}/edit`)}>
                      Sửa
                    </Button>
                  )}
                  {canReturn && (
                    <Button variant="secondary" size="large" onClick={() => navigate(`/manage/purchases/${r.id}/return`)}>
                      Trả hàng
                    </Button>
                  )}
                  {canRemove && (
                    <Button variant="tertiary" type="danger" size="large" onClick={() => setRemoving(true)}>
                      Xóa phiếu nháp
                    </Button>
                  )}
                  {canCancel && (
                    <Button variant="tertiary" type="danger" size="large" loading={busy} disabled={busy} onClick={() => void startCancel()}>
                      Hủy phiếu
                    </Button>
                  )}
                </Actions>
              )}

              <Section title="Thông tin phiếu">
                <Facts
                  items={[
                    ["Ngày nhập", date(r.receiptDate)],
                    ["Nhận hàng lúc", r.receivedAt ? dateTime(r.receivedAt) : null],
                    ["Người nhận hàng", r.receivedBy?.name],
                    ["Nhà cung cấp", r.supplier.name],
                    ["Vùng nuôi", r.zone ? `${r.zone.code ?? ""} ${r.zone.name ?? ""}`.trim() : null],
                    ["Ghi chú", r.notes],
                    ["Người lập", r.recordedBy.name],
                    ["Hoàn tất lúc", r.completedAt ? dateTime(r.completedAt) : null],
                    ["Hủy lúc", r.cancelledAt ? dateTime(r.cancelledAt) : null],
                  ]}
                />
              </Section>

              <Section title="Tiền">
                <Facts
                  items={[
                    ["Tiền hàng", money(r.total)],
                    ["Giảm giá cả phiếu", r.discount > 0 ? money(r.discount) : null],
                    ["Phải trả", money(r.payable)],
                    ["Trả hàng", r.returned > 0 ? money(r.returned) : null],
                    ["Đã trả", isCompleted ? money(r.paid) : null],
                    ["Còn phải trả", isCompleted ? money(remaining) : null],
                  ]}
                />
              </Section>

              <Section title="Dòng hàng">
                <Rows>
                  {r.lines.map((l) => (
                    <Row
                      key={l.id}
                      title={l.itemName ?? `Dòng ${l.lineNumber}`}
                      meta={
                        <MetaLines
                          items={[
                            ["Nhóm", l.group ? (INPUT_GROUP[l.group] ?? l.group) : null],
                            ["Số lượng", l.quantity !== null ? num(l.quantity, l.unit) : null],
                            ["Đơn giá", l.unitPrice !== null ? money(l.unitPrice) : null],
                            ["Giảm mỗi đơn vị", l.discount > 0 ? money(l.discount) : null],
                            ["Thành tiền", l.lineAmount !== null ? money(l.lineAmount) : null],
                            ["Bè", l.raft ? `${l.raft.code} · vùng ${l.raft.zoneCode}` : null],
                            ["Lô giống", l.seedLotCode],
                            ["Mã lô của nhà cung cấp", l.supplierLotCode],
                            ["Đã thả", l.seeded > 0 ? num(l.seeded, l.baseUnit ?? l.unit) : null],
                            ["Đã trả lại", l.returnedQuantity > 0 ? num(l.returnedQuantity, l.baseUnit ?? l.unit) : null],
                          ]}
                        />
                      }
                    />
                  ))}
                </Rows>
              </Section>

              {payments.length > 0 && (
                <Section title="Các lần trả tiền tính vào phiếu">
                  <Rows>
                    {payments.map((p) => {
                      const ps = statusLabel(p.status);
                      return (
                        <Row
                          key={p.id}
                          title={money(p.applied)}
                          meta={
                            <MetaLines
                              items={[
                                ["Phiếu chi", p.code],
                                ["Ngày trả", date(p.paymentDate)],
                                ["Hình thức", PAYMENT_METHOD[p.method] ?? p.method],
                                ["Người ghi", p.recordedBy.name],
                              ]}
                            />
                          }
                          badge={p.status !== "Recorded" ? <Badge text={ps.text} tone={ps.tone} /> : undefined}
                          onClick={() => navigate(`/manage/supplier-debts/${r.supplier.id}`)}
                        />
                      );
                    })}
                  </Rows>
                </Section>
              )}

              {r.returns.length > 0 && (
                <Section title="Trả hàng">
                  <Rows>
                    {r.returns.map((x) => {
                      const xs = statusLabel(x.status);
                      return (
                        <Row
                          key={x.id}
                          title={x.code}
                          meta={
                            <MetaLines
                              items={[
                                ["Ngày trả", date(x.returnDate)],
                                ["Lý do", x.reason],
                                ["Giá trị", money(x.netValue || x.returnValue)],
                                ["Lý do hủy", x.cancelReason],
                              ]}
                            />
                          }
                          badge={x.statusId === RETURN_CANCELLED ? <Badge text={xs.text} tone={xs.tone} /> : undefined}
                        />
                      );
                    })}
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
                    <p>Phiếu hoàn tất được tính vào công nợ nhà cung cấp và tồn kho.</p>
                  </div>
                }
                confirmText="Hoàn tất"
                busy={busy}
                onClose={() => setCompleting(false)}
                onConfirm={() => void complete()}
              />

              <ConfirmSheet
                visible={removing}
                title="Xóa phiếu nháp?"
                message={`Phiếu nháp ${r.code} và các dòng hàng của nó sẽ bị xóa.`}
                confirmText="Xóa phiếu nháp"
                danger
                busy={busy}
                onClose={() => setRemoving(false)}
                onConfirm={() => void remove()}
              />

              <CancelSheets preview={cancelPreview} busy={busy} onClose={() => setCancelPreview(null)} onCancel={cancel} />

              {canPay && (
                <SupplierPaymentSheet
                  visible={paying}
                  supplier={r.supplier}
                  receipt={{ id: r.id, code: r.code, remaining }}
                  suggested={{ label: "Trả hết", amount: remaining }}
                  onClose={() => setPaying(false)}
                  onPaid={() => void reload()}
                />
              )}
            </>
          );
        }}
      </Loadable>
    </ManagePage>
  );
}

/** Không hủy được (lô giống đã thả, đã có trả hàng): báo lý do. Hủy được: hỏi lý do, kèm công nợ sau khi hủy. */
function CancelSheets({
  preview,
  busy,
  onClose,
  onCancel,
}: {
  preview: CancelPreview | null;
  busy: boolean;
  onClose: () => void;
  onCancel: (reason: string) => Promise<boolean>;
}) {
  if (preview && !preview.canCancel) {
    const block = preview.blocked;
    const why = block?.kind === "Seeded" ? `lô giống ${block.code} đã được thả` : block?.kind === "Returned" ? `đã có phiếu trả hàng ${block.code}` : "phiếu đang ở trạng thái khác";
    return (
      <ConfirmSheet
        visible
        title="Không hủy được phiếu"
        message={`Phiếu này không hủy được vì ${why}. Nếu có sai sót, Chủ HTX sửa phiếu trên bản web.`}
        confirmText="Đã hiểu"
        cancelText="Đóng"
        onClose={onClose}
        onConfirm={onClose}
      />
    );
  }
  const advance = preview && preview.debtAfter < 0;
  return (
    <ReasonSheet
      visible={preview !== null}
      title="Hủy phiếu nhập"
      intro={
        preview
          ? `Công nợ với nhà cung cấp: ${money(preview.debtBefore)} trước khi hủy, ${advance ? `HTX thành trả trước ${money(preview.advanceAfter)}` : money(preview.debtAfter)} sau khi hủy. Các lần trả tiền giữ nguyên. Phiếu đã hủy không dùng lại được.`
          : undefined
      }
      confirmText="Hủy phiếu"
      required
      danger
      maxLength={1000}
      busy={busy}
      onClose={onClose}
      onConfirm={onCancel}
    />
  );
}

export default PurchaseDetailPage;
