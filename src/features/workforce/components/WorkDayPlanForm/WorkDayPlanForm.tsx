import type { PurchaseRequest } from "@/features/sales/models/PurchaseRequest";
import type { WorkDayPlan } from "@/features/workforce/models/WorkDayPlan";
import { useEffect, useRef, useState } from "react";
import { Button, Input, Select } from "zmp-ui";
import DateField from "@/components/DateField/DateField";
import FormError from "@/components/FormError/FormError";
import { Loadable } from "@/components/Loadable/Loadable";
import { Section } from "@/components/Section/Section";
import { listRafts, zoneLookup } from "@/features/farming/services/farmService";
import { workLookups } from "@/features/workforce/services/workforceService";
import { saveWorkPlan, workPlanResponsibles } from "@/features/workforce/services/workDayPlanService";
import { pickupDateError, wholeCages } from "@/features/sales/services/salesService";
import { useLoad } from "@/hooks/useLoad";
import { errorText } from "@/utils/errorText";
import { todayIso } from "@/utils/format";
import { newOperationId } from "@/utils/operationId";

export default function WorkDayPlanForm({ purchase, existing, onSaved }: { purchase?: PurchaseRequest; existing?: WorkDayPlan; onSaved: (plan: WorkDayPlan) => void }) {
  const [zone, setZone] = useState(existing?.zoneId ?? "");
  const [raft, setRaft] = useState(existing?.raftId ?? "");
  const [job, setJob] = useState(existing?.jobTypeId ?? "");
  const [responsible, setResponsible] = useState(existing?.responsibleAccountId ?? "");
  const [day, setDay] = useState(existing?.workDate ?? (purchase && purchase.pickupDate >= todayIso() ? purchase.pickupDate : todayIso()));
  const [pickup, setPickup] = useState(purchase?.staffing?.pickupDate ?? day);
  const [cages, setCages] = useState(String(purchase?.staffing?.cages ?? purchase?.requestedCages ?? ""));
  const [capacity, setCapacity] = useState(String(purchase?.staffing?.cagesPerEmployeePerDay ?? 20));
  const [note, setNote] = useState(existing?.note ?? "");
  const [operationId] = useState(newOperationId);
  const [busy, setBusy] = useState(false); const lock = useRef(false);
  const [error, setError] = useState("");
  const choices = useLoad(async () => ({ zones: await zoneLookup(), jobs: (await workLookups()).jobs }), []);
  const rafts = useLoad(() => zone ? listRafts(zone, 101) : Promise.resolve([]), [zone]);
  const leads = useLoad(() => raft ? workPlanResponsibles(raft) : Promise.resolve([]), [raft]);
  useEffect(() => { if (!zone && choices.data?.zones.length) setZone(choices.data.zones[0].id); }, [zone, choices.data]);
  const save = async () => {
    if (lock.current) return;
    if (!raft || !job || !responsible) { setError("Chọn bè, loại việc và người phụ trách."); return; }
    const dateError = pickupDateError(day);
    if (dateError) { setError(dateError); return; }
    const count = wholeCages(cages); const perPerson = wholeCages(capacity);
    if (purchase && (!count || count > purchase.requestedCages || !perPerson || pickup < day || pickupDateError(pickup))) {
      setError("Kiểm tra số lồng, năng suất và ngày nhận hàng (không trước ngày làm)."); return;
    }
    lock.current = true; setBusy(true); setError("");
    try {
      onSaved(await saveWorkPlan({ raftId: raft, jobTypeId: job, workDate: day, responsibleAccountId: responsible,
        clientOperationId: operationId, note: note.trim(), rowVersion: existing?.rowVersion,
        ...(purchase ? { purchaseRequestId: purchase.id, cages: count!, cagesPerEmployeePerDay: perPerson!, pickupDate: pickup } : {}) }, existing?.id));
    } catch (e) { setError(errorText(e)); } finally { lock.current = false; setBusy(false); }
  };
  return <div>
    <h3 className="block__title">{existing ? "Sửa kế hoạch ngày làm" : "Tạo kế hoạch ngày làm"}</h3>
    {purchase && <p>{purchase.code} · {purchase.productName}</p>}
    <Section step={1} title="Ngày, nơi làm và loại việc"><div className="card form">
      <DateField label="Ngày làm việc (bắt buộc)" value={day} disabled={busy} onChange={setDay} />
      <Loadable data={choices.data} error={choices.error} reload={() => void choices.reload()}>{data => <>
        <Select label="Vùng làm việc" value={zone} disabled={busy} closeOnSelect onChange={v => { setZone(String(v)); setRaft(""); setResponsible(""); }}>
          {data.zones.map(z => <Select.Option key={z.id} value={z.id} title={z.name ?? z.code ?? "Vùng nuôi"} />)}
        </Select>
        <Select label="Loại công việc (bắt buộc)" placeholder="Chọn loại công việc" value={job} disabled={busy} closeOnSelect onChange={v => setJob(String(v))}>
          {data.jobs.map(j => <Select.Option key={j.id} value={j.id} title={j.name} />)}
        </Select>
        {!data.jobs.length && <p className="form__hint">Thêm loại việc như thu hàu, sửa bè trong Cài đặt chấm công.</p>}
      </>}</Loadable>
      <Loadable data={rafts.data} error={rafts.error} reload={() => void rafts.reload()}>{items => <Select label="Bè làm việc (bắt buộc)" placeholder="Chọn bè" value={raft} disabled={busy} closeOnSelect onChange={v => { setRaft(String(v)); setResponsible(""); }}>
        {items.map(r => <Select.Option key={r.id} value={r.id} title={r.code ?? ""} />)}
      </Select>}</Loadable>
    </div></Section>
    <Section step={2} title="Người phụ trách"><div className="card form">
      {raft ? <Loadable data={leads.data} error={leads.error} reload={() => void leads.reload()}>{items => <Select label="Người phụ trách phân công (bắt buộc)" placeholder="Chọn người phụ trách" value={responsible} disabled={busy} closeOnSelect onChange={v => setResponsible(String(v))}>
        {items.map(p => <Select.Option key={p.id} value={p.id} title={p.isSelf ? `Tôi tự phụ trách · ${p.name}` : `Giao quản lý · ${p.name}`} />)}
      </Select>}</Loadable> : <p className="form__hint">Chọn bè ở mục 1 để xem người phụ trách.</p>}
      <p className="form__hint">Tự phụ trách: bạn phân công nhân viên. Giao quản lý: chờ người đó nhận kế hoạch rồi họ mới phân công.</p>
    </div></Section>
    {purchase && <Section step={3} title="Số lồng và ngày nhận hàng"><div className="card form">
      <Input label="Số lồng dự kiến nhận (bắt buộc)" inputMode="numeric" value={cages} disabled={busy} onChange={e => setCages(e.target.value)} />
      <Input label="Năng suất, lồng/người/ngày (bắt buộc)" inputMode="numeric" value={capacity} disabled={busy} onChange={e => setCapacity(e.target.value)} />
      <DateField label="Ngày nhận hàng (bắt buộc)" value={pickup} disabled={busy} onChange={setPickup} />
    </div></Section>}
    <Section step={purchase ? 4 : 3} title="Nội dung và gửi kế hoạch"><div className="card form">
      <Input.TextArea label="Nội dung kế hoạch" value={note} maxLength={500} disabled={busy} onChange={e => setNote(e.target.value)} />
      <FormError text={error} />
      {(!raft || !job || !responsible) && <p className="form__hint">Chọn đủ bè, loại công việc và người phụ trách để gửi kế hoạch.</p>}
      <Button fullWidth size="large" loading={busy} disabled={busy || !raft || !job || !responsible} onClick={() => void save()}>{existing ? "Gửi lại kế hoạch" : "Lưu và gửi kế hoạch"}</Button>
    </div></Section>
  </div>;
}
