import { useNavigate } from "zmp-ui";

import { Badge } from "@/components/Badge/Badge";
import { Loadable } from "@/components/Loadable/Loadable";
import { Row } from "@/components/Row/Row";
import { Rows } from "@/components/Rows/Rows";
import { Section } from "@/components/Section/Section";
import { harvestPlansOfOrder } from "@/features/farming/services/harvestPlanService";
import { planStatusLabel, progressText } from "@/features/farming/utils/harvestPlanText";
import { useLoad } from "@/hooks/useLoad";
import { dateTime } from "@/utils/format";

/**
 * Kế hoạch thu hoạch của đơn đã nhận: thấy ngay bè nào đã thu (thành lô chờ cân) và kế hoạch đã xong chưa. Chủ HTX lập kế hoạch trên
 * bản web; chưa có thì nhắc việc đó.
 */
export default function OrderHarvestPlans({ salesOrderId, salesOrderCode }: { salesOrderId: string; salesOrderCode: string | null }) {
  const navigate = useNavigate();
  const plans = useLoad(() => harvestPlansOfOrder(salesOrderId), [salesOrderId]);
  return (
    <Section title="Kế hoạch thu hoạch">
      <Loadable data={plans.data} error={plans.error} reload={() => void plans.reload()}>
        {(page) =>
          page.items.length === 0 ? (
            <p className="form__hint">Chưa có kế hoạch thu hoạch cho đơn {salesOrderCode ?? ""}. Chủ HTX lập và giao kế hoạch trên bản web.</p>
          ) : (
            <Rows>
              {page.items.map((p) => {
                const status = planStatusLabel(p.statusId);
                return (
                  <Row
                    key={p.id}
                    title={`${p.code} · ${dateTime(p.plannedAt)}`}
                    meta={`Bè ${p.raftCodes.join(", ")} · ${progressText(p.progress)}`}
                    badge={<Badge text={status.text} tone={status.tone} />}
                    onClick={() => navigate(`/manage/harvest-plans/${p.id}`)}
                  />
                );
              })}
            </Rows>
          )
        }
      </Loadable>
    </Section>
  );
}
