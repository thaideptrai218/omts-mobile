import type { QualityClaimStatusFilter } from "@/features/claims/models/QualityClaim";
import { useAtomValue } from "jotai";
import { useCallback, useState } from "react";
import { useNavigate } from "zmp-ui";

import { Badge } from "@/components/Badge/Badge";
import { Chips } from "@/components/Chips/Chips";
import { ManagePage } from "@/components/ManagePage/ManagePage";
import PagedList from "@/components/PagedList/PagedList";
import { Row } from "@/components/Row/Row";
import { usePaged } from "@/hooks/usePaged";
import { dateTime } from "@/utils/format";
import { permissionsAtom } from "@/features/auth/state/authAtoms";
import { ClaimsGate } from "@/features/claims/components/ClaimsGate/ClaimsGate";
import { searchClaims } from "@/features/claims/services/claimService";
import { claimStatus, STATUS_FILTERS, STATUS_FOR } from "@/features/claims/utils/claimText";
import "@/features/claims/styles/claims.scss";

/**
 * Khiếu nại chất lượng của HTX (SCR-CLAIM-02): chờ phản hồi lên trước, rồi mới nhất trước. Chủ HTX trả lời; Quản lý vùng chỉ
 * xem khiếu nại của hóa đơn trong vùng mình (CLAIM-02, quyền QUALITY_CLAIMS).
 */
export default function QualityClaimsPage() {
  return (
    <ClaimsGate mode="staff">
      <CooperativeClaims />
    </ClaimsGate>
  );
}

function CooperativeClaims() {
  const navigate = useNavigate();
  const owner = useAtomValue(permissionsAtom)?.isCooperativeOwner ?? false;
  const [filter, setFilter] = useState<QualityClaimStatusFilter>("all");
  const fetchPage = useCallback((page: number) => searchClaims(STATUS_FOR[filter], page), [filter]);
  const list = usePaged(fetchPage);

  return (
    <ManagePage title="Khiếu nại chất lượng">
      {!owner && <p className="form__intro claim-intro">Bạn xem khiếu nại của hóa đơn trong vùng mình phụ trách. Chủ HTX là người trả lời thương lái.</p>}
      <Chips options={STATUS_FILTERS} value={filter} onChange={setFilter} />
      <PagedList
        list={list}
        unit="khiếu nại"
        emptyIcon="zi-chat"
        emptyTitle={filter === "all" ? "Chưa có khiếu nại nào" : "Không có khiếu nại nào ở trạng thái này"}
        emptyText={filter === "all" ? "Thương lái gửi khiếu nại theo hóa đơn từ app; khiếu nại mới sẽ hiện ở đây." : "Thử chọn trạng thái khác."}
      >
        {(c) => {
          const status = claimStatus(c);
          return (
            <Row
              key={c.id}
              title={c.customer?.name ?? `Hóa đơn ${c.invoice.code}`}
              meta={`Hóa đơn ${c.invoice.code} · gửi lúc ${dateTime(c.sentAt)}`}
              badge={<Badge text={status.text} tone={status.tone} />}
              onClick={() => navigate(`/manage/quality-claims/${c.id}`)}
            />
          );
        }}
      </PagedList>
    </ManagePage>
  );
}
