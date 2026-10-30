import { useEffect, useState } from "react";
import { Button, useNavigate } from "zmp-ui";

import { Badge, Empty, Loadable, ManagePage, Row, Rows } from "@/shared/ui/ui";
import { useAction } from "@/shared/hooks/use-action";
import { useLoad } from "@/shared/hooks/use-load";
import { date, money } from "@/shared/lib/format";
import { PAYMENT_METHOD, statusLabel } from "@/shared/lib/labels";
import { listSupplierPayments, type SupplierPayment } from "@/features/purchasing/api/purchasing";

const PAGE_SIZE = 20;

/** Các lần HTX trả tiền cho nhà cung cấp, mới nhất lên đầu. Bấm một dòng có phiếu để mở phiếu nhập đó. */
function SupplierPaymentsPage() {
  const navigate = useNavigate();
  const { data, error, reload } = useLoad(() => listSupplierPayments({ pageSize: PAGE_SIZE }), []);
  const [extra, setExtra] = useState<SupplierPayment[]>([]);
  const [page, setPage] = useState(1);
  const { busy, run } = useAction();

  useEffect(() => {
    setExtra([]);
    setPage(1);
  }, [data]);

  const loadMore = async () => {
    const next = await run(() => listSupplierPayments({ page: page + 1, pageSize: PAGE_SIZE }));
    if (!next) return;
    setExtra((rows) => [...rows, ...next.page.items]);
    setPage(page + 1);
  };

  return (
    <ManagePage title="Trả tiền nhà cung cấp">
      <Loadable data={data} error={error} reload={() => void reload()}>
        {(result) => {
          const rows = [...result.page.items, ...extra];
          return (
            <>
              <div className="summary">
                <div className="summary__cell">
                  <span className="summary__label">Tổng đã trả</span>
                  <span className="summary__value">{money(result.totalAmount)}</span>
                </div>
                <div className="summary__cell">
                  <span className="summary__label">Số lần trả</span>
                  <span className="summary__value">{result.page.total}</span>
                </div>
              </div>
              {rows.length === 0 ? (
                <Empty icon="zi-check-circle" title="Chưa có lần trả tiền nào" />
              ) : (
                <Rows>
                  {rows.map((p) => {
                    const st = statusLabel(p.status);
                    return (
                      <Row
                        key={p.id}
                        title={p.supplier.name}
                        meta={`${date(p.paymentDate)} · ${PAYMENT_METHOD[p.method] ?? p.method}${p.receiptCode ? ` · ${p.receiptCode}` : " · Chưa gắn phiếu"}`}
                        badge={p.status !== "Recorded" ? <Badge text={st.text} tone={st.tone} /> : undefined}
                        value={money(p.amount)}
                        onClick={p.receiptId ? () => navigate(`/manage/purchases/${p.receiptId}`) : undefined}
                      />
                    );
                  })}
                </Rows>
              )}
              {rows.length < result.page.total && (
                <Button fullWidth variant="secondary" size="large" className="more" loading={busy} disabled={busy} onClick={() => void loadMore()}>
                  Tải thêm
                </Button>
              )}
            </>
          );
        }}
      </Loadable>
    </ManagePage>
  );
}

export default SupplierPaymentsPage;
