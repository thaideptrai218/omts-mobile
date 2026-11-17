import type { SupplierStatementEntry } from "@/features/purchasing/models/SupplierDebt";
import type { StatementPeriod, StatementPeriodChoice } from "@/models/Period";
import { useRef, useState } from "react";
import { Button, useNavigate, useParams, useSnackbar } from "zmp-ui";

import { Actions } from "@/components/Actions/Actions";
import { Badge } from "@/components/Badge/Badge";
import { Chips } from "@/components/Chips/Chips";
import DateField from "@/components/DateField/DateField";
import { Empty } from "@/components/Empty/Empty";
import { Facts } from "@/components/Facts/Facts";
import FormError from "@/components/FormError/FormError";
import { Loadable } from "@/components/Loadable/Loadable";
import { ManagePage } from "@/components/ManagePage/ManagePage";
import { Row } from "@/components/Row/Row";
import { Rows } from "@/components/Rows/Rows";
import { Section } from "@/components/Section/Section";
import { MESSAGES } from "@/constants/messages";
import { useBusinessPermission } from "@/hooks/useBusinessPermission";
import { useLoad } from "@/hooks/useLoad";
import { date, money, signedMoney } from "@/utils/format";
import { PAYMENT_METHOD } from "@/utils/labels";
import { customPeriodError, PERIOD_CHOICES, periodOf } from "@/utils/period";
import { MetaLines } from "@/features/purchasing/components/MetaLines/MetaLines";
import { SupplierPaymentSheet } from "@/features/purchasing/components/SupplierPaymentSheet/SupplierPaymentSheet";
import { getSupplierDebt, getSupplierStatement, STATUS_DISCONTINUED } from "@/features/purchasing/services/purchasingService";
import { STATEMENT_KIND_TEXT, supplierDebtLabel, supplierDebtText } from "@/features/purchasing/utils/paymentText";

/**
 * Công nợ một nhà cung cấp: nợ hôm nay và các phiếu nhập còn phải trả, cũ nhất trước (PURCHASE-05 bước 1), cùng sao kê
 * theo kỳ có dư nợ sau từng dòng (PURCHASE-04 bước 3). Từ đây ghi một lần trả tiền; tiền được tính vào các phiếu cũ nhất.
 */
function SupplierDebtPage() {
  const { id = "" } = useParams();
  const navigate = useNavigate();
  const { openSnackbar } = useSnackbar();
  const allowed = useBusinessPermission();
  const [choice, setChoice] = useState<StatementPeriodChoice>("month");
  const [custom, setCustom] = useState({ from: "", to: "" });
  const [rangeError, setRangeError] = useState("");
  const [loadingPeriod, setLoadingPeriod] = useState(false);
  const [paying, setPaying] = useState(false);
  // Đổi kỳ thì chỉ tải lại sao kê, nợ hôm nay và các phiếu còn nợ vẫn trên màn.
  const period = useRef<StatementPeriod>({});
  const debt = useLoad(() => getSupplierDebt(id), [id]);
  const statement = useLoad(() => getSupplierStatement(id, period.current), [id]);

  const canPay = allowed("SUPPLIER_PAYMENTS", "Create");

  const show = async (next: StatementPeriod) => {
    period.current = next;
    setLoadingPeriod(true);
    await statement.reload();
    setLoadingPeriod(false);
  };

  const pick = (next: StatementPeriodChoice) => {
    setChoice(next);
    setRangeError("");
    if (next !== "custom") void show(next === "month" ? {} : periodOf(next));
  };

  const showCustom = () => {
    const invalid = customPeriodError(custom.from, custom.to, MESSAGES.MSG01);
    setRangeError(invalid);
    if (!invalid) void show({ from: custom.from, to: custom.to });
  };

  const paid = (debtAfter: number | null) => {
    openSnackbar({
      text: debtAfter === null ? "Đã ghi lần trả tiền." : `Đã ghi lần trả tiền. ${supplierDebtLabel(debtAfter).text}: ${money(Math.abs(debtAfter))}.`,
      type: "success",
      duration: 4000,
    });
    void debt.reload();
    void statement.reload();
  };

  return (
    <ManagePage
      title="Công nợ nhà cung cấp"
      footer={
        debt.data && canPay ? (
          <Button fullWidth size="large" onClick={() => setPaying(true)}>
            Ghi trả tiền
          </Button>
        ) : undefined
      }
    >
      <Loadable data={debt.data} error={debt.error} reload={() => void debt.reload()}>
        {(d) => {
          const today = supplierDebtLabel(d.debtToday);
          return (
            <>
              <Section title={d.supplier.name}>
                {d.supplier.phoneNumber && <p className="form__hint">{d.supplier.phoneNumber}</p>}
                {d.supplier.statusId === STATUS_DISCONTINUED && <Badge text="Ngừng dùng" tone="neutral" />}
                <div className="summary">
                  <div className={`summary__cell tone-${today.tone}`}>
                    <span className="summary__label">{today.text}</span>
                    <span className="summary__value">{money(Math.abs(d.debtToday))}</span>
                  </div>
                  {d.debtAgeDays !== null && (
                    <div className="summary__cell">
                      <span className="summary__label">Tuổi nợ</span>
                      <span className="summary__value">{d.debtAgeDays} ngày</span>
                    </div>
                  )}
                </div>
                {allowed("SUPPLIERS", "View") && (
                  <Actions>
                    <Button variant="secondary" size="large" onClick={() => navigate(`/manage/suppliers/${d.supplier.id}`)}>
                      Xem hồ sơ nhà cung cấp
                    </Button>
                  </Actions>
                )}
              </Section>

              <Section title="Phiếu nhập còn phải trả">
                {d.unpaidReceipts.length === 0 ? (
                  <Empty icon="zi-check-circle" title="Không còn phiếu nhập nào chưa trả" />
                ) : (
                  <Rows>
                    {d.unpaidReceipts.map((r) => (
                      <Row
                        key={r.id}
                        title={r.code}
                        meta={
                          <MetaLines
                            items={[
                              ["Ngày nhập", date(r.receiptDate)],
                              ["Tổng tiền", money(r.total)],
                              ["Giảm giá", r.discount > 0 ? money(r.discount) : null],
                              ["Trả hàng", r.returned > 0 ? money(r.returned) : null],
                              ["Đã trả", money(r.covered)],
                              ["Tuổi nợ", `${r.ageDays} ngày`],
                            ]}
                          />
                        }
                        value={<span className="text-danger">{money(r.remaining)}</span>}
                        onClick={() => navigate(`/manage/purchases/${r.id}`)}
                      />
                    ))}
                  </Rows>
                )}
              </Section>

              <Section title="Sao kê theo kỳ">
                <Chips options={PERIOD_CHOICES} value={choice} onChange={pick} />
                {choice === "custom" && (
                  <div className="form card more">
                    <DateField label="Từ ngày" value={custom.from || null} onChange={(from) => { setCustom((c) => ({ ...c, from })); setRangeError(""); }} disabled={loadingPeriod} />
                    <DateField label="Đến ngày" value={custom.to || null} onChange={(to) => { setCustom((c) => ({ ...c, to })); setRangeError(""); }} disabled={loadingPeriod} />
                    <FormError text={rangeError} />
                    <Button fullWidth size="large" loading={loadingPeriod} disabled={loadingPeriod} onClick={showCustom}>
                      Xem sao kê
                    </Button>
                  </div>
                )}
                {loadingPeriod ? (
                  <p className="form__hint" role="status">Đang tải sao kê...</p>
                ) : (
                  <Loadable data={statement.data} error={statement.error} reload={() => void statement.reload()}>
                    {(s) => (
                      <>
                        <Facts
                          items={[
                            ["Kỳ", `${date(s.from)} – ${date(s.to)}`],
                            ["Dư nợ đầu kỳ", supplierDebtText(s.openingDebt)],
                            ["Dư nợ cuối kỳ", supplierDebtText(s.closingDebt)],
                          ]}
                        />
                        {s.entries.length === 0 ? (
                          <Empty icon="zi-calendar" title="Không có phát sinh trong kỳ" />
                        ) : (
                          <Rows>
                            {s.entries.map((e) => (
                              <StatementRow key={`${e.kind}-${e.id}`} entry={e} onOpenReceipt={(receiptId) => navigate(`/manage/purchases/${receiptId}`)} />
                            ))}
                          </Rows>
                        )}
                      </>
                    )}
                  </Loadable>
                )}
              </Section>

              {canPay && (
                <SupplierPaymentSheet
                  visible={paying}
                  supplier={d.supplier}
                  suggested={d.debtToday > 0 ? { label: "Trả hết nợ", amount: d.debtToday } : undefined}
                  onClose={() => setPaying(false)}
                  onPaid={(p) => paid(p.debtAfter)}
                />
              )}
            </>
          );
        }}
      </Loadable>
    </ManagePage>
  );
}

/** Một dòng sao kê: loại và mã chứng từ, số tiền làm tăng (+) hoặc giảm (−) nợ, dư nợ sau dòng. */
function StatementRow({ entry: e, onOpenReceipt }: { entry: SupplierStatementEntry; onOpenReceipt: (receiptId: string) => void }) {
  const isMoney = e.kind === "Payment" || e.kind === "PaidBack";
  return (
    <Row
      title={`${STATEMENT_KIND_TEXT[e.kind]} ${e.code}`}
      meta={
        <MetaLines
          items={[
            ["Ngày", date(e.date)],
            ["Hình thức", isMoney && e.method ? (PAYMENT_METHOD[e.method] ?? e.method) : null],
            ["Mã giao dịch", e.bankReference],
            ["Theo phiếu nhập", e.kind === "Return" ? e.receiptCode : null],
            ["Ghi chú", e.note],
            ["Dư nợ sau", supplierDebtText(e.debtAfter)],
          ]}
        />
      }
      value={<span className={e.amount > 0 ? "text-danger" : undefined}>{signedMoney(e.amount)}</span>}
      onClick={e.kind === "Receipt" ? () => onOpenReceipt(e.id) : undefined}
    />
  );
}

export default SupplierDebtPage;
