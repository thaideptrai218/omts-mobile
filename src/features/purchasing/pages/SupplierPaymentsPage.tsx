import type { SupplierPaymentSearch } from "@/features/purchasing/models/SupplierPayment";
import { useCallback, useState } from "react";
import { Button, useNavigate } from "zmp-ui";

import { Badge } from "@/components/Badge/Badge";
import { ManagePage } from "@/components/ManagePage/ManagePage";
import PagedList from "@/components/PagedList/PagedList";
import { Row } from "@/components/Row/Row";
import { usePaged } from "@/hooks/usePaged";
import { date, money } from "@/utils/format";
import { PAYMENT_METHOD, statusLabel } from "@/utils/labels";
import { MetaLines } from "@/features/purchasing/components/MetaLines/MetaLines";
import { listSupplierPayments } from "@/features/purchasing/services/purchasingService";
import { PAYMENT_KIND_TEXT } from "@/features/purchasing/utils/paymentText";
import "@/features/purchasing/styles/purchasing.scss";

const PAYMENT_RECORDED = 1801;

/**
 * Các lần HTX trả tiền nhà cung cấp và nhà cung cấp hoàn tiền (PURCHASE-05), mới nhất lên đầu. Một lần trả không còn gắn
 * với một phiếu nhập: sổ công nợ tính nó vào các phiếu, nên bấm một dòng mở công nợ của nhà cung cấp đó.
 */
function SupplierPaymentsPage() {
  const navigate = useNavigate();
  const [totals, setTotals] = useState<SupplierPaymentSearch | null>(null);
  const fetchPage = useCallback(async (page: number) => {
    const result = await listSupplierPayments({ page });
    setTotals(result);
    return result.page;
  }, []);
  const list = usePaged(fetchPage);

  return (
    <ManagePage title="Trả tiền nhà cung cấp">
      <Button fullWidth variant="secondary" size="large" onClick={() => navigate("/manage/supplier-debts")}>
        Xem công nợ từng nhà cung cấp
      </Button>
      {totals && (
        <div className="summary summary--money more">
          <div className="summary__cell">
            <span className="summary__label">HTX đã trả</span>
            <span className="summary__value">{money(totals.totalPaid)}</span>
          </div>
          {totals.totalPaidBack > 0 && (
            <div className="summary__cell">
              <span className="summary__label">Nhà cung cấp hoàn lại</span>
              <span className="summary__value">{money(totals.totalPaidBack)}</span>
            </div>
          )}
        </div>
      )}
      <div className="block">
        <PagedList list={list} unit="lần trả tiền" emptyIcon="zi-check-circle" emptyTitle="Chưa có lần trả tiền nào">
          {(p) => {
            const st = statusLabel(p.status);
            return (
              <Row
                key={p.id}
                title={p.supplier.name}
                meta={
                  <MetaLines
                    items={[
                      [PAYMENT_KIND_TEXT[p.kind] ?? p.kind, money(p.amount)],
                      ["Giảm nợ", p.discountAmount > 0 ? money(p.discountAmount) : null],
                      ["Mã phiếu", p.code],
                      ["Ngày trả", date(p.paymentDate)],
                      ["Hình thức", PAYMENT_METHOD[p.method] ?? p.method],
                      ["Mã giao dịch", p.bankReference],
                      ["Lý do hủy", p.statusId !== PAYMENT_RECORDED ? p.cancelReason : null],
                    ]}
                  />
                }
                badge={p.statusId !== PAYMENT_RECORDED ? <Badge text={st.text} tone={st.tone} /> : undefined}
                onClick={() => navigate(`/manage/supplier-debts/${p.supplier.id}`)}
              />
            );
          }}
        </PagedList>
      </div>
    </ManagePage>
  );
}

export default SupplierPaymentsPage;
