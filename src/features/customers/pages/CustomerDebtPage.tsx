import type { StatementEntry, StatementEntryKind } from "@/features/customers/models/CustomerDebt";
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
import { ReasonSheet } from "@/components/ReasonSheet/ReasonSheet";
import { Row } from "@/components/Row/Row";
import { Rows } from "@/components/Rows/Rows";
import { Section } from "@/components/Section/Section";
import { MESSAGES } from "@/constants/messages";
import { useAction } from "@/hooks/useAction";
import { useBusinessPermission } from "@/hooks/useBusinessPermission";
import { useLoad } from "@/hooks/useLoad";
import { date, dateTime, money, signedMoney } from "@/utils/format";
import { MetaLines } from "@/features/purchasing/components/MetaLines/MetaLines";
import { DebtAdjustmentSheet } from "@/features/customers/components/DebtAdjustmentSheet/DebtAdjustmentSheet";
import { cancelDebtAdjustment, getCustomerStatement } from "@/features/customers/services/customerDebtService";
import { customPeriodError, PERIOD_CHOICES, periodOf } from "@/utils/period";
import { debtLabel, ENTRY_KIND_TEXT, entryBadges, METHOD_TEXT } from "@/features/customers/utils/customerText";
import "@/features/customers/styles/customers.scss";

/** Dòng sao kê là một phiếu thu hoặc phiếu trả lại tiền: `id` là mã phiếu, mở được ở màn thu tiền. */
const PAYMENT_KINDS: StatementEntryKind[] = ["Payment", "Discount", "PaidBack"];

/** Dư nợ sau một dòng: số âm là HTX còn nợ lại thương lái. */
const debtAfterText = (debt: number) => (debt < 0 ? `HTX nợ lại ${money(-debt)}` : money(debt));

/**
 * Công nợ một thương lái (DEBT-03 bước 3): nợ hôm nay, các hóa đơn còn nợ (cũ nhất trước, BR-DEBT-05) và sao kê theo kỳ
 * có dư nợ sau từng dòng (BR-DEBT-04). Từ đây lập phiếu thu, trả lại tiền khi HTX còn nợ lại (BR-DEBT-03) và điều chỉnh
 * công nợ bằng tay; hai việc đầu nằm ở màn thu tiền.
 */
function CustomerDebtPage() {
  const { customerId = "" } = useParams();
  const navigate = useNavigate();
  const { openSnackbar } = useSnackbar();
  const allowed = useBusinessPermission();
  const { busy, run } = useAction();
  const [choice, setChoice] = useState<StatementPeriodChoice>("month");
  const [custom, setCustom] = useState({ from: "", to: "" });
  const [rangeError, setRangeError] = useState("");
  const [loadingPeriod, setLoadingPeriod] = useState(false);
  const [adjusting, setAdjusting] = useState(false);
  const [cancelling, setCancelling] = useState<StatementEntry | null>(null);
  // Đổi kỳ thì tải lại tại chỗ (giữ nợ hôm nay và hóa đơn còn nợ trên màn), nên kỳ đang xem nằm trong ref.
  const period = useRef<StatementPeriod>({});
  const statement = useLoad(() => getCustomerStatement(customerId, period.current), [customerId]);

  const canPay = allowed("CUSTOMER_PAYMENTS", "Create");
  const canAdjust = allowed("CUSTOMER_PAYMENTS", "Edit");
  const canOpenInvoices = allowed("SALES_INVOICES", "View");
  const canOpenPayments = allowed("CUSTOMER_PAYMENTS", "View");

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
    const { from, to } = custom;
    const invalid = customPeriodError(from, to, MESSAGES.MSG01);
    setRangeError(invalid);
    if (!invalid) void show({ from, to });
  };

  const cancelAdjustment = async (reason: string) => {
    if (!cancelling) return false;
    const saved = await run(() => cancelDebtAdjustment(cancelling.id, { reason }), "Đã hủy điều chỉnh công nợ.");
    if (!saved) return false;
    void statement.reload();
    return true;
  };

  return (
    <ManagePage
      title="Công nợ thương lái"
      footer={
        statement.data && canPay ? (
          <Button fullWidth size="large" onClick={() => navigate(`/manage/customer-payments/new?customer=${customerId}`)}>
            Lập phiếu thu
          </Button>
        ) : undefined
      }
    >
      <Loadable data={statement.data} error={statement.error} reload={() => void statement.reload()}>
        {(s) => {
          const today = debtLabel(s.debtToday);
          return (
            <>
              <Section title={s.customer.name}>
                {(s.customer.code || s.customer.phoneNumber) && <p className="form__hint">{[s.customer.code, s.customer.phoneNumber].filter(Boolean).join(" · ")}</p>}
                <div className="summary customer-summary">
                  <div className={`summary__cell tone-${today.tone}`}>
                    <span className="summary__label">{today.text}</span>
                    <span className="summary__value">{money(Math.abs(s.debtToday))}</span>
                  </div>
                  {s.debtAgeDays !== null && (
                    <div className="summary__cell">
                      <span className="summary__label">Tuổi nợ</span>
                      <span className="summary__value">{s.debtAgeDays} ngày</span>
                    </div>
                  )}
                </div>
                <Actions>
                  {canPay && s.debtToday < 0 && (
                    <Button variant="secondary" size="large" onClick={() => navigate(`/manage/customer-payments/pay-back?customer=${customerId}`)}>
                      Trả lại tiền cho thương lái
                    </Button>
                  )}
                  {canAdjust && (
                    <Button variant="secondary" size="large" onClick={() => setAdjusting(true)}>
                      Điều chỉnh công nợ
                    </Button>
                  )}
                  {allowed("CUSTOMERS", "View") && (
                    <Button variant="secondary" size="large" onClick={() => navigate(`/manage/customers/${customerId}`)}>
                      Xem hồ sơ khách hàng
                    </Button>
                  )}
                </Actions>
              </Section>

              <Section title="Hóa đơn còn nợ">
                {s.unpaidInvoices.length === 0 ? (
                  <Empty icon="zi-check-circle" title="Không còn hóa đơn nào chưa trả" />
                ) : (
                  <Rows>
                    {s.unpaidInvoices.map((i) => (
                      <Row
                        key={i.id}
                        title={i.code}
                        meta={
                          <MetaLines
                            items={[
                              ["Ngày hóa đơn", date(i.invoiceDate)],
                              ["Tổng tiền", money(i.total)],
                              ["Đã trả", money(i.covered)],
                              ["Tuổi nợ", `${i.ageDays} ngày`],
                            ]}
                          />
                        }
                        value={<span className="text-danger">{money(i.unpaid)}</span>}
                        onClick={canOpenInvoices ? () => navigate(`/manage/invoices/${i.id}`) : undefined}
                      />
                    ))}
                  </Rows>
                )}
              </Section>

              <Section title="Sao kê theo kỳ">
                <Chips options={PERIOD_CHOICES} value={choice} onChange={pick} />
                {choice === "custom" && (
                  <div className="form card statement-range">
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
                  <>
                    {statement.error && <FormError text={statement.error} />}
                    <Facts
                      items={[
                        ["Kỳ", `${date(s.from)} – ${date(s.to)}`],
                        ["Dư nợ đầu kỳ", debtAfterText(s.openingDebt)],
                        ["Dư nợ cuối kỳ", debtAfterText(s.closingDebt)],
                      ]}
                    />
                    {s.entries.length === 0 ? (
                      <Empty icon="zi-file" title="Không có phát sinh trong kỳ này" />
                    ) : (
                      <Rows>
                        {s.entries.map((e) => (
                          <EntryRow
                            key={`${e.kind}-${e.id}`}
                            entry={e}
                            onClick={
                              e.kind === "Invoice" && canOpenInvoices
                                ? () => navigate(`/manage/invoices/${e.id}`)
                                : PAYMENT_KINDS.includes(e.kind) && canOpenPayments
                                  ? () => navigate(`/manage/customer-payments/${e.id}`)
                                  : e.kind === "Adjustment" && !e.cancelled && canAdjust
                                    ? () => setCancelling(e)
                                    : undefined
                            }
                          />
                        ))}
                      </Rows>
                    )}
                  </>
                )}
              </Section>

              <DebtAdjustmentSheet
                visible={adjusting}
                customerId={customerId}
                customerName={s.customer.name}
                debtToday={s.debtToday}
                onClose={() => setAdjusting(false)}
                onSaved={() => {
                  openSnackbar({ text: "Đã lưu điều chỉnh công nợ.", type: "success", duration: 4000 });
                  void statement.reload();
                }}
              />
              <ReasonSheet
                visible={cancelling !== null}
                title="Hủy điều chỉnh công nợ?"
                intro={cancelling ? `Điều chỉnh ${cancelling.code} (${signedMoney(cancelling.debtChange)}) sẽ không còn tính vào nợ, kể cả ở các kỳ trước.` : undefined}
                confirmText="Hủy điều chỉnh"
                required
                maxLength={1000}
                danger
                busy={busy}
                onClose={() => setCancelling(null)}
                onConfirm={cancelAdjustment}
              />
            </>
          );
        }}
      </Loadable>
    </ManagePage>
  );
}

/** Một dòng phát sinh: loại và mã, ngày, người thu/ghi, lý do; bên phải là số làm đổi nợ, kèm dư nợ sau dòng. */
function EntryRow({ entry: e, onClick }: { entry: StatementEntry; onClick?: () => void }) {
  const badges = entryBadges(e);
  const valueClass = e.debtChange > 0 ? "text-danger" : e.debtChange < 0 ? "tone-success" : "text-muted";
  return (
    <Row
      title={`${ENTRY_KIND_TEXT[e.kind] ?? e.kind} ${e.code}`}
      meta={
        <MetaLines
          items={[
            ["Ngày", e.at ? dateTime(e.at) : date(e.date)],
            ["Hình thức", e.method ? (METHOD_TEXT[e.method] ?? e.method) : null],
            ["Hóa đơn", e.kind !== "Invoice" && e.kind !== "PriceCut" ? e.invoiceCode : null],
            ["Người thu", e.collectedBy?.name],
            ["Người ghi", e.recordedBy?.name],
            [e.kind === "Adjustment" || e.kind === "PriceCut" ? "Lý do" : "Ghi chú", e.note],
            ["Lý do hủy", e.cancelReason],
            ["Dư nợ sau", debtAfterText(e.debtAfter)],
          ]}
        />
      }
      badge={badges.length > 0 ? <>{badges.map((b) => <Badge key={b.text} text={b.text} tone={b.tone} />)}</> : undefined}
      value={<span className={valueClass}>{e.debtChange !== 0 ? signedMoney(e.debtChange) : money(e.amount)}</span>}
      onClick={onClick}
    />
  );
}

export default CustomerDebtPage;
