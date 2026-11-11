import { Button, useNavigate, useParams } from "zmp-ui";

import { Badge } from "@/components/Badge/Badge";
import { Empty } from "@/components/Empty/Empty";
import { Facts } from "@/components/Facts/Facts";
import { Loadable } from "@/components/Loadable/Loadable";
import { ManagePage } from "@/components/ManagePage/ManagePage";
import { Row } from "@/components/Row/Row";
import { Rows } from "@/components/Rows/Rows";
import { Section } from "@/components/Section/Section";
import { useLoad } from "@/hooks/useLoad";
import { date, money } from "@/utils/format";
import { PAYMENT_METHOD, statusLabel } from "@/utils/labels";
import { MetaLines } from "@/features/purchasing/components/MetaLines/MetaLines";
import { getSupplierDebt, listSupplierPayments } from "@/features/purchasing/services/purchasingService";

const PAYMENT_LIMIT = 100;

/** Công nợ một nhà cung cấp: số tổng hiện tại, các phiếu đã hoàn tất và các lần trả tiền. */
function SupplierDebtPage() {
  const { id = "" } = useParams();
  const navigate = useNavigate();
  const { data, error, reload } = useLoad(async () => {
    const [debt, payments] = await Promise.all([getSupplierDebt(id), listSupplierPayments({ supplierId: id, pageSize: PAYMENT_LIMIT })]);
    return { debt, payments };
  }, [id]);

  return (
    <ManagePage title="Công nợ nhà cung cấp">
      <Loadable data={data} error={error} reload={() => void reload()}>
        {({ debt: { totals, receipts }, payments }) => (
          <>
            <Section title={totals.supplierName ?? "Nhà cung cấp"}>
              <div className="summary">
                <div className={`summary__cell${totals.outstanding > 0 ? " tone-danger" : ""}`}>
                  <span className="summary__label">{totals.outstanding < 0 ? "Hợp tác xã đã trả trước" : "Còn phải trả"}</span>
                  <span className="summary__value">{money(Math.abs(totals.outstanding))}</span>
                </div>
                <div className="summary__cell">
                  <span className="summary__label">Đã trả</span>
                  <span className="summary__value">{money(totals.paid)}</span>
                </div>
              </div>
              <Facts
                items={[
                  ["Tổng tiền hàng", money(totals.payable)],
                  ["Trả hàng", totals.returned > 0 ? money(totals.returned) : null],
                  ["Nhà cung cấp hoàn tiền", totals.refunded > 0 ? money(totals.refunded) : null],
                  ["Trả trước chưa gắn phiếu", totals.unallocated > 0 ? money(totals.unallocated) : null],
                ]}
              />
            </Section>

            {import.meta.env.DEV && (
              <Button fullWidth variant="secondary" size="large" className="more" onClick={() => navigate("/mock/supplierStatement/SK-1")}>
                Xem mẫu sao kê theo kỳ · bản dev
              </Button>
            )}

            <Section title="Phiếu nhập đã hoàn tất">
              {receipts.length === 0 ? (
                <Empty icon="zi-file" title="Chưa có phiếu nhập hoàn tất" />
              ) : (
                <Rows>
                  {receipts.map((r) => (
                    <Row
                      key={r.receiptId}
                      title={r.code}
                      meta={
                        <MetaLines
                          items={[
                            ["Ngày nhập", date(r.receiptDate)],
                            ["Tiền hàng", money(r.payable)],
                            ["Đã trả", money(r.paid)],
                            ["Trả hàng", r.returned > 0 ? money(r.returned) : null],
                            ["Còn nợ", <span key="o" className={r.outstanding > 0 ? "text-danger" : undefined}>{money(r.outstanding)}</span>],
                          ]}
                        />
                      }
                      onClick={() => navigate(`/manage/purchases/${r.receiptId}`)}
                    />
                  ))}
                </Rows>
              )}
            </Section>

            <Section title="Các lần trả tiền">
              {payments.page.items.length === 0 ? (
                <Empty icon="zi-check-circle" title="Chưa có lần trả tiền nào" />
              ) : (
                <Rows>
                  {payments.page.items.map((p) => {
                    const st = statusLabel(p.status);
                    return (
                      <Row
                        key={p.id}
                        title={date(p.paymentDate)}
                        meta={
                          <MetaLines
                            items={[
                              ["Số tiền", money(p.amount)],
                              ["Hình thức", PAYMENT_METHOD[p.method] ?? p.method],
                              ["Phiếu nhập", p.receiptCode || "Chưa gắn phiếu"],
                              ["Mã giao dịch", p.referenceCode],
                            ]}
                          />
                        }
                        badge={p.status !== "Recorded" ? <Badge text={st.text} tone={st.tone} /> : undefined}
                        onClick={p.receiptId ? () => navigate(`/manage/purchases/${p.receiptId}`) : undefined}
                      />
                    );
                  })}
                </Rows>
              )}
              {payments.page.total > payments.page.items.length && <p className="screen__note">Đang hiện {payments.page.items.length} trong {payments.page.total} lần trả tiền.</p>}
            </Section>
          </>
        )}
      </Loadable>
    </ManagePage>
  );
}

export default SupplierDebtPage;
