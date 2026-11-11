import type { WorkDayPlan } from "@/features/workforce/models/WorkDayPlan";
import { useAtomValue } from "jotai";
import { useEffect, useState } from "react";
import { Button, useLocation } from "zmp-ui";
import DateField from "@/components/DateField/DateField";
import FormError from "@/components/FormError/FormError";
import { Empty } from "@/components/Empty/Empty";
import { Loadable } from "@/components/Loadable/Loadable";
import { ManagePage } from "@/components/ManagePage/ManagePage";
import { Row } from "@/components/Row/Row";
import { Rows } from "@/components/Rows/Rows";
import { permissionsAtom } from "@/features/auth/state/authAtoms";
import WorkforceGate from "@/features/workforce/components/WorkforceGate/WorkforceGate";
import WorkDayPlanForm from "@/features/workforce/components/WorkDayPlanForm/WorkDayPlanForm";
import WorkDayPlanDetail, { WorkPlanBadge } from "@/features/workforce/components/WorkDayPlanDetail/WorkDayPlanDetail";
import { getWorkPlan, workPlans } from "@/features/workforce/services/workDayPlanService";
import { useLoad } from "@/hooks/useLoad";
import { todayIso } from "@/utils/format";

export default function WorkDayPlansPage() { return <WorkforceGate mode="manager"><Plans /></WorkforceGate>; }
function Plans() {
  const owner = useAtomValue(permissionsAtom)?.isCooperativeOwner;
  const [day, setDay] = useState(todayIso); const [selected, setSelected] = useState<WorkDayPlan | null>(null);
  const [creating, setCreating] = useState(false); const [editing, setEditing] = useState(false);
  const notificationPlanId = new URLSearchParams(useLocation().search).get("plan");
  const linked = useLoad(() => notificationPlanId ? getWorkPlan(notificationPlanId) : Promise.resolve(null), [notificationPlanId]);
  useEffect(() => { if (linked.data) { setSelected(linked.data); setDay(linked.data.workDate); } }, [linked.data]);
  const list = useLoad(() => workPlans(day, day), [day]);
  const saved = (plan: WorkDayPlan) => { setCreating(false); setEditing(false); setSelected(plan); void list.reload(); };
  /** "Quay lại" lùi một bước trên cùng màn: đang sửa về chi tiết, đang tạo và chi tiết về danh sách. */
  const goBack = () => {
    if (editing) { setEditing(false); return; }
    if (creating) setCreating(false); else setSelected(null);
    void list.reload();
  };
  const footer = creating || editing ? undefined
    : selected ? (owner && selected.status === "DECLINED" && !selected.purchaseRequestId ? <Button size="large" fullWidth onClick={() => setEditing(true)}>Sửa và giao lại kế hoạch</Button> : undefined)
    : owner ? <Button size="large" fullWidth onClick={() => setCreating(true)}>Tạo kế hoạch ngày làm</Button> : undefined;
  return <ManagePage title="Kế hoạch ngày làm" footer={footer} onBack={selected || creating || editing ? goBack : undefined}>
    <FormError text={linked.error} />
    {creating || editing ? <WorkDayPlanForm existing={editing && selected ? selected : undefined} onSaved={saved} /> : selected ? <>
      <WorkDayPlanDetail key={selected.id} plan={selected} onUpdated={saved} />
      {owner && selected.status === "DECLINED" && selected.purchaseRequestId && <div className="button-stack"><p className="form__hint">Mở yêu cầu mua tương ứng để sửa và giao lại kế hoạch.</p></div>}
    </> : <>
      <DateField label="Ngày làm việc" value={day} onChange={setDay} />
      <div className="button-stack"><p className="form__hint">{owner ? "Lập lịch thu hàu, sửa bè… rồi chọn tự phụ trách hoặc giao quản lý." : "Chỉ các kế hoạch giao cho bạn trong vùng được cấp quyền mới hiển thị."}</p></div>
      <Loadable data={list.data} error={list.error} reload={() => void list.reload()}>{items => items.length ? <Rows>{items.map(p => <Row key={p.id} title={`${p.jobName} · bè ${p.raftCode}`} meta={`Phụ trách: ${p.responsibleName}${p.requestCode ? ` · ${p.requestCode}` : ""}`} badge={<WorkPlanBadge status={p.status} />} onClick={() => setSelected(p)} />)}</Rows> : <Empty title="Chưa có kế hoạch trong ngày" />}</Loadable>
      <div className="button-stack"><Button fullWidth variant="secondary" size="large" onClick={() => void list.reload()}>Tải lại</Button></div>
    </>}
  </ManagePage>;
}
