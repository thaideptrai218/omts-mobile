import type { SupplierDebtList } from "@/features/purchasing/models/SupplierDebt";
import { useCallback, useState } from "react";
import { Button, useNavigate } from "zmp-ui";

import { Badge } from "@/components/Badge/Badge";
import { ManagePage } from "@/components/ManagePage/ManagePage";
import PagedList from "@/components/PagedList/PagedList";
import { Row } from "@/components/Row/Row";
import { SearchBox } from "@/components/SearchBox/SearchBox";
import { usePaged } from "@/hooks/usePaged";
import { date, money } from "@/utils/format";
import { MetaLines } from "@/features/purchasing/components/MetaLines/MetaLines";
import { listSupplierDebts, STATUS_DISCONTINUED } from "@/features/purchasing/services/purchasingService";
import { supplierDebtLabel } from "@/features/purchasing/utils/paymentText";
import "@/features/purchasing/styles/purchasing.scss";

/**
 * Công nợ nhà cung cấp (PURCHASE-04 bước 1), cho Chủ HTX và Kế toán: các nhà cung cấp có công nợ khác 0 hôm nay, theo
 * thứ tự của backend. Tổng HTX còn nợ và tổng đã trả trước tính trên mọi nhà cung cấp khớp ô tìm, không chỉ trang đang xem.
 */
function SupplierDebtsPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [totals, setTotals] = useState<SupplierDebtList | null>(null);
  const fetchPage = useCallback(
    async (page: number) => {
      const result = await listSupplierDebts({ search, page });
      setTotals(result);
      return result.page;
    },
    [search],
  );
  const list = usePaged(fetchPage);

  return (
    <ManagePage title="Công nợ nhà cung cấp">
      {totals && (
        <div className="summary summary--money">
          <div className={`summary__cell${totals.totalOwed > 0 ? " tone-danger" : ""}`}>
            <span className="summary__label">HTX còn nợ</span>
            <span className="summary__value">{money(totals.totalOwed)}</span>
          </div>
          {totals.totalAdvance > 0 && (
            <div className="summary__cell tone-warning">
              <span className="summary__label">HTX đã trả trước</span>
              <span className="summary__value">{money(totals.totalAdvance)}</span>
            </div>
          )}
        </div>
      )}
      <Button fullWidth variant="secondary" size="large" className="more" onClick={() => navigate("/manage/supplier-payments")}>
        Xem các lần trả tiền
      </Button>
      <div className="block">
        <SearchBox label="Tìm nhà cung cấp" placeholder="Tên, mã hoặc số điện thoại" onSearch={setSearch} />
        <PagedList
          list={list}
          unit="nhà cung cấp"
          emptyIcon="zi-check-circle"
          emptyTitle={search ? "Không tìm thấy nhà cung cấp nào" : "Không còn công nợ với nhà cung cấp nào"}
          emptyText={search ? "Thử tìm bằng tên hoặc số điện thoại khác." : undefined}
        >
          {(r) => {
            const label = supplierDebtLabel(r.debt);
            return (
              <Row
                key={r.supplier.id}
                title={r.supplier.name}
                meta={
                  <MetaLines
                    items={[
                      [label.text, <span key="d" className={r.debt > 0 ? "text-danger" : undefined}>{money(Math.abs(r.debt))}</span>],
                      ["Tuổi nợ", r.debtAgeDays !== null ? `${r.debtAgeDays} ngày` : null],
                      ["Phiếu chưa trả cũ nhất", r.oldestUnpaidDate ? date(r.oldestUnpaidDate) : null],
                      ["Số điện thoại", r.supplier.phoneNumber || null],
                    ]}
                  />
                }
                badge={r.supplier.statusId === STATUS_DISCONTINUED ? <Badge text="Ngừng dùng" tone="neutral" /> : undefined}
                onClick={() => navigate(`/manage/supplier-debts/${r.supplier.id}`)}
              />
            );
          }}
        </PagedList>
      </div>
    </ManagePage>
  );
}

export default SupplierDebtsPage;
