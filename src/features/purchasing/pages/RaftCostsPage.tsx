import { useNavigate } from "zmp-ui";

import { Badge } from "@/components/Badge/Badge";
import { Empty } from "@/components/Empty/Empty";
import { Loadable } from "@/components/Loadable/Loadable";
import { ManagePage } from "@/components/ManagePage/ManagePage";
import { Row } from "@/components/Row/Row";
import { Rows } from "@/components/Rows/Rows";
import { Section } from "@/components/Section/Section";
import { useLoad } from "@/hooks/useLoad";
import { date, money, num } from "@/utils/format";
import { MetaLines } from "@/features/purchasing/components/MetaLines/MetaLines";
import { listRaftMaterialCosts } from "@/features/purchasing/services/purchasingService";

/**
 * Chi phí vật tư bè (phao, dây, lồng…) theo từng bè trong kỳ, tính từ các lần dùng vật tư sửa bè (BR-FARM-05) theo giá mua
 * gần nhất của vật tư tới ngày dùng. Vật tư chưa từng mua thì tính 0 đ và được đếm riêng. Nhóm theo vùng nuôi; bấm một bè để
 * xem các lần dùng vật tư của bè đó.
 */
function RaftCostsPage() {
  const navigate = useNavigate();
  const { data, error, reload } = useLoad(() => listRaftMaterialCosts(), []);

  return (
    <ManagePage title="Chi phí vật tư bè">
      <Loadable data={data} error={error} reload={() => void reload()}>
        {(result) => {
          const rows = result.rafts;
          if (rows.length === 0) {
            return <Empty icon="zi-list-2" title="Chưa có chi phí vật tư bè" text={`Từ ${date(result.from)} đến ${date(result.to)} chưa có lần dùng vật tư sửa bè nào.`} />;
          }
          const zones = [...new Map(rows.map((r) => [r.zone.id, r.zone])).values()];
          return (
            <>
              <p className="form__hint">
                Từ {date(result.from)} đến {date(result.to)}
              </p>
              <div className="summary">
                <div className="summary__cell">
                  <span className="summary__label">Tổng chi phí</span>
                  <span className="summary__value">{money(result.materialCost)}</span>
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
                          meta={
                            <MetaLines
                              items={[
                                ["Chi phí", money(r.materialCost)],
                                ["Số lần dùng vật tư", num(r.usages.length)],
                                ...r.usages.slice(0, 3).map((u): [string, string] => [
                                  date(u.date),
                                  `${u.itemName} ${num(u.quantity, u.unit)}${u.unpriced ? " · chưa có giá" : ` · ${money(u.amount)}`}`,
                                ]),
                              ]}
                            />
                          }
                          badge={r.unpricedCount > 0 ? <Badge text={`${r.unpricedCount} vật tư chưa có giá`} tone="warning" /> : undefined}
                          onClick={() => navigate(`/manage/rafts/${r.raft.id}/material-usages`)}
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
