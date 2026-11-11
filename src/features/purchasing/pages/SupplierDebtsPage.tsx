import { useNavigate } from "zmp-ui";

import { Empty } from "@/components/Empty/Empty";
import { Loadable } from "@/components/Loadable/Loadable";
import { ManagePage } from "@/components/ManagePage/ManagePage";
import { Row } from "@/components/Row/Row";
import { Rows } from "@/components/Rows/Rows";
import { useLoad } from "@/hooks/useLoad";
import { money } from "@/utils/format";
import { MetaLines } from "@/features/purchasing/components/MetaLines/MetaLines";
import { listSupplierDebts } from "@/features/purchasing/services/purchasingService";

/** Công nợ HTX còn phải trả từng nhà cung cấp, nhiều nhất lên đầu. */
function SupplierDebtsPage() {
  const navigate = useNavigate();
  const { data, error, reload } = useLoad(listSupplierDebts, []);

  return (
    <ManagePage title="Công nợ nhà cung cấp">
      <Loadable data={data} error={error} reload={() => void reload()}>
        {(rows) => {
          const sorted = [...rows].sort((a, b) => b.outstanding - a.outstanding);
          const sum = (pick: (r: (typeof rows)[number]) => number) => rows.reduce((t, r) => t + pick(r), 0);
          return (
            <>
              <div className="summary">
                <div className="summary__cell tone-danger">
                  <span className="summary__label">Còn phải trả</span>
                  <span className="summary__value">{money(sum((r) => r.outstanding))}</span>
                </div>
                <div className="summary__cell">
                  <span className="summary__label">Đã trả</span>
                  <span className="summary__value">{money(sum((r) => r.paid))}</span>
                </div>
              </div>
              {sorted.length === 0 ? (
                <Empty icon="zi-check-circle" title="Không có công nợ" />
              ) : (
                <Rows>
                  {sorted.map((r) => (
                    <Row
                      key={r.supplierId}
                      title={r.supplierName}
                      meta={
                        <MetaLines
                          items={[
                            ["Còn phải trả", <span key="o" className={r.outstanding > 0 ? "text-danger" : undefined}>{money(r.outstanding)}</span>],
                            ["Phải trả", money(r.payable)],
                            ["Đã trả", money(r.paid)],
                            ["Trả hàng", r.returned > 0 ? money(r.returned) : null],
                            ["Trả trước chưa gắn phiếu", r.unallocated > 0 ? money(r.unallocated) : null],
                          ]}
                        />
                      }
                      onClick={() => navigate(`/manage/supplier-debts/${r.supplierId}`)}
                    />
                  ))}
                </Rows>
              )}
            </>
          );
        }}
      </Loadable>
    </ManagePage>
  );
}

export default SupplierDebtsPage;
