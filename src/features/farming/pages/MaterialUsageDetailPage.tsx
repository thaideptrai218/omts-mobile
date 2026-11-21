import type { CycleListItem } from "@/features/farming/models/Cycle";
import type { MaterialUsageEditChoices, MaterialUsageEditDraft, MaterialUsageView } from "@/features/farming/models/MaterialUsage";
import { useState } from "react";
import { Button, Input, Select, useNavigate, useParams, useSnackbar } from "zmp-ui";

import { Actions } from "@/components/Actions/Actions";
import DateField from "@/components/DateField/DateField";
import { Facts } from "@/components/Facts/Facts";
import FormError from "@/components/FormError/FormError";
import { Loadable } from "@/components/Loadable/Loadable";
import { ManagePage } from "@/components/ManagePage/ManagePage";
import { NumberInput } from "@/components/NumberInput/NumberInput";
import { ReasonSheet } from "@/components/ReasonSheet/ReasonSheet";
import { raftCycles } from "@/features/farming/services/cultivationService";
import { USAGE } from "@/features/farming/services/farmService";
import { editMaterialUsage, getMaterialUsage, MATERIAL_USAGE_LIMITS, usageEditChoices, usageEditError } from "@/features/farming/services/materialUsageService";
import { useLoad } from "@/hooks/useLoad";
import { isApiError } from "@/services/errors";
import { errorText } from "@/utils/errorText";
import { date, dateTime, num, parseNumber } from "@/utils/format";

const draftOf = (u: MaterialUsageView): MaterialUsageEditDraft => ({
  raftId: u.raftId,
  usageDate: u.usageDate,
  itemId: u.itemId,
  quantity: String(u.quantity).replace(".", ","),
  repairReason: u.repairReason,
});

const unchanged = (u: MaterialUsageView, d: MaterialUsageEditDraft) =>
  d.raftId === u.raftId && d.usageDate === u.usageDate && d.itemId === u.itemId && parseNumber(d.quantity) === u.quantity && d.repairReason.trim() === u.repairReason;

/**
 * Một bản ghi vật tư sử dụng (CYCLE-03.1): xem, và sửa kèm lý do khi bè đang dùng và chưa có chu kỳ đã đóng khóa bản ghi
 * (BR-CYCLE-04). Mọi Quản lý vùng của vùng và Chủ HTX đều sửa được, không chỉ người ghi. Đổi bè là chuyển bản ghi sang bè đó.
 */
export default function MaterialUsageDetailPage() {
  const { id = "" } = useParams();
  const navigate = useNavigate();
  const { openSnackbar } = useSnackbar();
  const usage = useLoad(() => getMaterialUsage(id), [id]);
  const [choices, setChoices] = useState<MaterialUsageEditChoices | null>(null);
  const [draft, setDraft] = useState<MaterialUsageEditDraft | null>(null);
  const [asking, setAsking] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  // Chu kỳ của bè đang chọn trong form, để báo sớm ngày thuộc chu kỳ đã đóng.
  const cycles = useLoad(() => (draft?.raftId ? raftCycles(draft.raftId) : Promise.resolve<CycleListItem[]>([])), [draft?.raftId]);

  const startEdit = async (u: MaterialUsageView) => {
    setError("");
    setBusy(true);
    try {
      setChoices(await usageEditChoices(u));
      setDraft(draftOf(u));
    } catch (err) {
      openSnackbar({ text: errorText(err), type: "error", duration: 6000 });
    } finally {
      setBusy(false);
    }
  };

  const close = () => {
    setDraft(null);
    setError("");
  };

  const review = () => {
    const u = usage.data;
    if (!u || !draft) return;
    const problem = unchanged(u, draft) ? "Chưa có thay đổi nào để lưu." : usageEditError(draft, cycles.data ?? []);
    setError(problem);
    if (!problem) setAsking(true);
  };

  const save = async (reason: string): Promise<boolean> => {
    const u = usage.data;
    if (!u || !draft) return false;
    setBusy(true);
    try {
      const saved = await editMaterialUsage(u, draft, reason);
      usage.setData(saved.record);
      close();
      openSnackbar({ text: "Đã lưu vật tư sử dụng.", type: "success", duration: 4000 });
    } catch (err) {
      setError(errorText(err));
      // Người khác vừa sửa (MSG06): hiện bản mới để người dùng xem rồi sửa lại.
      if (isApiError(err, "MSG06")) {
        try {
          const fresh = await getMaterialUsage(id);
          usage.setData(fresh);
          setDraft(fresh.canEdit ? draftOf(fresh) : null);
        } catch {
          // Không tải được bản mới thì giữ form; lần lưu sau server vẫn chặn ghi đè.
        }
      }
    } finally {
      setBusy(false);
    }
    return true;
  };

  const u = usage.data;
  const footer = !u ? undefined : draft ? (
    <div className="sheet-actions">
      <Button fullWidth size="large" loading={busy} disabled={busy} onClick={review}>Lưu thay đổi</Button>
      <Button fullWidth size="large" variant="secondary" disabled={busy} onClick={close}>Không, quay lại</Button>
    </div>
  ) : u.canEdit ? (
    <Button fullWidth size="large" loading={busy} disabled={busy} onClick={() => void startEdit(u)}>Sửa bản ghi</Button>
  ) : undefined;

  return (
    <ManagePage title={draft ? "Sửa vật tư sử dụng" : "Vật tư sử dụng"} footer={footer} onBack={draft ? close : undefined}>
      <Loadable data={u} error={usage.error} reload={() => void usage.reload()}>
        {(record) =>
          draft && choices ? (
            <EditForm choices={choices} draft={draft} busy={busy} error={error} onChange={(d) => { setDraft(d); setError(""); }} />
          ) : (
            <>
              <FormError text={error} />
              <Facts
                items={[
                  ["Bè", `Bè ${record.raftCode}`],
                  ["Vật tư", `${record.itemName} (${record.itemCode})`],
                  ["Số lượng", num(record.quantity, record.unit)],
                  ["Ngày sửa bè", date(record.usageDate)],
                  ["Lý do sửa bè", record.repairReason],
                  ["Chu kỳ nuôi", record.cycleId ? "Trong chu kỳ nuôi của bè" : "Ngày này bè không có chu kỳ nuôi"],
                  ["Người ghi", record.recordedByName],
                  ["Ghi lúc", dateTime(record.recordedAt)],
                ]}
              />
              {!record.canEdit && (
                <p className="form__hint">Bản ghi này không sửa được: ngày dùng thuộc chu kỳ nuôi đã đóng, bè hoặc vùng đã ngừng dùng, hoặc bạn không có quyền sửa.</p>
              )}
              <Actions>
                <Button fullWidth variant="secondary" size="large" onClick={() => navigate(`/manage/rafts/${record.raftId}/material-usages`)}>
                  Xem vật tư của bè {record.raftCode}
                </Button>
                {record.cycleId && (
                  <Button fullWidth variant="secondary" size="large" onClick={() => navigate(`/manage/cycles/${record.cycleId}`)}>
                    Xem chu kỳ nuôi
                  </Button>
                )}
              </Actions>
            </>
          )
        }
      </Loadable>

      <ReasonSheet
        visible={asking}
        title="Lý do sửa"
        intro="Lý do được lưu trong lịch sử thao tác cùng giá trị trước và sau khi sửa."
        confirmText="Lưu thay đổi"
        required
        maxLength={MATERIAL_USAGE_LIMITS.reason}
        busy={busy}
        onClose={() => setAsking(false)}
        onConfirm={save}
      />
    </ManagePage>
  );
}

function EditForm({
  choices,
  draft,
  busy,
  error,
  onChange,
}: {
  choices: MaterialUsageEditChoices;
  draft: MaterialUsageEditDraft;
  busy: boolean;
  error: string;
  onChange: (draft: MaterialUsageEditDraft) => void;
}) {
  const item = choices.items.find((x) => x.id === draft.itemId);
  return (
    <div className="card form">
      {choices.rafts.length > 1 && (
        <Select label="Bè" value={draft.raftId} onChange={(v) => onChange({ ...draft, raftId: String(v) })} closeOnSelect disabled={busy} helperText="Chọn bè khác nếu đã ghi nhầm bè.">
          {choices.rafts.map((r) => (
            <Select.Option key={r.id} value={r.id} title={`Bè ${r.code}`} />
          ))}
        </Select>
      )}
      <DateField label="Ngày sửa bè" value={draft.usageDate} onChange={(usageDate) => onChange({ ...draft, usageDate })} disabled={busy} />
      <Select label="Vật tư" value={draft.itemId} onChange={(v) => onChange({ ...draft, itemId: String(v) })} closeOnSelect disabled={busy}>
        {choices.items.map((x) => (
          <Select.Option key={x.id} value={x.id} title={`${x.name} (${x.unit})${x.statusId !== USAGE.inUse ? " – đã ngừng dùng" : ""}`} />
        ))}
      </Select>
      <NumberInput label={`Số lượng${item ? ` (${item.unit})` : ""}`} value={draft.quantity} onChange={(quantity) => onChange({ ...draft, quantity })} disabled={busy} decimal />
      <Input.TextArea
        label="Lý do sửa bè (bắt buộc)"
        value={draft.repairReason}
        onChange={(e) => onChange({ ...draft, repairReason: e.target.value })}
        maxLength={MATERIAL_USAGE_LIMITS.repairReason}
        showCount
        disabled={busy}
      />
      <FormError text={error} />
    </div>
  );
}
