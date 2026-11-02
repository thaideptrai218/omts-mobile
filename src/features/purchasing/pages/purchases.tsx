import { useEffect, useState } from "react";
import { Button, useNavigate } from "zmp-ui";

import { Badge, Chips, Empty, Loadable, ManagePage, Row, Rows } from "@/shared/ui/ui";
import { useAction } from "@/shared/hooks/use-action";
import { useLoad } from "@/shared/hooks/use-load";
import { date, money } from "@/shared/lib/format";
import { statusLabel } from "@/shared/lib/labels";
import { RECEIPT_CANCELLED, RECEIPT_COMPLETED, RECEIPT_DRAFT, searchReceipts, type ReceiptRow } from "@/features/purchasing/api/purchasing";

type Filter = "all" | "draft" | "completed" | "cancelled";

const STATUS_OF: Record<Filter, number | null> = {
  all: null,
  draft: RECEIPT_DRAFT,
  completed: RECEIPT_COMPLETED,
  cancelled: RECEIPT_CANCELLED,
};

const PAGE_SIZE = 20;

/** Phiếu nhập giống, vật tư trong năm nay: tổng tiền, đã trả, còn nợ; lọc theo trạng thái, tải thêm từng trang. */
function PurchasesPage() {
  const navigate = useNavigate();
  const [filter, setFilter] = useState<Filter>("all");
  const { data, error, reload } = useLoad(() => searchReceipts({ statusId: STATUS_OF[filter], pageSize: PAGE_SIZE }), [filter]);
  const [extra, setExtra] = useState<ReceiptRow[]>([]);
  const [page, setPage] = useState(1);
  const { busy, run } = useAction();

  useEffect(() => {
    setExtra([]);
    setPage(1);
  }, [data]);

  const loadMore = async () => {
    const next = await run(() => searchReceipts({ statusId: STATUS_OF[filter], page: page + 1, pageSize: PAGE_SIZE }));
    if (!next) return;
    setExtra((rows) => [...rows, ...next.page.items]);
    setPage(page + 1);
  };

  return (
    <ManagePage
      title="Phiếu nhập"
      footer={
        <Button fullWidth size="large" onClick={() => navigate("/manage/purchases/new")}>
          Lập phiếu nhập
        </Button>
      }
    >
      <Chips
        options={[
          ["all", "Tất cả"],
          ["draft", "Nháp"],
          ["completed", "Hoàn tất"],
          ["cancelled", "Đã hủy"],
        ]}
        value={filter}
        onChange={setFilter}
      />
      <Loadable data={data} error={error} reload={() => void reload()}>
        {(result) => {
          const rows = [...result.page.items, ...extra];
          return (
            <>
              <p className="form__hint">
                Từ {date(result.from)} đến {date(result.to)} · {result.totals.count} phiếu
              </p>
              <div className="summary">
                <div className="summary__cell">
                  <span className="summary__label">Phải trả</span>
                  <span className="summary__value">{money(result.totals.payable)}</span>
                </div>
                <div className="summary__cell tone-success">
                  <span className="summary__label">Đã trả</span>
                  <span className="summary__value">{money(result.totals.paid)}</span>
                </div>
                <div className="summary__cell tone-danger">
                  <span className="summary__label">Còn nợ</span>
                  <span className="summary__value">{money(result.totals.outstanding)}</span>
                </div>
                <div className="summary__cell">
                  <span className="summary__label">Trả hàng</span>
                  <span className="summary__value">{money(result.totals.returned)}</span>
                </div>
              </div>
              {rows.length === 0 ? (
                <Empty icon="zi-file" title="Không có phiếu nhập nào" text="Thử chọn trạng thái khác." />
              ) : (
                <Rows>
                  {rows.map((r) => {
                    const st = statusLabel(r.status);
                    return (
                      <Row
                        key={r.id}
                        title={r.code}
                        meta={`${date(r.receiptDate)} · ${r.supplier.name ?? ""} · ${r.zone.code ?? r.zone.name ?? ""}${r.raft ? ` / ${r.raft.code}` : ""}`}
                        badge={
                          <>
                            <Badge text={st.text} tone={st.tone} />
                            {r.outstanding > 0 && r.statusId === RECEIPT_COMPLETED && <Badge text={`Còn nợ ${money(r.outstanding)}`} tone="danger" />}
                          </>
                        }
                        value={money(r.payable)}
                        onClick={() => navigate(`/manage/purchases/${r.id}`)}
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

export default PurchasesPage;
