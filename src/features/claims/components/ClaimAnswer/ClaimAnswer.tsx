import type { QualityClaimOffer, QualityClaimResponse } from "@/features/claims/models/QualityClaim";

import { Section } from "@/components/Section/Section";
import { dateTime } from "@/utils/format";
import { CLAIM_STATUS, OFFER_TEXT } from "@/features/claims/utils/claimText";

/**
 * Phản hồi của HTX (CLAIM-02, BR-CLAIM-02): chưa trả lời, chấp nhận kèm cách xử lý đề xuất, hoặc từ chối kèm lý do.
 * Chấp nhận không đổi hóa đơn hay công nợ: trả hàng (CLAIM-03) hoặc giảm giá (SALE-07) làm sau khi thương lái đồng ý.
 */
export function ClaimAnswer({
  statusId,
  offer,
  response,
  forTrader,
}: {
  statusId: number;
  offer: QualityClaimOffer | null;
  response: QualityClaimResponse | null;
  forTrader: boolean;
}) {
  if (statusId === CLAIM_STATUS.awaiting) {
    return (
      <Section title="Phản hồi của HTX">
        <p className="card claim-card__meta">
          {forTrader
            ? "HTX chưa trả lời. Bạn sẽ nhận thông báo và tin nhắn khi HTX phản hồi."
            : "Chưa phản hồi. Quản lý vùng kiểm tra hàng, rồi Chủ HTX trả lời thương lái."}
        </p>
      </Section>
    );
  }
  const accepted = statusId === CLAIM_STATUS.accepted;
  return (
    <Section title="Phản hồi của HTX">
      <div className="card claim-card">
        <p className="claim-card__title">{accepted ? "Chấp nhận khiếu nại" : "Không chấp nhận khiếu nại"}</p>
        {accepted && offer && (
          <p>
            Cách xử lý đề xuất: <strong>{OFFER_TEXT[offer]}</strong>
          </p>
        )}
        {response?.note && (
          <p className="claim-text">
            {accepted ? "Lời nhắn" : "Lý do"}: {response.note}
          </p>
        )}
        {accepted && (
          <p className="claim-card__meta">
            {forTrader
              ? "Vui lòng liên hệ HTX để thống nhất. Hóa đơn và công nợ chỉ thay đổi khi HTX lập phiếu trả hàng hoặc giảm giá cho hóa đơn."
              : "Hóa đơn và công nợ chưa thay đổi. Khi thương lái đồng ý, lập phiếu trả hàng hoặc giảm giá cho hóa đơn này."}
          </p>
        )}
        {response && <p className="claim-card__meta">Trả lời lúc {dateTime(response.respondedAt)}</p>}
      </div>
    </Section>
  );
}
