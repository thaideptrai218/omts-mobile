import type { CustomerPayment } from "@/features/finance/models/CustomerPayment";
import { useCallback, useState } from "react";
import { Button, useNavigate } from "zmp-ui";

import { Actions } from "@/components/Actions/Actions";
import { Badge } from "@/components/Badge/Badge";
import { ConfirmSheet } from "@/components/ConfirmSheet/ConfirmSheet";
import { ManagePage } from "@/components/ManagePage/ManagePage";
import PagedList from "@/components/PagedList/PagedList";
import { Row } from "@/components/Row/Row";
import { confirmCustomerPayments, listAwaitingPayments } from "@/features/finance/services/customerPaymentService";
import { METHOD_TEXT, needsSettlement } from "@/features/finance/utils/financeText";
import { useAction } from "@/hooks/useAction";
import { useBusinessPermission } from "@/hooks/useBusinessPermission";
import { usePaged } from "@/hooks/usePaged";
import { date, money } from "@/utils/format";
import "@/features/finance/styles/finance.scss";

const PAGE_SIZE = 50;
/** Máy chủ nhận tối đa 200 khoản trong một lần xác nhận (CustomerPaymentRules.MaxBatchSize). */
const MAX_BATCH = 200;

/**
 * Các khoản tiền chờ kế toán xác nhận (DEBT-02.2, `/manage/customer-payments/awaiting`): tiền mặt nhận tại cảng và tiền
 * chuyển khoản hệ thống đã ghi, cũ nhất trước. Chọn các khoản đã thấy tiền về rồi xác nhận một lần; xác nhận không làm đổi
 * công nợ (BR-DEBT-02). Khoản sai thì mở ra để hủy kèm lý do (DEBT-02.4).
 */
export default function AwaitingPaymentsPage() {
  const navigate = useNavigate();
  const can = useBusinessPermission();
  const canConfirm = can("CUSTOMER_PAYMENTS", "Edit");
  const [totalAmount, setTotalAmount] = useState<number | null>(null);
  const fetchPage = useCallback(async (page: number) => {
    const result = await listAwaitingPayments(page, PAGE_SIZE);
    setTotalAmount(result.totalAmount);
    return result.page;
  }, []);
  const list = usePaged(fetchPage);
  const [selecting, setSelecting] = useState(false);
  const [picked, setPicked] = useState<string[]>([]);
  const [asking, setAsking] = useState(false);
  const { busy, run } = useAction();

  // Chỉ tính các khoản còn trong danh sách: sau khi tải lại, khoản người khác đã xử lý tự rơi khỏi lựa chọn.
  const chosen = (list.items ?? []).filter((p) => picked.includes(p.id));
  const chosenSum = chosen.reduce((sum, p) => sum + p.amount, 0);

  const toggle = (p: CustomerPayment) =>
    setPicked((ids) => (ids.includes(p.id) ? ids.filter((x) => x !== p.id) : ids.length >= MAX_BATCH ? ids : [...ids, p.id]));

  const stopSelecting = () => {
    setSelecting(false);
    setPicked([]);
  };

  const confirm = async () => {
    const done = await run(() => confirmCustomerPayments({ confirm: chosen.map((p) => p.id) }), `Đã xác nhận ${chosen.length} khoản tiền.`);
    setAsking(false);
    if (done) stopSelecting();
    // Thành công hay bị từ chối (MSG-GEN-09: có khoản vừa được người khác xử lý) đều tải lại để thấy danh sách mới.
    list.reload();
  };

  const hasRows = (list.items?.length ?? 0) > 0;
  const footer = !canConfirm || !hasRows ? undefined : selecting ? (
    <Actions>
      <Button fullWidth size="large" disabled={busy || chosen.length === 0} onClick={() => setAsking(true)}>
        {chosen.length === 0 ? "Chọn khoản để xác nhận" : `Xác nhận ${chosen.length} khoản (${money(chosenSum)})`}
      </Button>
      <Button fullWidth size="large" variant="secondary" disabled={busy} onClick={stopSelecting}>
        Thôi chọn
      </Button>
    </Actions>
  ) : (
    <Button fullWidth size="large" onClick={() => setSelecting(true)}>
      Chọn khoản đã nhận tiền
    </Button>
  );

  return (
    <ManagePage title="Tiền chờ xác nhận" footer={footer}>
      <p className="form__intro">
        {selecting
          ? "Bấm vào từng khoản HTX đã thấy tiền về để chọn, bấm lại để bỏ chọn."
          : "Tiền mặt nhận tại cảng và tiền chuyển khoản hệ thống đã ghi, đang chờ kế toán xác nhận. Bấm một khoản để xem chi tiết hoặc hủy."}
      </p>
      {totalAmount !== null && hasRows && (
        <div className="summary">
          <div className="summary__cell tone-warning">
            <span className="summary__label">Tổng chờ xác nhận</span>
            <span className="summary__value">{money(totalAmount)}</span>
          </div>
          <div className="summary__cell">
            <span className="summary__label">Số khoản</span>
            <span className="summary__value">{list.total}</span>
          </div>
        </div>
      )}
      <PagedList list={list} unit="khoản chờ xác nhận" emptyIcon="zi-check-circle" emptyTitle="Không có khoản nào chờ xác nhận">
        {(p) => {
          const unsettled = needsSettlement(p);
          const isPicked = picked.includes(p.id);
          return (
            <Row
              key={p.id}
              title={p.customer?.name ?? "Chưa rõ thương lái"}
              meta={[p.code, date(p.paymentDate), METHOD_TEXT[p.method] ?? p.method, p.invoice ? `hóa đơn ${p.invoice.code}` : null, p.collectedBy ? `người nhận ${p.collectedBy.name}` : null]
                .filter(Boolean)
                .join(" · ")}
              value={money(p.amount)}
              badge={
                unsettled ? <Badge text="Chưa rõ thương lái" tone="warning" />
                : selecting && isPicked ? <Badge text="Đã chọn" tone="success" />
                : undefined
              }
              onClick={selecting ? (unsettled ? undefined : () => toggle(p)) : () => navigate(`/manage/customer-payments/${p.id}`)}
            />
          );
        }}
      </PagedList>

      <ConfirmSheet
        visible={asking}
        title="Xác nhận đã nhận tiền?"
        message={`Xác nhận HTX đã nhận đủ tiền của ${chosen.length} khoản, tổng ${money(chosenSum)}. Công nợ không đổi vì các khoản này đã được tính khi ghi. Chủ HTX sẽ nhận một thông báo.`}
        confirmText="Xác nhận đã nhận tiền"
        busy={busy}
        onClose={() => setAsking(false)}
        onConfirm={() => void confirm()}
      />
    </ManagePage>
  );
}
