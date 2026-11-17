import { Button, useNavigate, useParams } from "zmp-ui";

import { Badge } from "@/components/Badge/Badge";
import { Facts } from "@/components/Facts/Facts";
import { Loadable } from "@/components/Loadable/Loadable";
import { ManagePage } from "@/components/ManagePage/ManagePage";
import { Section } from "@/components/Section/Section";
import { useLoad } from "@/hooks/useLoad";
import { date, dateTime, money } from "@/utils/format";
import { ClaimAnswer } from "@/features/claims/components/ClaimAnswer/ClaimAnswer";
import { ClaimLines } from "@/features/claims/components/ClaimLines/ClaimLines";
import { ClaimPhotos } from "@/features/claims/components/ClaimPhotos/ClaimPhotos";
import { ClaimsGate } from "@/features/claims/components/ClaimsGate/ClaimsGate";
import { myClaim } from "@/features/claims/services/claimService";
import { claimStatus } from "@/features/claims/utils/claimText";
import "@/features/claims/styles/claims.scss";

/** Một khiếu nại của thương lái: trạng thái, phản hồi của HTX, nội dung và ảnh đã gửi. Màn mà thông báo MSG-CLAIM-02 mở ra. */
export default function ClaimDetailPage() {
  return (
    <ClaimsGate mode="trader">
      <MyClaimDetail />
    </ClaimsGate>
  );
}

function MyClaimDetail() {
  const { id = "" } = useParams();
  const navigate = useNavigate();
  const claim = useLoad(() => myClaim(id), [id]);
  const loaded = claim.data;

  return (
    <ManagePage
      title={loaded ? `Khiếu nại ${loaded.code}` : "Khiếu nại"}
      footer={
        loaded ? (
          <Button fullWidth size="large" variant="secondary" onClick={() => navigate(`/account/invoices?open=${encodeURIComponent(loaded.invoice.id)}`)}>
            Xem hóa đơn {loaded.invoice.code}
          </Button>
        ) : undefined
      }
    >
      <Loadable data={loaded} error={claim.error} reload={() => void claim.reload()}>
        {(c) => {
          const status = claimStatus(c);
          return (
            <>
              <Facts
                items={[
                  ["Trạng thái", <Badge key="status" text={status.text} tone={status.tone} />],
                  ["Hóa đơn", c.invoice.code],
                  ["Ngày hóa đơn", date(c.invoiceDate)],
                  ["Tổng tiền hóa đơn", money(c.invoiceTotal)],
                  ["Ngày gửi", dateTime(c.sentAt)],
                ]}
              />
              <ClaimAnswer statusId={c.statusId} offer={c.offer} response={c.response} forTrader />
              <Section title="Nội dung đã gửi">
                <div className="card claim-card">
                  <p className="claim-text">{c.description}</p>
                  <ClaimPhotos photos={c.photos} />
                </div>
              </Section>
              <Section title="Hàng trong hóa đơn">
                <ClaimLines lines={c.lines} />
              </Section>
            </>
          );
        }}
      </Loadable>
    </ManagePage>
  );
}
