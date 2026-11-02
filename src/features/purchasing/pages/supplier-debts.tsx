import { useNavigate } from "zmp-ui";

import { Empty, Loadable, ManagePage, Row, Rows } from "@/shared/ui/ui";
import { useLoad } from "@/shared/hooks/use-load";
import { money } from "@/shared/lib/format";
import { listSupplierDebts } from "@/features/purchasing/api/purchasing";

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
                      meta={`Phải trả ${money(r.payable)} · Đã trả ${money(r.paid)}${r.returned > 0 ? ` · Trả hàng ${money(r.returned)}` : ""}${
                        r.unallocated > 0 ? ` · Trả trước chưa gắn phiếu ${money(r.unallocated)}` : ""
                      }`}
                      value={<span className={r.outstanding > 0 ? "text-danger" : undefined}>{money(r.outstanding)}</span>}
                      onClick={() => navigate(`/manage/suppliers/${r.supplierId}`)}
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
