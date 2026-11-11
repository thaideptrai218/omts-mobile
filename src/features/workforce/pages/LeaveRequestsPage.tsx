import type { EmployeeRequest } from "@/features/workforce/models/EmployeeRequest";
import type { ReactNode } from "react";
import { useAtomValue } from "jotai";
import { useEffect, useState } from "react";
import { Button, Input, Select, Sheet } from "zmp-ui";
import FormError from "@/components/FormError/FormError";
import { Badge } from "@/components/Badge/Badge";
import { Chips } from "@/components/Chips/Chips";
import { Empty } from "@/components/Empty/Empty";
import { Facts } from "@/components/Facts/Facts";
import { Loadable } from "@/components/Loadable/Loadable";
import { ManagePage } from "@/components/ManagePage/ManagePage";
import WorkforceGate from "@/features/workforce/components/WorkforceGate/WorkforceGate";
import { useLoad } from "@/hooks/useLoad";
import { errorText } from "@/utils/errorText";
import { dateTime } from "@/utils/format";
import { listRafts, zoneLookup } from "@/features/farming/services/farmService";
import { listRequests, reviewRequest, workLookups } from "@/features/workforce/services/workforceService";
import { REQUEST_STATUS, REQUEST_TYPE_TEXT, requestDays, requestStatus } from "@/features/workforce/utils/workText";
import { isApiError } from "@/services/errors";
import { permissionsAtom } from "@/features/auth/state/authAtoms";
import "@/features/workforce/styles/workforce.scss";

type Filter = "all" | keyof typeof REQUEST_STATUS;
const FILTERS: [Filter, string][] = [["all", "Tất cả"], ["awaiting", "Chờ duyệt"], ["approved", "Đã duyệt"], ["rejected", "Từ chối"], ["cancelled", "Đã hủy"]];

/** Lý do, giờ gửi, phản hồi và giờ duyệt của một yêu cầu. */
function facts(r: EmployeeRequest): [string, ReactNode][] {
  const items: [string, ReactNode][] = [["Lý do", r.reason], ["Gửi lúc", dateTime(r.sentAt)]];
  if (r.response) items.push(["Phản hồi", r.response]);
  if (r.reviewedAt) items.push(["Duyệt lúc", dateTime(r.reviewedAt)]);
  return items;
}

export default function LeaveRequestsPage() { return <WorkforceGate mode="requests"><RequestsContent /></WorkforceGate>; }

/**
 * Yêu cầu của nhân viên (SCR-LABOR-03): chờ duyệt và cũ nhất lên đầu. Chỉ Chủ HTX duyệt hoặc từ chối (LABOR-05, server chặn
 * bằng RequireCooperativeOwner); Quản lý vùng chỉ xem. Từ chối thì bắt buộc lời nhắn.
 */
function RequestsContent() {
  const owner = useAtomValue(permissionsAtom)!.isCooperativeOwner;
  const [filter, setFilter] = useState<Filter>("all");
  const data = useLoad(() => listRequests(filter === "all" ? undefined : REQUEST_STATUS[filter]), [filter]);
  const [choice, setChoice] = useState<{ row: EmployeeRequest; approved: boolean } | null>(null);
  const [response, setResponse] = useState("");
  // LABOR-05.3: duyệt quên giờ vào của lao động thời vụ chưa có phân công ngày đó thì Chủ HTX chọn loại việc và bè.
  const [needsWork, setNeedsWork] = useState(false);
  const [zone, setZone] = useState("");
  const [raft, setRaft] = useState("");
  const [job, setJob] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState<{ id: string; text: string } | null>(null);
  const jobs = useLoad(() => needsWork && choice ? workLookups(choice.row.from).then(l => l.jobs) : Promise.resolve([]), [needsWork, choice?.row.from]);
  const zones = useLoad(() => needsWork ? zoneLookup() : Promise.resolve([]), [needsWork]);
  const rafts = useLoad(() => zone ? listRafts(zone, 101) : Promise.resolve([]), [zone]);
  useEffect(() => { if (needsWork && !zone && zones.data?.length) setZone(zones.data[0].id); }, [needsWork, zone, zones.data]);

  const open = (row: EmployeeRequest, approved: boolean) => {
    setChoice({ row, approved }); setResponse(""); setError(""); setDone(null);
    setNeedsWork(false); setZone(""); setRaft(""); setJob("");
  };
  const save = async () => {
    if (!choice || busy) return;
    if (!choice.approved && !response.trim()) { setError("Nhập lý do từ chối cho nhân viên."); return; }
    if (needsWork && (!job || !raft)) { setError("Chọn loại việc và bè của ngày đó."); return; }
    setBusy(true); setError("");
    try {
      await reviewRequest(choice.row.id, {
        approved: choice.approved, response: response.trim() || null, rowVersion: choice.row.rowVersion, ...(needsWork ? { jobTypeId: job, raftId: raft } : {}),
      });
      setDone({ id: choice.row.id, text: choice.approved ? "Đã duyệt yêu cầu." : "Đã từ chối yêu cầu." });
      setChoice(null);
      await data.reload();
    } catch (e) {
      const field = isApiError(e) ? String(e.details.field ?? "") : "";
      if (choice.approved && choice.row.type === "MissedCheckIn" && !needsWork && (isApiError(e, "MSG01") || isApiError(e, "MSG-GEN-01")) && (field === "Job type" || field === "Raft")) {
        setNeedsWork(true);
        setError("Nhân viên thời vụ này chưa được phân công ngày đó. Chọn loại việc và bè để ghi giờ vào.");
      } else {
        setError(errorText(e));
        if (isApiError(e, "MSG06") || isApiError(e, "MSG61")) void data.reload();
      }
    } finally { setBusy(false); }
  };

  return <ManagePage title={owner ? "Duyệt yêu cầu nhân viên" : "Yêu cầu của nhân viên"}>
    <div className="button-stack"><p className="form__hint">{owner
      ? "Duyệt quên giờ vào hoặc quên giờ ra thì giờ đó được ghi vào chấm công của ngày. Nghỉ phép chỉ được ghi nhận, không đổi tiền công."
      : "Chỉ Chủ HTX duyệt hoặc từ chối. Bạn xem được danh sách này."}</p></div>
    <Chips options={FILTERS} value={filter} onChange={setFilter} />
    <Loadable data={data.data} error={data.error} reload={() => void data.reload()}>{rows => rows.length ? <div className="workforce-cards">{rows.map(r =>
      <div className="card form" key={r.id}>
        <p className="block__title">{r.employeeName}</p>
        <p>{REQUEST_TYPE_TEXT[r.type]}: {requestDays(r)}</p>
        <div><Badge {...requestStatus(r)} /></div>
        <Facts items={facts(r)} />
        {done?.id === r.id && <p className="status-note" role="status">{done.text}</p>}
        {owner && r.statusId === REQUEST_STATUS.awaiting && <div className="action-row">{[true, false].map(approved => <Button key={String(approved)} size="large" variant={approved ? "primary" : "secondary"} disabled={busy}
          onClick={() => open(r, approved)}>{approved ? "Duyệt" : "Từ chối"}</Button>)}</div>}
      </div>)}</div> : <Empty title={filter === "all" ? "Chưa có yêu cầu nào" : "Không có yêu cầu ở trạng thái này"} />}</Loadable>
    <div className="button-stack"><Button fullWidth size="large" variant="secondary" onClick={() => void data.reload()}>Tải lại</Button></div>
    <Sheet visible={choice !== null} onClose={() => { if (!busy) setChoice(null); }} autoHeight mask handler title={choice?.approved ? "Duyệt yêu cầu" : "Từ chối yêu cầu"}>
      <div className="sheet-form form workforce-sheet">
        <p className="block__title">{choice?.row.employeeName}</p>
        {choice && <p>{REQUEST_TYPE_TEXT[choice.row.type]}: {requestDays(choice.row)}</p>}
        <p>Lý do: {choice?.row.reason}</p>
        <Input.TextArea label={choice?.approved ? "Lời nhắn cho nhân viên (không bắt buộc)" : "Lý do từ chối (bắt buộc)"} value={response} maxLength={500} disabled={busy} onChange={e => setResponse(e.target.value)} />
        {needsWork && <>
          <Loadable data={jobs.data} error={jobs.error} reload={() => void jobs.reload()}>{items => <Select label="Loại việc ngày đó (bắt buộc)" placeholder="Chọn loại việc" value={job} onChange={v => setJob(String(v))} closeOnSelect>
            {items.map(j => <Select.Option key={j.id} value={j.id} title={j.name} />)}
          </Select>}</Loadable>
          <Loadable data={zones.data} error={zones.error} reload={() => void zones.reload()}>{items => <Select label="Vùng" value={zone} onChange={v => { setZone(String(v)); setRaft(""); }} closeOnSelect>
            {items.map(z => <Select.Option key={z.id} value={z.id} title={z.name ?? z.code ?? ""} />)}
          </Select>}</Loadable>
          <Loadable data={rafts.data} error={rafts.error} reload={() => void rafts.reload()}>{items => <Select label="Bè ngày đó (bắt buộc)" placeholder="Chọn bè" value={raft} onChange={v => setRaft(String(v))} closeOnSelect>
            {items.map(r => <Select.Option key={r.id} value={r.id} title={r.code ?? ""} />)}
          </Select>}</Loadable>
        </>}
        <FormError text={error} />
        <div className="sheet-actions">
          <Button fullWidth size="large" loading={busy} disabled={busy} onClick={() => void save()}>{choice?.approved ? "Xác nhận duyệt" : "Xác nhận từ chối"}</Button>
          <Button fullWidth size="large" variant="secondary" disabled={busy} onClick={() => setChoice(null)}>Không, quay lại</Button>
        </div>
      </div>
    </Sheet>
  </ManagePage>;
}
