import { useCallback, useState } from "react";
import { useNavigate } from "zmp-ui";

import { Badge } from "@/components/Badge/Badge";
import { Chips } from "@/components/Chips/Chips";
import { ManagePage } from "@/components/ManagePage/ManagePage";
import PagedList from "@/components/PagedList/PagedList";
import { Row } from "@/components/Row/Row";
import { listWeighingLots } from "@/features/sales/services/lotWeighingService";
import { usePaged } from "@/hooks/usePaged";
import { dateTime, num } from "@/utils/format";

type Filter = "waiting" | "weighed";

const FILTERS: [Filter, string][] = [
  ["waiting", "Chờ cân"],
  ["weighed", "Đã cân"],
];

/**
 * Cân tại cảng (chốt 24/11/2026, OMTS-227): mỗi lần thu hàng cho một đơn là một lô thu hoạch. Chọn lô để cân từng lồng rồi hoàn tất; lô đã cân vẫn mở lại
 * được để sửa một lồng cho tới khi lô đóng. Backend chỉ trả lô trong vùng người dùng phụ trách.
 */
export default function WeighingsPage() {
  const navigate = useNavigate();
  const [filter, setFilter] = useState<Filter>("waiting");
  const fetchPage = useCallback((page: number) => listWeighingLots(filter === "weighed", page), [filter]);
  const list = usePaged(fetchPage);

  return (
    <ManagePage title="Cân tại cảng">
      <p className="form__intro">Chọn lô vừa thu cho đơn của thương lái. Cân từng lồng, mỗi lồng lưu ngay; cân xong bấm "Hoàn tất" để chốt tổng số kg của lô.</p>
      <Chips options={FILTERS} value={filter} onChange={setFilter} />
      <PagedList
        list={list}
        unit="lô"
        emptyIcon="zi-inbox"
        emptyTitle={filter === "waiting" ? "Không có lô nào chờ cân" : "Chưa có lô nào đã cân"}
        emptyText={filter === "waiting" ? "Lô thu hoạch ghi theo kế hoạch của đơn sẽ hiện ở đây để cân." : undefined}
      >
        {(lot) => (
          <Row
            key={lot.id}
            title={`Lô ${lot.lotCode}`}
            meta={[
              `Bè ${lot.raftCode} · vùng ${lot.zoneCode}`,
              lot.harvestPlan ? `kế hoạch ${lot.harvestPlan.code}` : null,
              `${num(lot.cageCount, "lồng")} lúc thu`,
              lot.weighedKg !== null ? `cân ${num(lot.weighedKg, "kg")}` : `ước ${num(lot.estimatedKg, "kg")}`,
              `thu lúc ${dateTime(lot.harvestedAt)}`,
            ].filter(Boolean).join(" · ")}
            badge={lot.weighedKg === null ? <Badge text="Chờ cân" tone="warning" /> : <Badge text={lot.status} tone="neutral" />}
            onClick={() => navigate(`/manage/weighings/${lot.id}`)}
          />
        )}
      </PagedList>
    </ManagePage>
  );
}
