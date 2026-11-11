import type { PurchaseRequest } from "@/features/sales/models/PurchaseRequest";
import { useState } from "react";
import { Button } from "zmp-ui";
import { Loadable } from "@/components/Loadable/Loadable";
import { Section } from "@/components/Section/Section";
import WorkDayPlanForm from "@/features/workforce/components/WorkDayPlanForm/WorkDayPlanForm";
import WorkDayPlanDetail from "@/features/workforce/components/WorkDayPlanDetail/WorkDayPlanDetail";
import { purchaseWorkPlan } from "@/features/workforce/services/workDayPlanService";
import { getPurchaseRequest, isAwaitingAnswer } from "@/features/sales/services/salesService";
import { useLoad } from "@/hooks/useLoad";

/** Chủ HTX lập kế hoạch; người phụ trách đã nhận kế hoạch mới được mời nhân viên. */
export default function PurchaseStaffing({ row, onUpdated }: { row: PurchaseRequest; onUpdated: (row: PurchaseRequest) => void }) {
  const [loaded, setLoaded] = useState(false);
  const plan = useLoad(async () => { const value = await purchaseWorkPlan(row.id); setLoaded(true); return value; }, [row.id, row.rowVersion]);
  const [editing, setEditing] = useState(false);
  const refresh = async () => {
    setEditing(false);
    await plan.reload();
    onUpdated(await getPurchaseRequest(row.id));
  };
  const pending = isAwaitingAnswer(row.statusId);
  return <Section title="Kế hoạch ngày làm và nhân lực">
    {plan.error ? <Loadable data={plan.data} error={plan.error} reload={() => void plan.reload()}>{() => null}</Loadable>
      : !loaded ? <div className="loading" role="status" aria-busy><p className="loading__text">Đang tải...</p><div className="skeleton skeleton--form" aria-hidden /></div> : plan.data ? <>
        {editing ? <WorkDayPlanForm existing={plan.data} purchase={row} onSaved={() => void refresh()} />
          : <WorkDayPlanDetail key={plan.data.id} plan={plan.data} onUpdated={value => { plan.setData(value); void getPurchaseRequest(row.id).then(onUpdated); }} />}
        {pending && !editing && plan.data.status === "DECLINED" && <Button size="large" fullWidth onClick={() => setEditing(true)}>Sửa và giao lại kế hoạch</Button>}
      </> : plan.data === null && pending ? <WorkDayPlanForm purchase={row} onSaved={() => void refresh()} />
        : <p className="form__hint">Chưa có kế hoạch ngày làm.</p>}
  </Section>;
}
