import type { CustomerDebtList } from "@/features/customers/models/CustomerDebt";
import { useCallback, useState } from "react";
import { Button, useNavigate } from "zmp-ui";

import { ManagePage } from "@/components/ManagePage/ManagePage";
import PagedList from "@/components/PagedList/PagedList";
import { Row } from "@/components/Row/Row";
import { SearchBox } from "@/components/SearchBox/SearchBox";
import { useBusinessPermission } from "@/hooks/useBusinessPermission";
import { usePaged } from "@/hooks/usePaged";
import { date, money } from "@/utils/format";
import { MetaLines } from "@/features/purchasing/components/MetaLines/MetaLines";
import { listCustomerDebts } from "@/features/customers/services/customerDebtService";
import { debtLabel } from "@/features/customers/utils/customerText";
import "@/features/customers/styles/customers.scss";

/**
 * Công nợ thương lái (DEBT-03 bước 1), cho Kế toán và Chủ HTX: hồ sơ còn nợ hoặc HTX còn nợ lại, nợ lâu nhất lên đầu rồi
 * nợ nhiều nhất (thứ tự của backend). Tổng phải thu và tổng nợ lại là của cả HTX, không đổi theo ô tìm (BR-DEBT-02).
 */
function CustomerDebtsPage() {
  const navigate = useNavigate();
  const allowed = useBusinessPermission();
  const [search, setSearch] = useState("");
  const [totals, setTotals] = useState<CustomerDebtList | null>(null);
  const fetchPage = useCallback(
    async (page: number) => {
      const result = await listCustomerDebts({ search, page });
      setTotals(result);
      return result.page;
    },
    [search],
  );
  const list = usePaged(fetchPage);

  return (
    <ManagePage title="Công nợ thương lái">
      {totals && (
        <div className="summary customer-summary">
          <div className="summary__cell tone-danger">
            <span className="summary__label">Thương lái còn nợ HTX</span>
            <span className="summary__value">{money(totals.receivablesTotal)}</span>
          </div>
          {totals.owedBackTotal > 0 && (
            <div className="summary__cell tone-warning">
              <span className="summary__label">HTX còn nợ lại thương lái</span>
              <span className="summary__value">{money(totals.owedBackTotal)}</span>
            </div>
          )}
          {totals.awaitingConfirmationCount > 0 && (
            <div className="summary__cell tone-warning">
              <span className="summary__label">Phiếu thu chờ xác nhận</span>
              <span className="summary__value">{totals.awaitingConfirmationCount}</span>
            </div>
          )}
        </div>
      )}
      {totals && totals.awaitingConfirmationCount > 0 && allowed("CUSTOMER_PAYMENTS", "View") && (
        <Button fullWidth variant="secondary" size="large" className="more" onClick={() => navigate("/manage/customer-payments/awaiting")}>
          Xem phiếu thu chờ xác nhận
        </Button>
      )}
      <div className="block">
        <SearchBox label="Tìm thương lái" placeholder="Tên hoặc số điện thoại" onSearch={setSearch} />
        <PagedList
          list={list}
          unit="thương lái"
          emptyIcon="zi-check-circle"
          emptyTitle={search ? "Không tìm thấy thương lái nào" : "Chưa có thương lái nào còn nợ"}
          emptyText={search ? "Thử tìm bằng tên hoặc số điện thoại khác." : undefined}
        >
          {(r) => {
            const label = debtLabel(r.debt);
            return (
              <Row
                key={r.customer.id}
                title={r.customer.name}
                meta={
                  <MetaLines
                    items={[
                      [label.text, <span key="d" className={r.debt > 0 ? "text-danger" : undefined}>{money(Math.abs(r.debt))}</span>],
                      ["Tuổi nợ", r.debtAgeDays !== null ? `${r.debtAgeDays} ngày` : null],
                      ["Hóa đơn chưa trả cũ nhất", r.oldestUnpaidDate ? date(r.oldestUnpaidDate) : null],
                      ["Mã, số điện thoại", [r.customer.code, r.customer.phoneNumber].filter(Boolean).join(" · ")],
                    ]}
                  />
                }
                onClick={() => navigate(`/manage/customer-debts/${r.customer.id}`)}
              />
            );
          }}
        </PagedList>
      </div>
    </ManagePage>
  );
}

export default CustomerDebtsPage;
