import type { TraderWeighingRow } from "@/features/sales/models/LotWeighing";
import { useCallback } from "react";
import { useNavigate } from "zmp-ui";

import { Badge } from "@/components/Badge/Badge";
import { ManagePage } from "@/components/ManagePage/ManagePage";
import PagedList from "@/components/PagedList/PagedList";
import { Row } from "@/components/Row/Row";
import { myWeighingLots } from "@/features/sales/services/lotWeighingService";
import { usePaged } from "@/hooks/usePaged";
import { dateTime, num } from "@/utils/format";

/** Nhãn việc của một lô: có chữ, không chỉ dựa vào màu. */
function rowBadge(row: TraderWeighingRow) {
  if (row.agreed) return <Badge text="Đã đồng ý" tone="success" />;
  if (row.weighedKg === null) return <Badge text="Chờ HTX hoàn tất" tone="neutral" />;
  if (row.needsAgreement) return <Badge text="Cần bạn đồng ý" tone="warning" />;
  return <Badge text={row.status} tone="neutral" />;
}

/**
 * Phiếu cân của thương lái (chốt 24/11/2026, OMTS-227): các lô thu cho đơn của mình. Thương lái cân từng lồng cùng HTX ở cảng, đối chiếu với số
 * HTX, rồi đồng ý số cân sau khi HTX hoàn tất; chưa đồng ý thì HTX chưa lập được hóa đơn cho lô. Backend chỉ trả lô của chính thương lái.
 */
export default function MyWeighingsPage() {
  const navigate = useNavigate();
  const fetchPage = useCallback((page: number) => myWeighingLots(page), []);
  const list = usePaged(fetchPage);

  return (
    <ManagePage title="Phiếu cân">
      <p className="form__intro">Chọn lô HTX đang thu cho đơn của bạn. Cân từng lồng cùng HTX ở cảng; HTX hoàn tất phiếu cân xong thì bạn bấm "Đồng ý số cân".</p>
      <PagedList
        list={list}
        unit="lô"
        emptyIcon="zi-file"
        emptyTitle="Chưa có lô nào để cân"
        emptyText="Khi HTX thu hàu cho đơn của bạn, lô sẽ hiện ở đây để bạn cân cùng và đồng ý số cân."
      >
        {(row) => (
          <Row
            key={row.lotId}
            title={`Lô ${row.lotCode}`}
            meta={[
              row.orderCodes.length ? `đơn ${row.orderCodes.join(", ")}` : null,
              row.productName,
              row.weighedKg !== null ? `HTX chốt ${num(row.weighedKg, "kg")}` : `HTX đã cân ${num(row.cageCount, "lồng")}, ${num(row.cagesKg, "kg")}`,
              `bạn cân ${num(row.traderCageCount, "lồng")}, ${num(row.traderCagesKg, "kg")}`,
              `thu lúc ${dateTime(row.harvestedAt)}`,
            ].filter(Boolean).join(" · ")}
            badge={rowBadge(row)}
            onClick={() => navigate(`/account/weighings/${row.lotId}`)}
          />
        )}
      </PagedList>
    </ManagePage>
  );
}
