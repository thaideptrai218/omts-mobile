import type { QualityClaimOffer, QualityClaimView } from "@/features/claims/models/QualityClaim";
import { useAtomValue } from "jotai";
import { useState } from "react";
import { Button, useNavigate, useParams } from "zmp-ui";

import { Actions } from "@/components/Actions/Actions";
import { Badge } from "@/components/Badge/Badge";
import { Facts } from "@/components/Facts/Facts";
import { Loadable } from "@/components/Loadable/Loadable";
import { ManagePage } from "@/components/ManagePage/ManagePage";
import { ReasonSheet } from "@/components/ReasonSheet/ReasonSheet";
import { Row } from "@/components/Row/Row";
import { Rows } from "@/components/Rows/Rows";
import { Section } from "@/components/Section/Section";
import { useAction } from "@/hooks/useAction";
import { useLoad } from "@/hooks/useLoad";
import { date, dateTime, money } from "@/utils/format";
import { hasFunction } from "@/features/auth/services/permissionsService";
import { permissionsAtom } from "@/features/auth/state/authAtoms";
import { AcceptClaimSheet } from "@/features/claims/components/AcceptClaimSheet/AcceptClaimSheet";
import { ClaimAnswer } from "@/features/claims/components/ClaimAnswer/ClaimAnswer";
import { ClaimLines } from "@/features/claims/components/ClaimLines/ClaimLines";
import { ClaimPhotos } from "@/features/claims/components/ClaimPhotos/ClaimPhotos";
import { ClaimsGate } from "@/features/claims/components/ClaimsGate/ClaimsGate";
import { acceptClaim, CLAIM_LIMITS, getClaim, rejectClaim } from "@/features/claims/services/claimService";
import { channelText, CLAIM_STATUS, claimStatus, INVOICE_CANCELLED, SENDING_NOT_SENT, sendingStatus } from "@/features/claims/utils/claimText";
import "@/features/claims/styles/claims.scss";

const SAVED = "Đã lưu phản hồi khiếu nại.";

/**
 * Chi tiết khiếu nại cho HTX (SCR-CLAIM-02): ảnh, thương lái, hóa đơn với dòng hàng, tiền và các lần giảm giá. Chủ HTX trả lời
 * một lần khi khiếu nại đang chờ (BR-CLAIM-02): chấp nhận với cách xử lý đề xuất (CLAIM-02.0) hoặc từ chối có lý do (CLAIM-02.1).
 */
export default function QualityClaimDetailPage() {
  return (
    <ClaimsGate mode="staff">
      <CooperativeClaimDetail />
    </ClaimsGate>
  );
}

function CooperativeClaimDetail() {
  const { id = "" } = useParams();
  const navigate = useNavigate();
  const permissions = useAtomValue(permissionsAtom);
  const claim = useLoad(() => getClaim(id), [id]);
  const { busy, run } = useAction();
  const [sheet, setSheet] = useState<"accept" | "reject" | null>(null);

  const owner = permissions?.isCooperativeOwner ?? false;
  const canOpenInvoice = owner || hasFunction(permissions, "SALES_INVOICES");
  const loaded = claim.data;
  const awaiting = loaded?.statusId === CLAIM_STATUS.awaiting;
  const invoiceCancelled = loaded?.invoice.statusId === INVOICE_CANCELLED;

  const respond = async (action: (current: QualityClaimView) => Promise<QualityClaimView>): Promise<boolean> => {
    if (!loaded) return false;
    const saved = await run(() => action(loaded), SAVED);
    if (saved) {
      claim.setData(saved);
      return true;
    }
    // Có thể người khác vừa trả lời hoặc hóa đơn vừa đổi: tải lại để thấy trạng thái và phiên bản mới.
    void claim.reload();
    return false;
  };

  const accept = (offer: QualityClaimOffer, note: string) =>
    respond((c) => acceptClaim(c.id, { offer, note: note || null, rowVersion: c.rowVersion }));

  const reject = (reason: string) => respond((c) => rejectClaim(c.id, { note: reason, rowVersion: c.rowVersion }));

  const footer =
    loaded && owner && awaiting ? (
      <div className="sheet-actions">
        {!invoiceCancelled && (
          <Button fullWidth size="large" disabled={busy} onClick={() => setSheet("accept")}>
            Chấp nhận khiếu nại
          </Button>
        )}
        <Button fullWidth size="large" variant="secondary" type="danger" disabled={busy} onClick={() => setSheet("reject")}>
          Từ chối khiếu nại
        </Button>
      </div>
    ) : undefined;

  return (
    <ManagePage title={loaded ? `Khiếu nại ${loaded.code}` : "Khiếu nại"} footer={footer}>
      <Loadable data={loaded} error={claim.error} reload={() => void claim.reload()}>
        {(c) => {
          const status = claimStatus(c);
          const inv = c.invoice;
          return (
            <>
              <Facts
                items={[
                  ["Trạng thái", <Badge key="status" text={status.text} tone={status.tone} />],
                  ["Thương lái", c.customer.name],
                  ["Số điện thoại", c.customer.phoneNumber],
                  ["Hóa đơn", inv.code],
                  ["Vùng", inv.zoneName],
                  ["Ngày gửi", dateTime(c.sentAt)],
                ]}
              />
              {awaiting && !owner && <p className="form__hint">Chủ HTX là người trả lời khiếu nại này.</p>}
              {awaiting && owner && invoiceCancelled && (
                <p className="form__hint">Hóa đơn {inv.code} đã hủy nên không chấp nhận được khiếu nại. Bạn vẫn từ chối được, kèm lý do.</p>
              )}

              <ClaimAnswer statusId={c.statusId} offer={c.offer} response={c.response} forTrader={false} />

              {c.sendings.length > 0 && (
                <Section title="Báo cho thương lái">
                  <Rows>
                    {c.sendings.map((s, i) => {
                      const sent = sendingStatus(s);
                      return (
                        <Row
                          key={`${s.channel}-${i}`}
                          title={channelText(s)}
                          meta={[s.phoneNumber, s.deliveryStatusAt ? dateTime(s.deliveryStatusAt) : null].filter(Boolean).join(" · ")}
                          badge={<Badge text={sent.text} tone={sent.tone} />}
                        />
                      );
                    })}
                  </Rows>
                  {c.sendings.some((s) => s.deliveryStatusId === SENDING_NOT_SENT) && (
                    <p className="form__hint">Tin nhắn chưa tới được thương lái. Hãy gọi điện báo kết quả cho thương lái.</p>
                  )}
                </Section>
              )}

              <Section title="Nội dung khiếu nại">
                <div className="card claim-card">
                  <p className="claim-text">{c.description}</p>
                  <ClaimPhotos photos={c.photos} />
                </div>
              </Section>

              <Section title={`Hóa đơn ${inv.code}`}>
                <Facts
                  items={[
                    ["Ngày hóa đơn", date(inv.invoiceDate)],
                    ["Trạng thái hóa đơn", inv.statusId === INVOICE_CANCELLED ? <Badge key="inv" text="Đã hủy" tone="neutral" /> : "Đã hoàn tất"],
                    ["Tiền hàng", money(inv.subtotal)],
                    ["Chiết khấu", inv.discount ? money(inv.discount) : null],
                    ["Chi phí khác", inv.otherCharges ? money(inv.otherCharges) : null],
                    ["Đã giảm giá", inv.priceCutTotal ? money(inv.priceCutTotal) : null],
                    ["Tổng tiền", money(inv.total)],
                  ]}
                />
                <ClaimLines lines={inv.lines} />
                {inv.priceCuts.length > 0 && (
                  <Rows>
                    {inv.priceCuts.map((cut, i) => (
                      <Row key={`${cut.cutDate}-${i}`} title={`Giảm ${money(cut.amount)}`} meta={`${date(cut.cutDate)} · ${cut.reason}`} />
                    ))}
                  </Rows>
                )}
                {canOpenInvoice && (
                  <Actions>
                    <Button variant="secondary" size="large" onClick={() => navigate(`/manage/invoices/${inv.id}`)}>
                      Mở hóa đơn
                    </Button>
                  </Actions>
                )}
              </Section>
            </>
          );
        }}
      </Loadable>

      <AcceptClaimSheet visible={sheet === "accept" && awaiting} busy={busy} onClose={() => setSheet(null)} onConfirm={accept} />
      <ReasonSheet
        visible={sheet === "reject" && awaiting}
        title="Từ chối khiếu nại?"
        intro="Thương lái nhận lý do qua thông báo trong app và tin nhắn. Phản hồi đã gửi thì không sửa được."
        confirmText="Từ chối khiếu nại"
        required
        maxLength={CLAIM_LIMITS.note}
        danger
        busy={busy}
        onClose={() => setSheet(null)}
        onConfirm={reject}
      />
    </ManagePage>
  );
}
