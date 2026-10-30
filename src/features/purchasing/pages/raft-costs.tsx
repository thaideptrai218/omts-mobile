import { useNavigate } from "zmp-ui";

import { Empty, Loadable, ManagePage, Row, Rows, Section } from "@/shared/ui/ui";
import { useLoad } from "@/shared/hooks/use-load";
import { date, money } from "@/shared/lib/format";
import { listRaftMaterialCosts } from "@/features/purchasing/api/purchasing";

/**
 * Chi phí vật tư bè (phao, dây, lồng…) theo từng bè, tính từ các phiếu nhập đã hoàn tất trong năm nay có gắn bè,
 * đã trừ chiết khấu. Nhóm theo vùng nuôi.
 */
function RaftCostsPage() {
  const navigate = useNavigate();
  const { data, error, reload } = useLoad(listRaftMaterialCosts, []);

  return (
    <ManagePage title="Chi phí vật tư bè">
      <Loadable data={data} error={error} reload={() => void reload()}>
        {(rows) => {
          if (rows.length === 0) return <Empty icon="zi-list-2" title="Chưa có chi phí vật tư bè" text="Chi phí có khi phiếu nhập vật tư gắn bè được hoàn tất." />;
          const zones = [...new Map(rows.map((r) => [r.zone.id, r.zone])).values()];
          const total = rows.reduce((t, r) => t + r.materialCost, 0);
          return (
            <>
              <div className="summary">
                <div className="summary__cell">
                  <span className="summary__label">Tổng chi phí</span>
                  <span className="summary__value">{money(total)}</span>
                </div>
                <div className="summary__cell">
                  <span className="summary__label">Số bè</span>
                  <span className="summary__value">{rows.length}</span>
                </div>
              </div>
              {zones.map((z) => (
                <Section key={z.id} title={`${z.code ?? ""} ${z.name ?? ""}`.trim()}>
                  <Rows>
                    {rows
                      .filter((r) => r.zone.id === z.id)
                      .map((r) => (
                        <Row
                          key={r.raft.id}
                          title={`Bè ${r.raft.code ?? ""}`}
                          meta={r.receipts.map((x) => `${x.code} (${date(x.receiptDate)})`).join(", ")}
                          value={money(r.materialCost)}
                          // Bè chỉ có một phiếu thì mở thẳng phiếu đó.
                          onClick={r.receipts.length === 1 ? () => navigate(`/manage/purchases/${r.receipts[0].receiptId}`) : undefined}
                        />
                      ))}
                  </Rows>
                </Section>
              ))}
            </>
          );
        }}
      </Loadable>
    </ManagePage>
  );
}

export default RaftCostsPage;
