import type { HarvestPlanListItem, HarvestPlanOrder, HarvestPlanZone } from "@/features/farming/models/HarvestPlan";
import { useAtomValue } from "jotai";
import { useNavigate } from "zmp-ui";

import { Badge } from "@/components/Badge/Badge";
import { Empty } from "@/components/Empty/Empty";
import { Loadable } from "@/components/Loadable/Loadable";
import { ManagePage } from "@/components/ManagePage/ManagePage";
import { Row } from "@/components/Row/Row";
import { Rows } from "@/components/Rows/Rows";
import { Section } from "@/components/Section/Section";
import { permissionsAtom } from "@/features/auth/state/authAtoms";
import { assignedHarvestPlans, listHarvestPlans, PLAN_STATUS } from "@/features/farming/services/harvestPlanService";
import { executorText, planStatusLabel, progressText } from "@/features/farming/utils/harvestPlanText";
import { useLoad } from "@/hooks/useLoad";
import { dateTime } from "@/utils/format";

type PlanRow = Pick<HarvestPlanListItem, "id" | "code" | "statusId" | "executor" | "plannedAt" | "progress"> & {
  zones: HarvestPlanZone[];
  orders: HarvestPlanOrder[];
  raftCodes: string[];
};

const ordersText = (orders: HarvestPlanOrder[]) =>
  orders.length ? `Đơn ${orders.map((o) => (o.customer ? `${o.code} (${o.customer.name})` : o.code)).join(", ")}` : null;

function PlanRows({ plans }: { plans: PlanRow[] }) {
  const navigate = useNavigate();
  return (
    <Rows>
      {plans.map((p) => {
        const status = planStatusLabel(p.statusId);
        return (
          <Row
            key={p.id}
            title={`${p.code} · ${dateTime(p.plannedAt)}`}
            meta={[
              `Bè ${p.raftCodes.join(", ")} · vùng ${p.zones.map((z) => z.code).join(", ")}`,
              ordersText(p.orders),
              `${executorText(p.executor)} · ${progressText(p.progress)}`,
            ].filter(Boolean).join(" · ")}
            badge={<Badge text={status.text} tone={status.tone} />}
            onClick={() => navigate(`/manage/harvest-plans/${p.id}`)}
          />
        );
      })}
    </Rows>
  );
}

/**
 * Kế hoạch thu hoạch (KHT) trên điện thoại: chỉ phần thực hiện (chốt 26/11/2026). Chủ HTX lập và giao kế hoạch trên web; ở đây người
 * thực hiện nhận kế hoạch, ghi nhận thu từng bè, rồi bàn giao. Lô vừa thu sang "Cân tại cảng" để cân từng lồng. Chủ HTX thấy thêm các
 * kế hoạch Quản lý vùng đã bàn giao để bấm hoàn thành.
 */
export default function HarvestPlansPage() {
  const permissions = useAtomValue(permissionsAtom);
  const owner = !!permissions?.isCooperativeOwner;
  const active = useLoad(assignedHarvestPlans, []);
  const handedOver = useLoad(() => (owner ? listHarvestPlans([PLAN_STATUS.handedOver]) : Promise.resolve(null)), [owner]);

  return (
    <ManagePage title="Kế hoạch thu hoạch">
      <p className="form__intro">
        Chủ HTX lập và giao kế hoạch trên bản web. Ở đây bạn nhận kế hoạch, ghi nhận thu từng bè; mỗi bè thu xong thành một lô chờ cân ở "Cân tại cảng".
      </p>
      <Section title="Đang thực hiện">
        <Loadable data={active.data} error={active.error} reload={() => void active.reload()}>
          {({ plans }) =>
            plans.length === 0 ? (
              <Empty icon="zi-calendar" title="Chưa có kế hoạch thu hoạch nào cần làm" text="Kế hoạch được giao cho vùng của bạn sẽ hiện ở đây." />
            ) : (
              <PlanRows plans={plans.map((p) => ({ ...p, raftCodes: p.lines.map((l) => l.raftCode) }))} />
            )
          }
        </Loadable>
      </Section>
      {owner && (
        <Section title="Đã bàn giao, chờ hoàn thành">
          <Loadable data={handedOver.data} error={handedOver.error} reload={() => void handedOver.reload()}>
            {(page) =>
              !page || page.items.length === 0 ? (
                <p className="form__hint">Không có kế hoạch nào đang chờ Chủ HTX hoàn thành.</p>
              ) : (
                <PlanRows plans={page.items} />
              )
            }
          </Loadable>
        </Section>
      )}
    </ManagePage>
  );
}
