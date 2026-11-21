import type { CultivationLogDraft, CultivationLogView } from "@/features/farming/models/CultivationLog";
import { useEffect, useState } from "react";
import { Button, Input, useParams } from "zmp-ui";

import DateField from "@/components/DateField/DateField";
import { Empty } from "@/components/Empty/Empty";
import { Facts } from "@/components/Facts/Facts";
import FormError from "@/components/FormError/FormError";
import { Loadable } from "@/components/Loadable/Loadable";
import { ManagePage } from "@/components/ManagePage/ManagePage";
import { ReasonSheet } from "@/components/ReasonSheet/ReasonSheet";
import { Section } from "@/components/Section/Section";
import { correctLog, CULTIVATION_LIMITS, getCycle, listLogs, logDraftError, recordLog, removeLog } from "@/features/farming/services/cultivationService";
import { useAction } from "@/hooks/useAction";
import { useLoad } from "@/hooks/useLoad";
import { choosePhoto } from "@/services/zaloService";
import { date, dateTime, num, todayIso } from "@/utils/format";
import "@/features/farming/pages/CultivationLogsPage.scss";

const emptyDraft = (): CultivationLogDraft => ({ visitDate: todayIso(), notes: "", keepPhotos: [], newPhotos: [] });

const draftOf = (log: CultivationLogView): CultivationLogDraft => ({
  visitDate: log.visitDate, notes: log.notes ?? "", keepPhotos: [...log.photos].sort((a, b) => a.sortOrder - b.sortOrder), newPhotos: [],
});

/** Nhật ký nuôi của một chu kỳ (CYCLE-04): mỗi lần đi bè ghi ngày, ghi chú và ảnh; Chủ HTX nhận thông báo. */
export default function CultivationLogsPage() {
  const { cycleId = "" } = useParams();
  const data = useLoad(async () => {
    const [logs, cycle] = await Promise.all([listLogs(cycleId), getCycle(cycleId)]);
    return { logs, cycle };
  }, [cycleId]);
  /** null: đang xem; "new": ghi nhật ký mới; một nhật ký: đang sửa nhật ký đó. */
  const [editing, setEditing] = useState<"new" | CultivationLogView | null>(null);
  const [draft, setDraft] = useState(emptyDraft);
  const [error, setError] = useState("");
  const [reasonFor, setReasonFor] = useState<"correct" | "remove" | null>(null);
  const { busy, run } = useAction();

  const open = (log: CultivationLogView | null) => { setDraft(log ? draftOf(log) : emptyDraft()); setError(""); setEditing(log ?? "new"); };
  const close = () => { setEditing(null); setError(""); };

  // Không bọc `choosePhoto` trong `run`: người dùng đóng bộ chọn ảnh thì SDK không báo, nút sẽ bị khóa mãi.
  const addPhoto = async () => {
    try {
      const photo = await choosePhoto();
      if (photo) { setDraft((d) => ({ ...d, newPhotos: [...d.newPhotos, photo] })); setError(""); }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Chưa lấy được ảnh. Vui lòng thử lại.");
    }
  };

  const review = async () => {
    const problem = logDraftError(draft, data.data?.cycle.startDate ?? "");
    setError(problem);
    if (problem || busy) return;
    if (editing !== "new") { setReasonFor("correct"); return; }
    const saved = await run(() => recordLog(cycleId, draft), "Đã lưu nhật ký nuôi.");
    if (saved) { close(); await data.reload(); }
  };

  const withReason = async (reason: string): Promise<boolean> => {
    if (!editing || editing === "new") return false;
    const done = reasonFor === "correct"
      ? await run(async () => { await correctLog(editing, draft, reason); return true; }, "Đã sửa nhật ký nuôi.")
      : await run(async () => { await removeLog(editing, reason); return true; }, "Đã xóa nhật ký nuôi.");
    if (!done) return false;
    setReasonFor(null);
    close();
    await data.reload();
    return true;
  };

  const loaded = data.data;
  const photos = draft.keepPhotos.length + draft.newPhotos.length;
  const footer = !loaded ? undefined : editing ? (
    <div className="sheet-actions">
      <Button fullWidth size="large" loading={busy} disabled={busy} onClick={() => void review()}>{editing === "new" ? "Lưu nhật ký" : "Lưu thay đổi"}</Button>
      {editing !== "new" && <Button fullWidth size="large" variant="tertiary" type="danger" disabled={busy} onClick={() => setReasonFor("remove")}>Xóa nhật ký này</Button>}
      <Button fullWidth size="large" variant="secondary" disabled={busy} onClick={close}>Không, quay lại</Button>
    </div>
  ) : loaded.cycle.canEdit ? (
    <Button fullWidth size="large" onClick={() => open(null)}>Ghi nhật ký đi bè</Button>
  ) : undefined;

  return (
    <ManagePage title={loaded ? `Nhật ký bè ${loaded.cycle.raftCode}` : "Nhật ký nuôi"} footer={footer} onBack={editing ? close : undefined}>
      <Loadable data={loaded} error={data.error} reload={() => void data.reload()}>
        {({ logs, cycle }) =>
          editing ? (
            <div className="card form">
              <DateField label="1. Ngày đi bè" value={draft.visitDate || null} onChange={(visitDate) => { setDraft((d) => ({ ...d, visitDate })); setError(""); }} disabled={busy} />
              <Input.TextArea label="2. Ghi chú (không bắt buộc)" value={draft.notes} maxLength={CULTIVATION_LIMITS.notes} showCount disabled={busy}
                onChange={(e) => { const notes = e.target.value; setDraft((d) => ({ ...d, notes })); setError(""); }} />
              <p className="form__intro">3. Ảnh bè (bắt buộc, từ 1 đến {CULTIVATION_LIMITS.photos} ảnh). Đã có {num(photos, "ảnh")}.</p>
              <div className="log-photos">
                {draft.keepPhotos.map((photo) => (
                  <PhotoTile key={photo.key} src={photo.url} disabled={busy}
                    onRemove={() => setDraft((d) => ({ ...d, keepPhotos: d.keepPhotos.filter((p) => p.key !== photo.key) }))} />
                ))}
                {draft.newPhotos.map((photo, i) => (
                  <NewPhotoTile key={`new-${i}`} photo={photo} disabled={busy}
                    onRemove={() => setDraft((d) => ({ ...d, newPhotos: d.newPhotos.filter((_, j) => j !== i) }))} />
                ))}
              </div>
              {photos < CULTIVATION_LIMITS.photos && (
                <Button fullWidth size="large" variant="secondary" disabled={busy} onClick={() => void addPhoto()}>Chụp hoặc chọn ảnh</Button>
              )}
              <FormError text={error} />
            </div>
          ) : (
            <>
              <Facts items={[
                ["Chu kỳ bắt đầu", date(cycle.startDate)],
                ["Số lần đi bè đã ghi", num(logs.length, "lần")],
              ]} />
              {!cycle.canEdit && <p className="form__hint">Chu kỳ đã đóng hoặc bè đã ngừng dùng nên chỉ còn xem được nhật ký.</p>}
              <Section title="Các lần đi bè">
                {logs.length ? (
                  <div className="log-list">
                    {logs.map((log) => (
                      <article key={log.id} className="card log-entry">
                        <h3 className="log-entry__title">{date(log.visitDate)}</h3>
                        {log.notes && <p className="log-entry__notes">{log.notes}</p>}
                        <div className="log-photos">
                          {[...log.photos].sort((a, b) => a.sortOrder - b.sortOrder).map((photo) => (
                            <img key={photo.key} className="log-photo" src={photo.url} alt={`Ảnh bè ngày ${date(log.visitDate)}`} loading="lazy" />
                          ))}
                        </div>
                        <p className="log-entry__meta">{log.recordedByName ? `${log.recordedByName} ghi` : "Đã ghi"} lúc {dateTime(log.recordedAt)}</p>
                        {log.canCorrect && (
                          <Button fullWidth size="large" variant="secondary" disabled={busy} onClick={() => open(log)}>Sửa hoặc xóa</Button>
                        )}
                      </article>
                    ))}
                  </div>
                ) : (
                  <Empty title="Chưa có nhật ký nào" text="Mỗi lần đi bè, ghi ngày, tình trạng và chụp ảnh bè." />
                )}
              </Section>
            </>
          )
        }
      </Loadable>
      <ReasonSheet visible={reasonFor !== null} busy={busy} required maxLength={CULTIVATION_LIMITS.reason} danger={reasonFor === "remove"}
        title={reasonFor === "remove" ? "Xóa nhật ký này?" : "Lưu thay đổi của nhật ký?"}
        intro={reasonFor === "remove" ? "Nhật ký và ảnh bị xóa, lịch sử thao tác vẫn giữ lại cùng lý do." : "Ảnh cũ đã bỏ ra sẽ bị xóa. Ghi lý do sửa."}
        confirmText={reasonFor === "remove" ? "Xóa nhật ký" : "Lưu thay đổi"} onClose={() => setReasonFor(null)} onConfirm={withReason} />
    </ManagePage>
  );
}

/** Một ảnh trong phiếu, kèm nút bỏ ảnh. */
function PhotoTile({ src, disabled, onRemove }: { src: string; disabled: boolean; onRemove: () => void }) {
  return (
    <div className="log-photo-tile">
      <img className="log-photo" src={src} alt="Ảnh bè" />
      <Button variant="tertiary" type="danger" disabled={disabled} onClick={onRemove}>Bỏ ảnh</Button>
    </div>
  );
}

/** Ảnh mới chụp: tạo link tạm để xem trước, xóa link khi bỏ ảnh hoặc rời màn. */
function NewPhotoTile({ photo, disabled, onRemove }: { photo: Blob; disabled: boolean; onRemove: () => void }) {
  const [src, setSrc] = useState("");
  useEffect(() => {
    const url = URL.createObjectURL(photo);
    setSrc(url);
    return () => URL.revokeObjectURL(url);
  }, [photo]);
  return src ? <PhotoTile src={src} disabled={disabled} onRemove={onRemove} /> : null;
}
