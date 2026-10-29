import { useState } from "react";
import { Button, Sheet, useNavigate, useParams } from "zmp-ui";

import FormError from "@/components/form-error";
import { Actions, Badge, Empty, Facts, Loadable, ManagePage, NumberInput, ReasonSheet, Row, Rows, Section } from "@/components/manage/ui";
import { useAction } from "@/hooks/use-action";
import { useLoad } from "@/hooks/use-load";
import { MESSAGES } from "@/services/acs/messages";
import { getZone, listRafts, setZoneInUse, setZoneThresholds, USAGE, WaterThresholds, zoneLicenses, zoneThresholds } from "@/services/farm";
import { date, num, parseNumber } from "@/services/format";
import { DOCUMENT_TYPE, LICENSE_STATE, statusLabel } from "@/services/labels";

/** Chi tiết một vùng nuôi: thông tin, giấy tờ, ngưỡng chỉ số nước và các bè. */
function ZoneDetailPage() {
  const { id = "" } = useParams();
  const navigate = useNavigate();
  const zone = useLoad(() => getZone(id), [id]);
  const licenses = useLoad(() => zoneLicenses(id), [id]);
  const rafts = useLoad(() => listRafts(id), [id]);
  const thresholds = useLoad(() => zoneThresholds(id), [id]);
  const { busy, run } = useAction();
  const [statusOpen, setStatusOpen] = useState(false);
  const [thresholdOpen, setThresholdOpen] = useState(false);

  const inUse = zone.data?.statusId === USAGE.inUse;

  return (
    <ManagePage title={zone.data?.name ?? "Vùng nuôi"}>
      <Loadable data={zone.data} error={zone.error} reload={() => void zone.reload()}>
        {(z) => {
          const status = statusLabel(z.status);
          return (
            <>
              <Facts
                items={[
                  ["Mã vùng", z.code],
                  ["Trạng thái", <Badge key="s" text={status.text} tone={status.tone} />],
                  ["Vị trí", z.location],
                  ["Diện tích", z.area !== null ? num(z.area, "ha") : null],
                  ["Tọa độ", z.latitude !== null && z.longitude !== null ? `${z.latitude}, ${z.longitude}` : null],
                  ["Điểm đo nước", z.waterMeasurementPoint],
                  ["Bè đang dùng", `${num(z.inUseRaftCount)} bè`],
                ]}
              />
              <Actions>
                <Button variant="secondary" size="large" onClick={() => navigate(`/manage/zones/${z.id}/map`)}>
                  Bản đồ bè
                </Button>
                <Button variant="secondary" size="large" onClick={() => navigate(`/manage/zones/${z.id}/edit`)}>
                  Sửa
                </Button>
                <Button variant="secondary" size="large" type={inUse ? "danger" : "highlight"} onClick={() => setStatusOpen(true)}>
                  {inUse ? "Ngừng dùng" : "Dùng lại"}
                </Button>
              </Actions>
            </>
          );
        }}
      </Loadable>

      <Section title="Giấy tờ pháp lý">
        <Loadable data={licenses.data} error={licenses.error} reload={() => void licenses.reload()}>
          {(overview) =>
            overview.licenses.length === 0 ? (
              <Empty icon="zi-file" title="Chưa có giấy tờ" />
            ) : (
              <Rows>
                {overview.licenses.map((l) => {
                  const state = LICENSE_STATE[l.state] ?? { text: l.state, tone: "neutral" as const };
                  return (
                    <Row
                      key={l.documentType ?? l.documentId ?? l.documentNumber}
                      title={DOCUMENT_TYPE[l.documentType ?? ""] ?? l.documentTypeName}
                      meta={l.documentNumber ? `Số ${l.documentNumber}${l.expiryDate ? ` · hết hạn ${date(l.expiryDate)}` : ""}` : "Chưa có giấy tờ này"}
                      badge={<Badge text={state.text} tone={state.tone} />}
                      onClick={l.documentId ? () => navigate(`/manage/licenses/${l.documentId}`) : undefined}
                    />
                  );
                })}
              </Rows>
            )
          }
        </Loadable>
      </Section>

      <Section
        title="Chỉ số nước"
        action={
          <Button size="small" variant="tertiary" onClick={() => navigate(`/manage/water?zone=${id}`)}>
            Xem số đo
          </Button>
        }
      >
        <Loadable data={thresholds.data} error={thresholds.error} reload={() => void thresholds.reload()}>
          {(t) => (
            <>
              <Facts
                items={[
                  ["Ngưỡng pH", range(t.thresholds.phMin, t.thresholds.phMax, "")],
                  ["Ngưỡng độ mặn", range(t.thresholds.salinityMin, t.thresholds.salinityMax, "‰")],
                ]}
              />
              <Actions>
                <Button variant="secondary" size="large" onClick={() => setThresholdOpen(true)}>
                  Đổi ngưỡng
                </Button>
              </Actions>
            </>
          )}
        </Loadable>
      </Section>

      <Section
        title="Bè"
        action={
          <Button size="small" variant="tertiary" onClick={() => navigate(`/manage/zones/${id}/rafts/new`)}>
            Thêm bè
          </Button>
        }
      >
        <Loadable data={rafts.data} error={rafts.error} reload={() => void rafts.reload()}>
          {(list) =>
            list.length === 0 ? (
              <Empty icon="zi-more-grid" title="Vùng này chưa có bè" />
            ) : (
              <Rows>
                {list.map((r) => {
                  const s = statusLabel(r.status);
                  return (
                    <Row
                      key={r.id}
                      title={`Bè ${r.code}`}
                      meta={[r.size, `${r.laneCount} hàng`].filter(Boolean).join(" · ")}
                      badge={r.statusId !== USAGE.inUse ? <Badge text={s.text} tone={s.tone} /> : undefined}
                      onClick={() => navigate(`/manage/rafts/${r.id}`)}
                    />
                  );
                })}
              </Rows>
            )
          }
        </Loadable>
      </Section>

      <ReasonSheet
        visible={statusOpen}
        title={inUse ? "Ngừng dùng vùng nuôi" : "Dùng lại vùng nuôi"}
        intro={inUse ? "Vùng ngừng dùng không nhận bè, chu kỳ nuôi hay số đo mới. Dữ liệu cũ vẫn giữ nguyên." : "Vùng sẽ dùng lại được cho bè và số đo mới."}
        confirmText={inUse ? "Ngừng dùng" : "Dùng lại"}
        busy={busy}
        onClose={() => setStatusOpen(false)}
        onConfirm={async (reason) => {
          if (!zone.data) return false;
          const saved = await run(() => setZoneInUse(id, !inUse, reason, zone.data!.rowVersion), inUse ? "Đã ngừng dùng vùng nuôi." : "Đã dùng lại vùng nuôi.");
          if (saved) zone.setData(saved);
          return !!saved;
        }}
      />

      {thresholds.data && (
        <ThresholdSheet
          visible={thresholdOpen}
          initial={thresholds.data.thresholds}
          onClose={() => setThresholdOpen(false)}
          onSave={async (value) => {
            const saved = await run(() => setZoneThresholds(id, value), MESSAGES.MSG10("ngưỡng chỉ số nước"));
            if (saved) thresholds.setData(saved);
            return !!saved;
          }}
          busy={busy}
        />
      )}
    </ManagePage>
  );
}

function range(min: number | null, max: number | null, unit: string) {
  if (min === null && max === null) return "Chưa đặt";
  return `${num(min)} – ${num(max)}${unit ? ` ${unit}` : ""}`;
}

/** Sửa ngưỡng pH, độ mặn của một vùng. Số đo ngoài ngưỡng sẽ báo cảnh báo (MSG27). */
function ThresholdSheet({
  visible,
  initial,
  busy,
  onClose,
  onSave,
}: {
  visible: boolean;
  initial: WaterThresholds;
  busy: boolean;
  onClose: () => void;
  onSave: (value: WaterThresholds) => Promise<boolean>;
}) {
  const text = (n: number | null) => (n === null ? "" : String(n).replace(".", ","));
  const [phMin, setPhMin] = useState(text(initial.phMin));
  const [phMax, setPhMax] = useState(text(initial.phMax));
  const [salMin, setSalMin] = useState(text(initial.salinityMin));
  const [salMax, setSalMax] = useState(text(initial.salinityMax));
  const [error, setError] = useState("");

  const save = async () => {
    const value = { phMin: parseNumber(phMin), phMax: parseNumber(phMax), salinityMin: parseNumber(salMin), salinityMax: parseNumber(salMax) };
    if ((value.phMin !== null && value.phMax !== null && value.phMin >= value.phMax) || (value.salinityMin !== null && value.salinityMax !== null && value.salinityMin >= value.salinityMax)) {
      setError("Giá trị nhỏ nhất phải nhỏ hơn giá trị lớn nhất.");
      return;
    }
    setError("");
    if (await onSave(value)) onClose();
  };

  return (
    <Sheet visible={visible} onClose={onClose} autoHeight mask handler swipeToClose title="Ngưỡng chỉ số nước">
      <div className="sheet-form form">
        <p className="form__intro">Số đo nằm ngoài khoảng này sẽ được đánh dấu vượt ngưỡng và gửi cảnh báo.</p>
        <div className="two-col">
          <NumberInput decimal label="pH thấp nhất" value={phMin} onChange={setPhMin} disabled={busy} />
          <NumberInput decimal label="pH cao nhất" value={phMax} onChange={setPhMax} disabled={busy} />
        </div>
        <div className="two-col">
          <NumberInput decimal label="Độ mặn thấp nhất (‰)" value={salMin} onChange={setSalMin} disabled={busy} />
          <NumberInput decimal label="Độ mặn cao nhất (‰)" value={salMax} onChange={setSalMax} disabled={busy} />
        </div>
        <FormError text={error} />
        <Button fullWidth size="large" loading={busy} disabled={busy} onClick={() => void save()}>
          Lưu ngưỡng
        </Button>
      </div>
    </Sheet>
  );
}

export default ZoneDetailPage;
