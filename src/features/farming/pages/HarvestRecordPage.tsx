import type { HarvestPlan, HarvestPlanLine, PlanHarvestDraft, PlanHarvestSaved } from "@/features/farming/models/HarvestPlan";
import { useEffect, useState } from "react";
import { Button, useNavigate, useParams } from "zmp-ui";

import { Empty } from "@/components/Empty/Empty";
import { Facts } from "@/components/Facts/Facts";
import FormError from "@/components/FormError/FormError";
import { Loadable } from "@/components/Loadable/Loadable";
import { ManagePage } from "@/components/ManagePage/ManagePage";
import { NumberInput } from "@/components/NumberInput/NumberInput";
import { Section } from "@/components/Section/Section";
import { crewSuggestions, getHarvestPlan, HARVEST_LIMITS, planHarvestError, recordPlanHarvest } from "@/features/farming/services/harvestPlanService";
import { useLoad } from "@/hooks/useLoad";
import { choosePhoto } from "@/services/zaloService";
import { errorText } from "@/utils/errorText";
import { date, num, todayIso } from "@/utils/format";
import "@/features/farming/pages/HarvestPlan.scss";

/**
 * Ghi nhận thu một bè theo kế hoạch: số lồng đã thu (bắt buộc), kg ước tính, người thu và ảnh tại bè (không bắt buộc). Luống và sản phẩm
 * lấy theo dòng kế hoạch và chu kỳ nuôi của bè. Lưu xong, lô "Chờ cân" đi thẳng sang phiếu cân từng lồng.
 */
export default function HarvestRecordPage() {
  const { id = "", lineId = "" } = useParams();
  const plan = useLoad(() => getHarvestPlan(id), [id]);
  const [saved, setSaved] = useState<PlanHarvestSaved | null>(null);

  return (
    <ManagePage title="Ghi nhận thu hoạch">
      <Loadable data={plan.data} error={plan.error} reload={() => void plan.reload()}>
        {(p) => {
          const line = p.lines.find((l) => l.id === lineId);
          if (saved) return <SavedLot saved={saved} plan={p} />;
          if (!line) return <Empty icon="zi-close-circle" title="Không tìm thấy bè này trong kế hoạch" />;
          if (line.state !== "Open" || !line.canHarvest || !p.allowedActions.includes("Harvest")) {
            return (
              <Empty
                icon="zi-info-circle"
                title={line.lot ? `Bè ${line.raftCode} đã có lô ${line.lot.lotCode}` : `Bè ${line.raftCode} chưa ghi nhận thu được`}
                text={line.lot ? "Mỗi bè trong kế hoạch ghi một lô. Mở kế hoạch để cân lô đó." : "Kế hoạch cần được nhận trước, hoặc bè đã bỏ hết luống."}
              />
            );
          }
          return <HarvestForm plan={p} line={line} onSaved={setSaved} />;
        }}
      </Loadable>
    </ManagePage>
  );
}

function HarvestForm({ plan, line, onSaved }: { plan: HarvestPlan; line: HarvestPlanLine; onSaved: (saved: PlanHarvestSaved) => void }) {
  const [draft, setDraft] = useState<PlanHarvestDraft>({ cageCount: "", estimatedKg: "", crew: [], photos: [] });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const crew = useLoad(() => crewSuggestions(line.raftId, todayIso()), [line.raftId]);
  const planned = line.lanes.filter((l) => l.state === "Planned").map((l) => l.laneNumber);

  // Người được phân công làm ở bè hôm nay được chọn sẵn; bỏ chọn ai không đi thu.
  useEffect(() => {
    if (crew.data) setDraft((d) => (d.crew.length ? d : { ...d, crew: crew.data!.employees.map((e) => e.id) }));
  }, [crew.data]);

  const change = (patch: Partial<PlanHarvestDraft>) => {
    setDraft((d) => ({ ...d, ...patch }));
    setError("");
  };

  // Không khóa nút khi đang chọn ảnh: người dùng đóng bộ chọn thì SDK không báo gì.
  const addPhoto = async () => {
    try {
      const photo = await choosePhoto();
      if (photo) change({ photos: [...draft.photos, photo] });
    } catch (err) {
      setError(errorText(err));
    }
  };

  const save = async () => {
    const problem = planHarvestError(draft);
    if (problem) return setError(problem);
    setBusy(true);
    setError("");
    try {
      onSaved(await recordPlanHarvest(line.raftId, line.id, draft));
    } catch (err) {
      setError(errorText(err));
    } finally {
      setBusy(false);
    }
  };

  const early = line.expectedHarvestDate && line.expectedHarvestDate > todayIso() ? line.expectedHarvestDate : null;

  return (
    <>
      <Facts
        items={[
          ["Kế hoạch", plan.code],
          ["Bè", `${line.raftCode} · vùng ${line.zone.code}`],
          ["Luống sẽ thu", planned.join(", ")],
          ["Sản phẩm", line.expectedProduct?.name ?? null],
          ["Dự kiến", line.expectedCageCount !== null ? num(line.expectedCageCount, "lồng") : null],
        ]}
      />
      {early && <p className="form__hint">Hàu của bè dự kiến đủ ngày thu từ {date(early)}. Thu sớm hơn vẫn ghi được, hãy kiểm tra hàu trước.</p>}

      <Section step={1} title="Số lượng">
        <div className="card form">
          <NumberInput label="Số lồng đã thu (bắt buộc)" decimal value={draft.cageCount} disabled={busy} onChange={(v) => change({ cageCount: v })}
            helperText="0,5 là nửa lồng." />
          <NumberInput label="Khối lượng ước tính, kg (không bắt buộc)" decimal value={draft.estimatedKg} disabled={busy} onChange={(v) => change({ estimatedKg: v })}
            helperText="Để trống thì tính theo số lồng. Số kg thật nhập ở bước cân từng lồng." />
        </div>
      </Section>

      <Section step={2} title="Người thu">
        <Loadable data={crew.data} error={crew.error} reload={() => void crew.reload()}>
          {(c) =>
            c.employees.length === 0 ? (
              <p className="form__hint">Hôm nay chưa có ai được phân công ở bè này. Bỏ trống cũng ghi được.</p>
            ) : (
              <div className="card form">
                <p className="form__hint">Người được phân công làm ở bè hôm nay. Bỏ chọn ai không đi thu.</p>
                <div className="crew-list">
                  {c.employees.map((e) => (
                    <label key={e.id} className="crew-choice">
                      <input type="checkbox" checked={draft.crew.includes(e.id)} disabled={busy}
                        onChange={(event) => change({ crew: event.target.checked ? [...draft.crew, e.id] : draft.crew.filter((x) => x !== e.id) })} />
                      <span>{e.name}{e.code ? ` · ${e.code}` : ""}</span>
                    </label>
                  ))}
                </div>
              </div>
            )
          }
        </Loadable>
      </Section>

      <Section step={3} title="Ảnh tại bè (không bắt buộc)">
        <div className="card form">
          <p className="form__hint">Tối đa {HARVEST_LIMITS.photos} ảnh. Đã có {num(draft.photos.length, "ảnh")}.</p>
          <div className="harvest-photos">
            {draft.photos.map((photo, i) => (
              <NewPhoto key={`photo-${i}`} photo={photo} disabled={busy} onRemove={() => change({ photos: draft.photos.filter((_, j) => j !== i) })} />
            ))}
          </div>
          {draft.photos.length < HARVEST_LIMITS.photos && (
            <Button fullWidth size="large" variant="secondary" disabled={busy} onClick={() => void addPhoto()}>
              Chụp hoặc chọn ảnh
            </Button>
          )}
        </div>
      </Section>

      <div className="form block">
        <FormError text={error} />
        <Button fullWidth size="large" loading={busy} disabled={busy} onClick={() => void save()}>
          Lưu lô thu hoạch
        </Button>
      </div>
    </>
  );
}

/** Ảnh vừa chụp: link tạm để xem trước, xóa khi bỏ ảnh hoặc rời màn. */
function NewPhoto({ photo, disabled, onRemove }: { photo: Blob; disabled: boolean; onRemove: () => void }) {
  const [src, setSrc] = useState("");
  useEffect(() => {
    const url = URL.createObjectURL(photo);
    setSrc(url);
    return () => URL.revokeObjectURL(url);
  }, [photo]);
  if (!src) return null;
  return (
    <div className="harvest-photo-tile">
      <img className="harvest-photo" src={src} alt="Ảnh tại bè" />
      <Button variant="tertiary" type="danger" disabled={disabled} onClick={onRemove}>
        Bỏ ảnh
      </Button>
    </div>
  );
}

/** Lô vừa ghi: đi thẳng sang cân từng lồng, hoặc quay lại kế hoạch để thu bè khác. */
function SavedLot({ saved, plan }: { saved: PlanHarvestSaved; plan: HarvestPlan }) {
  const navigate = useNavigate();
  return (
    <div className="form">
      <Empty
        icon="zi-check-circle"
        title={`Đã ghi lô ${saved.lot.lotCode}`}
        text={`${num(saved.lot.cageCount, "lồng")}, ước ${num(saved.lot.estimatedKg, "kg")}. Lô đang chờ cân: cân từng lồng ở cảng rồi bấm Hoàn tất.`}
      />
      <Button fullWidth size="large" onClick={() => navigate(`/manage/weighings/${saved.lot.id}`, { replace: true })}>
        Cân lô này ngay
      </Button>
      {/* Lùi về màn kế hoạch đã mở trước đó; màn đó tải lại nên thấy ngay bè vừa thu. */}
      <Button fullWidth size="large" variant="secondary" onClick={() => navigate(-1)}>
        Về kế hoạch {plan.code}
      </Button>
    </div>
  );
}
