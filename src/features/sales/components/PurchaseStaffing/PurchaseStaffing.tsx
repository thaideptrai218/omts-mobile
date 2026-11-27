import type { PurchaseRequest } from "@/features/sales/models/PurchaseRequest";
import { useState } from "react";
import { Button } from "zmp-ui";
import FormError from "@/components/FormError/FormError";
import { Loadable } from "@/components/Loadable/Loadable";
import { Section } from "@/components/Section/Section";
import WorkDayPlanForm from "@/features/workforce/components/WorkDayPlanForm/WorkDayPlanForm";
import WorkDayPlanDetail from "@/features/workforce/components/WorkDayPlanDetail/WorkDayPlanDetail";
import { purchaseWorkPlan } from "@/features/workforce/services/workDayPlanService";
import { getPurchaseRequest, isAwaitingAnswer } from "@/features/sales/services/salesService";
import { useLoad } from "@/hooks/useLoad";

/**
 * Chủ HTX lập kế hoạch; người phụ trách đã nhận kế hoạch mới được mời nhân viên. Kế hoạch bọc trong `{ plan }` để "chưa có kế
 * hoạch" (null) khác "chưa tải xong" (dữ liệu null của useLoad). Tải lại lỗi thì giữ kế hoạch đang hiện, báo lỗi và cho thử lại.
 */
export default function PurchaseStaffing({ row, onUpdated }: { row: PurchaseRequest; onUpdated: (row: PurchaseRequest) => void }) {
  const loaded = useLoad(async () => ({ plan: await purchaseWorkPlan(row.id) }), [row.id, row.rowVersion]);
  const [editing, setEditing] = useState(false);
  const refresh = async () => {
    setEditing(false);
    await loaded.reload();
    onUpdated(await getPurchaseRequest(row.id));
  };
  const pending = isAwaitingAnswer(row.statusId);
  return <Section title="Kế hoạch ngày làm và nhân lực">
    <Loadable data={loaded.data} error={loaded.error} reload={() => void loaded.reload()}>{({ plan }) => <div className="form">
      {loaded.error && <>
        <FormError text={loaded.error} />
        <Button size="large" fullWidth variant="secondary" onClick={() => void loaded.reload()}>Thử lại</Button>
      </>}
      {plan ? <>
        {editing ? <WorkDayPlanForm existing={plan} purchase={row} onSaved={() => void refresh()} />
          : <WorkDayPlanDetail key={plan.id} plan={plan} onUpdated={value => { loaded.setData({ plan: value }); void getPurchaseRequest(row.id).then(onUpdated); }} />}
        {pending && !editing && plan.status === "DECLINED" && <Button size="large" fullWidth onClick={() => setEditing(true)}>Sửa và giao lại kế hoạch</Button>}
      </> : pending ? <WorkDayPlanForm purchase={row} onSaved={() => void refresh()} />
        : <p className="form__hint">Chưa có kế hoạch ngày làm.</p>}
    </div>}</Loadable>
  </Section>;
}
