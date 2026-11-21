import type { LotPublishCheck, LotTrace, LotWithdrawalPreview, TraceCorrectionMark, WithdrawalNotice } from "@/features/traceability/models/LotTracing";
import { useState } from "react";
import { Button, Sheet, useNavigate, useParams, useSnackbar } from "zmp-ui";

import { Actions } from "@/components/Actions/Actions";
import { Badge } from "@/components/Badge/Badge";
import { ConfirmSheet } from "@/components/ConfirmSheet/ConfirmSheet";
import { Empty } from "@/components/Empty/Empty";
import { Facts } from "@/components/Facts/Facts";
import { Loadable } from "@/components/Loadable/Loadable";
import { ManagePage } from "@/components/ManagePage/ManagePage";
import { ReasonSheet } from "@/components/ReasonSheet/ReasonSheet";
import { Row } from "@/components/Row/Row";
import { Rows } from "@/components/Rows/Rows";
import { Section } from "@/components/Section/Section";
import { useAction } from "@/hooks/useAction";
import { useBusinessPermission } from "@/hooks/useBusinessPermission";
import { useLoad } from "@/hooks/useLoad";
import { date, dateTime, money, num } from "@/utils/format";
import { MetaLines } from "@/features/purchasing/components/MetaLines/MetaLines";
import {
  checkLotPublish,
  getLotTrace,
  getWithdrawalNotices,
  previewLotWithdrawal,
  publishLot,
  withdrawLot,
} from "@/features/traceability/services/lotTracingService";
import { gapText, noticeLabel, ORIGIN_STATE, PUBLISH_BLOCK_TEXT } from "@/features/traceability/utils/lotTraceText";
import "@/features/traceability/styles/lotTrace.scss";

const MAX_REASON = 1000;

/** "Sửa ngày 12/11/2026 bởi Nguyễn Văn A: lý do" cho các bản ghi đã qua sửa dữ liệu truy xuất (TRACE-03). */
const correctionLines = (marks: TraceCorrectionMark[]) =>
  marks.map((m) => `Đã sửa ${dateTime(m.correctedAt)}${m.actorName ? ` bởi ${m.actorName}` : ""}${m.reason ? `: ${m.reason}` : ""}`);

/**
 * Truy vết một lô hàu (SCR-TRACE-01): truy ngược về bè, vùng, chu kỳ, từng luống và lô giống, phiếu nhập, nhà cung cấp; truy
 * xuôi tới các hóa đơn bán và thương lái. Từ đây công bố thông tin nguồn gốc (TRACE-01.2) và, với Chủ HTX, thu hồi (TRACE-04).
 * Nút nào hiện do backend quyết định (`canPublish`, `canWithdraw`), app chỉ làm theo.
 */
function LotTracePage() {
  const { lotId = "" } = useParams();
  const navigate = useNavigate();
  const { openSnackbar } = useSnackbar();
  const allowed = useBusinessPermission();
  const { busy, run } = useAction();
  const trace = useLoad(() => getLotTrace(lotId), [lotId]);
  const [publishing, setPublishing] = useState<LotPublishCheck | null>(null);
  const [withdrawing, setWithdrawing] = useState<LotWithdrawalPreview | null>(null);
  const [notices, setNotices] = useState<{ title: string; items: WithdrawalNotice[]; walkIn: string[] } | null>(null);

  const startPublish = async () => {
    const check = await run(() => checkLotPublish(lotId));
    if (check) setPublishing(check);
  };

  const publish = async () => {
    const done = await run(() => publishLot(lotId), "Đã công bố thông tin nguồn gốc của lô.");
    setPublishing(null);
    if (done) void trace.reload();
  };

  const startWithdraw = async () => {
    const preview = await run(() => previewLotWithdrawal(lotId));
    if (preview) setWithdrawing(preview);
  };

  const withdraw = async (reason: string) => {
    const done = await run(() => withdrawLot(lotId, { reason }));
    if (!done) return false;
    setWithdrawing(null);
    openSnackbar({ text: "Đã thu hồi thông tin nguồn gốc của lô.", type: "success", duration: 4000 });
    setNotices({ title: "Kết quả báo thương lái", items: done.notices, walkIn: done.walkInInvoiceCodes });
    void trace.reload();
    return true;
  };

  const showNotices = async () => {
    const saved = await run(() => getWithdrawalNotices(lotId));
    if (saved) setNotices({ title: `Thông báo thu hồi ${dateTime(saved.withdrawnAt)}`, items: saved.notices, walkIn: saved.walkInInvoiceCodes });
  };

  return (
    <ManagePage title="Truy vết lô hàu">
      <Loadable data={trace.data} error={trace.error} reload={() => void trace.reload()}>
        {(t) => (
          <>
            <LotSummary trace={t} />

            {(t.canPublish || t.canWithdraw || t.withdrawnAt) && (
              <Actions>
                {t.canPublish && (
                  <Button size="large" loading={busy} disabled={busy} onClick={() => void startPublish()}>
                    {t.originState === "Withdrawn" ? "Công bố lại nguồn gốc" : "Công bố nguồn gốc"}
                  </Button>
                )}
                {t.canWithdraw && (
                  <Button size="large" type="danger" variant="secondary" loading={busy} disabled={busy} onClick={() => void startWithdraw()}>
                    Thu hồi nguồn gốc
                  </Button>
                )}
                {t.withdrawnAt && (
                  <Button size="large" variant="secondary" loading={busy} disabled={busy} onClick={() => void showNotices()}>
                    Xem thông báo thu hồi
                  </Button>
                )}
              </Actions>
            )}

            {t.missing.length > 0 && (
              <Section title="Còn thiếu thông tin nguồn gốc">
                <div className="trace-gaps">
                  <ul className="plain-list">
                    {t.missing.map((g, i) => (
                      <li key={i}>{gapText(g)}</li>
                    ))}
                  </ul>
                </div>
              </Section>
            )}

            <Section title="Truy ngược: luống và giống">
              {t.lanes.length === 0 ? (
                <Empty icon="zi-list-1" title="Lô chưa gắn luống nào" />
              ) : (
                <Rows>
                  {t.lanes.flatMap((lane) =>
                    lane.seedings.length === 0
                      ? [<Row key={`lane-${lane.laneNumber}`} title={`Luống ${lane.laneNumber}`} meta="Chưa có phiên thả giống" badge={<Badge text="Thiếu giống" tone="warning" />} />]
                      : lane.seedings.map((s) => (
                          <Row
                            key={s.seedingRecordId}
                            title={`Luống ${lane.laneNumber} · lô giống ${s.seedLot.code}`}
                            meta={
                              <MetaLines
                                items={[
                                  ["Ngày thả", date(s.seedingDate)],
                                  ["Số lượng", num(s.quantity, s.seedLot.unit)],
                                  ["Giống", s.seedLot.itemName],
                                  ["Nhà cung cấp", s.seedLot.supplierName],
                                  ["Phiếu nhập", `${s.seedLot.receiptCode} · ${date(s.seedLot.receivedDate)}`],
                                  ...correctionLines(s.corrections).map((c): [string, string] => ["Sửa dữ liệu", c]),
                                ]}
                              />
                            }
                            badge={!s.onCompletedReceipt ? <Badge text="Phiếu chưa hoàn tất" tone="warning" /> : lane.isFinished ? <Badge text="Thu xong" tone="neutral" /> : undefined}
                            onClick={allowed("PURCHASE_RECEIPTS", "View") ? () => navigate(`/manage/purchases/${s.seedLot.receiptId}`) : undefined}
                          />
                        )),
                  )}
                </Rows>
              )}
            </Section>

            <Section title="Truy xuôi: hóa đơn bán">
              {t.invoices.length === 0 ? (
                <Empty icon="zi-file" title="Lô chưa có trên hóa đơn bán nào" />
              ) : (
                <>
                  <p className="form__hint">Đã bán {num(t.invoicedKg, "kg")} trên {t.invoices.length} hóa đơn.</p>
                  <Rows>
                    {t.invoices.map((inv) => (
                      <Row
                        key={inv.invoiceId}
                        title={`${inv.invoiceCode} · ${inv.walkIn ? "Khách lẻ" : (inv.customerName ?? "Thương lái")}`}
                        meta={
                          <MetaLines
                            items={[
                              ["Ngày bán", date(inv.invoiceDate)],
                              ["Số điện thoại", inv.customerPhone],
                              ["Khối lượng của lô", num(inv.kg, "kg")],
                              ...inv.lines.map((l): [string, string] => [
                                l.productName,
                                l.unitPrice !== null ? `${num(l.kg, "kg")} × ${money(l.unitPrice)}` : num(l.kg, "kg"),
                              ]),
                              ...inv.returns.map((r): [string, string] => [`Trả hàng ${r.code}`, `${num(r.kg, "kg")} · ${date(r.returnDate)}`]),
                            ]}
                          />
                        }
                        onClick={allowed("SALES_INVOICES", "View") ? () => navigate(`/manage/invoices/${inv.invoiceId}`) : undefined}
                      />
                    ))}
                  </Rows>
                </>
              )}
            </Section>

            <PublishSheet check={publishing} busy={busy} onClose={() => setPublishing(null)} onPublish={() => void publish()} />

            <ReasonSheet
              visible={withdrawing !== null}
              title="Thu hồi thông tin nguồn gốc"
              intro={withdrawing ? withdrawIntro(withdrawing) : undefined}
              confirmText="Thu hồi và báo thương lái"
              required
              maxLength={MAX_REASON}
              danger
              busy={busy}
              onClose={() => setWithdrawing(null)}
              onConfirm={withdraw}
            >
              {withdrawing && withdrawing.traders.length > 0 && (
                <ul className="plain-list">
                  {withdrawing.traders.map((tr) => (
                    <li key={tr.customerId}>
                      {tr.customerName}
                      {tr.phoneNumber ? ` · ${tr.phoneNumber}` : " · chưa có số điện thoại"} ({tr.invoiceCodes.join(", ")})
                    </li>
                  ))}
                </ul>
              )}
            </ReasonSheet>

            <NoticesSheet notices={notices} onClose={() => setNotices(null)} />
          </>
        )}
      </Loadable>
    </ManagePage>
  );
}

/** Đầu màn: mã lô, trạng thái công bố, thu hoạch, bè, vùng, chu kỳ. */
function LotSummary({ trace: t }: { trace: LotTrace }) {
  const origin = ORIGIN_STATE[t.originState];
  return (
    <Section title={`Lô ${t.lotCode}`}>
      <Badge text={origin.text} tone={origin.tone} />
      <Facts
        items={[
          ["Thu hoạch", dateTime(t.harvestedAt)],
          ["Số lồng", num(t.cageCount, "lồng")],
          ["Khối lượng ước tính", num(t.estimatedKg, "kg")],
          ["Bè", t.raftCode],
          ["Vùng nuôi", `${t.zoneCode} · ${t.zoneName}`],
          ["Chu kỳ nuôi", `${date(t.cycleStartDate)}${t.cycleCloseDate ? ` – ${date(t.cycleCloseDate)}` : " – đang nuôi"}`],
          ["Công bố lúc", t.publishedAt ? dateTime(t.publishedAt) : null],
          ["Thu hồi lúc", t.withdrawnAt ? dateTime(t.withdrawnAt) : null],
          ...correctionLines(t.corrections).map((c): [string, string] => ["Sửa dữ liệu thu hoạch", c]),
        ]}
      />
    </Section>
  );
}

/** Câu hỏi trước khi công bố, hoặc lý do chưa công bố được (thiếu thông tin, không có quyền). */
function PublishSheet({ check, busy, onClose, onPublish }: { check: LotPublishCheck | null; busy: boolean; onClose: () => void; onPublish: () => void }) {
  if (check && check.canPublish && check.ready) {
    return (
      <ConfirmSheet
        visible
        title={check.republish ? "Công bố lại nguồn gốc" : "Công bố nguồn gốc"}
        message={`Công bố thông tin nguồn gốc của lô ${check.lotCode}? Người mua quét mã QR trên hóa đơn sẽ xem được lô được nuôi ở đâu, thả giống từ đâu.`}
        confirmText="Có, công bố"
        busy={busy}
        onClose={onClose}
        onConfirm={onPublish}
      />
    );
  }
  return (
    <Sheet visible={check !== null} onClose={onClose} autoHeight mask handler swipeToClose title="Chưa công bố được">
      <div className="sheet-form form">
        {check?.block && <p className="form__intro">{PUBLISH_BLOCK_TEXT[check.block]}</p>}
        {check && check.missing.length > 0 && (
          <>
            <p className="form__intro">Lô {check.lotCode} còn thiếu thông tin nguồn gốc:</p>
            <ul className="plain-list">
              {check.missing.map((g, i) => (
                <li key={i}>{gapText(g)}</li>
              ))}
            </ul>
          </>
        )}
        <Button fullWidth size="large" variant="secondary" onClick={onClose}>
          Đóng
        </Button>
      </div>
    </Sheet>
  );
}

function withdrawIntro(p: LotWithdrawalPreview) {
  const who = p.traders.length > 0 ? `HTX sẽ nhắn tin báo ${p.traders.length} thương lái dưới đây.` : "Không có thương lái nào cần báo.";
  const walkIn = p.walkInInvoiceCodes.length > 0 ? ` Hóa đơn khách lẻ không báo được: ${p.walkInInvoiceCodes.join(", ")}.` : "";
  const none = p.noticeCode ? " Hiện không còn hóa đơn nào bán lô này." : "";
  return `Người mua quét mã QR của lô ${p.lotCode} sẽ thấy thông tin đã bị thu hồi. ${who}${walkIn}${none} Lý do chỉ lưu trong HTX, không gửi cho thương lái.`;
}

/** Kết quả báo từng thương lái; người có nhãn "Cần gọi điện" chưa nhận được tin nhắn (BR-TRACE-07). */
function NoticesSheet({ notices, onClose }: { notices: { title: string; items: WithdrawalNotice[]; walkIn: string[] } | null; onClose: () => void }) {
  return (
    <Sheet visible={notices !== null} onClose={onClose} autoHeight mask handler swipeToClose title={notices?.title ?? ""}>
      <div className="sheet-form form">
        {notices && notices.items.length === 0 ? (
          <p className="form__intro">Không có thương lái nào được báo.</p>
        ) : (
          <Rows>
            {notices?.items.map((n) => {
              const label = noticeLabel(n);
              return (
                <Row
                  key={n.customerId}
                  title={n.customerName}
                  meta={
                    <MetaLines
                      items={[
                        ["Số điện thoại", n.phoneNumber ?? "Chưa có"],
                        ["Hóa đơn", n.invoiceCodes.join(", ")],
                        ["Trong app", n.notifiedInApp ? "Đã báo" : null],
                      ]}
                    />
                  }
                  badge={<Badge text={label.text} tone={label.tone} />}
                />
              );
            })}
          </Rows>
        )}
        {notices && notices.walkIn.length > 0 && <p className="form__hint">Hóa đơn khách lẻ, không có ai để báo: {notices.walkIn.join(", ")}.</p>}
        <Button fullWidth size="large" variant="secondary" onClick={onClose}>
          Đóng
        </Button>
      </div>
    </Sheet>
  );
}

export default LotTracePage;
