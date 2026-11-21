import { useAtomValue } from "jotai";
import { useEffect, useRef } from "react";
import { Button, useNavigate } from "zmp-ui";

import { Badge } from "@/components/Badge/Badge";
import { ManagePage } from "@/components/ManagePage/ManagePage";
import PagedList from "@/components/PagedList/PagedList";
import { Row } from "@/components/Row/Row";
import { usePaged } from "@/hooks/usePaged";
import { date } from "@/utils/format";
import { permissionsAtom, sessionAtom } from "@/features/auth/state/authAtoms";
import { ClaimsGate, ClaimsLoading } from "@/features/claims/components/ClaimsGate/ClaimsGate";
import { myClaims } from "@/features/claims/services/claimService";
import { claimStatus } from "@/features/claims/utils/claimText";

/**
 * Lối vào của chức năng "Khiếu nại" trên menu (`/account/claims`), dùng chung cho hai bên: thương lái thấy khiếu nại của
 * mình (CLAIM-01); Chủ HTX và nhân viên được chuyển sang danh sách khiếu nại của HTX (CLAIM-02, SCR-CLAIM-02).
 */
export default function ClaimsPage() {
  const navigate = useNavigate();
  const session = useAtomValue(sessionAtom);
  const p = useAtomValue(permissionsAtom);
  const internal = !!session && !!p && p.accountId === session.accountId && p.subjectType !== "Trader";
  // Màn cũ còn trên màn hình thêm một nhịp khi chuyển trang: chỉ chuyển một lần.
  const moved = useRef(false);

  useEffect(() => {
    if (!internal || moved.current) return;
    moved.current = true;
    navigate("/manage/quality-claims", { replace: true, animate: false });
  }, [internal, navigate]);

  if (internal) return <ClaimsLoading />;
  return (
    <ClaimsGate mode="trader">
      <MyClaims />
    </ClaimsGate>
  );
}

/** Khiếu nại của thương lái, mới nhất trước (BR-ACCOUNT-04: chỉ của hồ sơ gắn với tài khoản). */
function MyClaims() {
  const navigate = useNavigate();
  const list = usePaged(myClaims);

  return (
    <ManagePage
      title="Khiếu nại của tôi"
      footer={
        <Button fullWidth size="large" onClick={() => navigate("/account/claims/new")}>
          Gửi khiếu nại mới
        </Button>
      }
    >
      <PagedList
        list={list}
        unit="khiếu nại"
        emptyIcon="zi-chat"
        emptyTitle="Chưa có khiếu nại nào"
        emptyText="Hàng nhận về có vấn đề thì gửi khiếu nại theo hóa đơn, kèm ảnh. HTX sẽ kiểm tra và trả lời bạn."
      >
        {(c) => {
          const status = claimStatus(c);
          return (
            <Row
              key={c.id}
              title={`Hóa đơn ${c.invoice.code}`}
              meta={`${c.code} · gửi ngày ${date(c.sentAt)}`}
              badge={<Badge text={status.text} tone={status.tone} />}
              onClick={() => navigate(`/account/claims/${c.id}`)}
            />
          );
        }}
      </PagedList>
    </ManagePage>
  );
}
