import type { CycleListItem } from "@/features/farming/models/Cycle";
import type { MaterialItem, MaterialUsageDraft, MaterialUsageGroup, MaterialUsageLineDraft, MaterialUsageList } from "@/features/farming/models/MaterialUsage";
import { useState } from "react";
import { Button, Icon, Input, Select, useNavigate, useParams, useSnackbar } from "zmp-ui";

import DateField from "@/components/DateField/DateField";
import { Empty } from "@/components/Empty/Empty";
import FormError from "@/components/FormError/FormError";
import { Loadable } from "@/components/Loadable/Loadable";
import { ManagePage } from "@/components/ManagePage/ManagePage";
import { NumberInput } from "@/components/NumberInput/NumberInput";
import { Row } from "@/components/Row/Row";
import { Rows } from "@/components/Rows/Rows";
import { Section } from "@/components/Section/Section";
import { raftCycles } from "@/features/farming/services/cultivationService";
import { MATERIAL_USAGE_LIMITS, materialItems, raftMaterialUsages, recordMaterialUsage, usageDraftError } from "@/features/farming/services/materialUsageService";
import { useLoad } from "@/hooks/useLoad";
import { errorText } from "@/utils/errorText";
import { date, num, todayIso } from "@/utils/format";
import "@/features/farming/pages/MaterialUsagePage.scss";

let lineKey = 0;
const emptyLine = (): MaterialUsageLineDraft => ({ key: ++lineKey, itemId: "", quantity: "" });
const emptyDraft = (): MaterialUsageDraft => ({ usageDate: todayIso(), repairReason: "", lines: [emptyLine()] });

/** Tiêu đề nhóm: chu kỳ nuôi chứa các ngày sửa bè, hoặc những ngày bè không có chu kỳ (BR-CYCLE-03). */
function groupTitle(group: MaterialUsageGroup): string {
  const cycle = group.cycle;
  if (!cycle) return "Ngày bè không có chu kỳ nuôi";
  return cycle.closeDate ? `Chu kỳ ${date(cycle.startDate)} – ${date(cycle.closeDate)}` : `Chu kỳ đang nuôi từ ${date(cycle.startDate)}`;
}

/**
 * Vật tư sử dụng của một bè (CYCLE-03, SCR-CYCLE-03): theo chu kỳ, mới nhất trước, rồi theo từng lần sửa bè. Quản lý vùng
 * của vùng và Chủ HTX ghi được khi bè và vùng đang dùng; một lần sửa bè có nhiều vật tư, mỗi vật tư một dòng. Không có giá
 * (BR-FARM-05). Không ghi được vào ngày thuộc chu kỳ đã đóng.
 */
export default function RaftMaterialUsagesPage() {
  const { raftId = "" } = useParams();
  const navigate = useNavigate();
  const { openSnackbar } = useSnackbar();
  const data = useLoad(async () => {
    // Các chu kỳ chỉ để báo sớm ngày thuộc chu kỳ đã đóng; không tải được thì server vẫn chặn khi lưu.
    const [list, cycles] = await Promise.all([raftMaterialUsages(raftId), raftCycles(raftId).catch((): CycleListItem[] => [])]);
    return { list, cycles };
  }, [raftId]);
  const [items, setItems] = useState<MaterialItem[] | null>(null);
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState<MaterialUsageDraft>(emptyDraft);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const openForm = async () => {
    setError("");
    if (!items) {
      setBusy(true);
      try {
        setItems(await materialItems());
      } catch (err) {
        openSnackbar({ text: errorText(err), type: "error", duration: 6000 });
        return;
      } finally {
        setBusy(false);
      }
    }
    setDraft(emptyDraft());
    setAdding(true);
  };

  const close = () => {
    setAdding(false);
    setError("");
  };

  const save = async () => {
    const problem = usageDraftError(draft, data.data?.cycles ?? []);
    setError(problem);
    if (problem || busy) return;
    setBusy(true);
    try {
      await recordMaterialUsage(raftId, draft);
      openSnackbar({ text: "Đã lưu vật tư sử dụng.", type: "success", duration: 4000 });
      close();
      await data.reload();
    } catch (err) {
      setError(errorText(err));
    } finally {
      setBusy(false);
    }
  };

  const loaded = data.data;
  const footer = !loaded ? undefined : adding ? (
    <div className="sheet-actions">
      <Button fullWidth size="large" loading={busy} disabled={busy || !items?.length} onClick={() => void save()}>Lưu vật tư đã dùng</Button>
      <Button fullWidth size="large" variant="secondary" disabled={busy} onClick={close}>Không, quay lại</Button>
    </div>
  ) : loaded.list.canRecord ? (
    <Button fullWidth size="large" loading={busy} disabled={busy} onClick={() => void openForm()}>Ghi vật tư đã dùng</Button>
  ) : undefined;

  return (
    <ManagePage title={loaded ? `Vật tư bè ${loaded.list.raftCode}` : "Vật tư sử dụng"} footer={footer} onBack={adding ? close : undefined}>
      <Loadable data={loaded} error={data.error} reload={() => void data.reload()}>
        {({ list, cycles }) =>
          adding ? (
            <UsageForm items={items ?? []} draft={draft} cycles={cycles} busy={busy} error={error} onChange={(d) => { setDraft(d); setError(""); }} />
          ) : (
            <UsageList list={list} onOpen={(id) => navigate(`/manage/material-usages/${id}`)} />
          )
        }
      </Loadable>
    </ManagePage>
  );
}

function UsageList({ list, onOpen }: { list: MaterialUsageList; onOpen: (id: string) => void }) {
  return (
    <>
      {!list.canRecord && <p className="form__hint">Chưa ghi được vật tư mới: bè hoặc vùng nuôi đã ngừng dùng, hoặc bạn không có quyền ghi. Vật tư đã ghi vẫn xem được.</p>}
      {list.groups.length === 0 ? (
        <Empty title="Chưa ghi vật tư nào" text={list.canRecord ? "Sau mỗi lần sửa bè, bấm “Ghi vật tư đã dùng” để ghi phao, dây đã thay." : undefined} />
      ) : (
        list.groups.map((group) => (
          <Section key={group.cycle?.id ?? "none"} title={groupTitle(group)}>
            {group.locked && <p className="form__hint">Chu kỳ đã đóng nên vật tư của chu kỳ này không sửa được nữa.</p>}
            {group.repairs.map((repair) => (
              <div key={`${repair.usageDate}|${repair.repairReason}`} className="usage-repair">
                <p className="usage-repair__head">{date(repair.usageDate)} · {repair.repairReason}</p>
                <Rows>
                  {repair.records.map((u) => (
                    <Row
                      key={u.id}
                      title={u.itemName}
                      meta={u.recordedByName ? `Người ghi: ${u.recordedByName}` : undefined}
                      value={num(u.quantity, u.unit)}
                      onClick={() => onOpen(u.id)}
                    />
                  ))}
                </Rows>
              </div>
            ))}
          </Section>
        ))
      )}
    </>
  );
}

/** Form một lần sửa bè: ngày, lý do và các vật tư đã dùng. Mỗi vật tư chỉ chọn được ở một dòng. */
function UsageForm({
  items,
  draft,
  cycles,
  busy,
  error,
  onChange,
}: {
  items: MaterialItem[];
  draft: MaterialUsageDraft;
  cycles: CycleListItem[];
  busy: boolean;
  error: string;
  onChange: (draft: MaterialUsageDraft) => void;
}) {
  if (!items.length) {
    return <Empty title="Chưa có vật tư để chọn" text="Danh mục chưa có vật tư nhóm Vật tư bè đang dùng. Chủ HTX cần thêm vật tư vào danh mục trước." />;
  }

  const updateLine = (key: number, patch: Partial<MaterialUsageLineDraft>) =>
    onChange({ ...draft, lines: draft.lines.map((l) => (l.key === key ? { ...l, ...patch } : l)) });
  const closedCount = cycles.filter((c) => c.closeDate !== null).length;

  return (
    <div className="form">
      <div className="card form">
        <DateField label="Ngày sửa bè" value={draft.usageDate} onChange={(usageDate) => onChange({ ...draft, usageDate })} disabled={busy} />
        <Input.TextArea
          label="Lý do sửa bè (bắt buộc)"
          placeholder="Ví dụ: thay phao vỡ sau bão"
          value={draft.repairReason}
          onChange={(e) => onChange({ ...draft, repairReason: e.target.value })}
          maxLength={MATERIAL_USAGE_LIMITS.repairReason}
          showCount
          disabled={busy}
        />
        {closedCount > 0 && <p className="form__hint">Ngày thuộc chu kỳ nuôi đã đóng thì không ghi vật tư được.</p>}
      </div>

      <Section title="Vật tư đã dùng">
        <div className="form">
          {draft.lines.map((line, i) => {
            const item = items.find((x) => x.id === line.itemId);
            const taken = new Set(draft.lines.filter((l) => l.key !== line.key).map((l) => l.itemId));
            return (
              <div key={line.key} className="line-item card">
                <div className="line-item__head">
                  <span>Dòng {i + 1}</span>
                </div>
                <Select label="Vật tư (bắt buộc)" placeholder="Chọn vật tư" value={line.itemId || undefined} onChange={(v) => updateLine(line.key, { itemId: String(v) })} closeOnSelect disabled={busy}>
                  {items.filter((x) => !taken.has(x.id)).map((x) => (
                    <Select.Option key={x.id} value={x.id} title={`${x.name} (${x.unit})`} />
                  ))}
                </Select>
                <NumberInput label={`Số lượng${item ? ` (${item.unit})` : ""}`} value={line.quantity} onChange={(quantity) => updateLine(line.key, { quantity })} disabled={busy} decimal />
                {draft.lines.length > 1 && (
                  <Button fullWidth variant="secondary" type="danger" size="large" disabled={busy} onClick={() => onChange({ ...draft, lines: draft.lines.filter((l) => l.key !== line.key) })}>
                    Bỏ dòng {i + 1}
                  </Button>
                )}
              </div>
            );
          })}
          {draft.lines.length < items.length && (
            <Button fullWidth variant="secondary" size="large" prefixIcon={<Icon icon="zi-plus" />} disabled={busy} onClick={() => onChange({ ...draft, lines: [...draft.lines, emptyLine()] })}>
              Thêm vật tư
            </Button>
          )}
        </div>
      </Section>
      <FormError text={error} />
    </div>
  );
}
