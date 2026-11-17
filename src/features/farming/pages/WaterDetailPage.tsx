import { useState } from "react";
import { Button, useParams } from "zmp-ui";

import { Actions } from "@/components/Actions/Actions";
import { Badge } from "@/components/Badge/Badge";
import { Facts } from "@/components/Facts/Facts";
import { Loadable } from "@/components/Loadable/Loadable";
import { ManagePage } from "@/components/ManagePage/ManagePage";
import { ReasonSheet } from "@/components/ReasonSheet/ReasonSheet";
import { useAction } from "@/hooks/useAction";
import { useBusinessPermission } from "@/hooks/useBusinessPermission";
import { useLoad } from "@/hooks/useLoad";
import { absoluteUrl } from "@/services/httpClient";
import { dateTime, num } from "@/utils/format";
import { violatedText, WATER_ALERT, waterStatusLabel } from "@/utils/labels";
import { WaterValuesSheet } from "@/features/farming/components/WaterValuesSheet/WaterValuesSheet";
import { correctWater, getWater, voidWater } from "@/features/farming/services/farmService";
import { rangeText } from "@/features/farming/utils/waterText";

/**
 * Chi tiết một lần đo nước (WATER-03.2): ảnh máy đo, bè, ba chỉ số và ngưỡng đã lưu theo lần đo. Lần đo đang hiệu lực thì
 * người có quyền sửa tại chỗ (bắt ghi lý do, ngưỡng không đổi) hoặc hủy kèm lý do (WATER-02); hủy thì không hoàn tác.
 */
function WaterDetailPage() {
  const { id = "" } = useParams();
  const allowed = useBusinessPermission();
  const { data, error, reload, setData } = useLoad(() => getWater(id), [id]);
  const { busy, run } = useAction();
  const [correcting, setCorrecting] = useState(false);
  const [voidOpen, setVoidOpen] = useState(false);

  const editable = data?.statusCode === "ACTIVE" && allowed("WATER_MEASUREMENTS", "Edit", data.zoneId);

  return (
    <ManagePage title="Số đo nước">
      <Loadable data={data} error={error} reload={() => void reload()}>
        {(m) => {
          const status = waterStatusLabel(m.statusCode);
          const alert = WATER_ALERT[m.alertState];
          const t = m.thresholdsUsed;
          return (
            <>
              {m.alertState === "Active" && (
                <p className="form-error" role="alert">
                  Vượt ngưỡng{m.violatedValues ? `: ${violatedText(m.violatedValues)}` : ""}. Kiểm tra lại nước ở vùng {m.zoneName}.
                </p>
              )}
              {m.photoUrl && <img className="record-photo" src={absoluteUrl(m.photoUrl) ?? undefined} alt="Ảnh máy đo" />}
              <Facts
                items={[
                  ["Vùng nuôi", `${m.zoneCode} · ${m.zoneName}`],
                  ["Bè", m.raftCode],
                  ["Thời điểm đo", dateTime(m.measuredAt)],
                  ["Độ pH", num(m.ph)],
                  ["Độ mặn", num(m.salinity, "‰")],
                  ["Nhiệt độ", num(m.temperature, "°C")],
                  ["Trạng thái", <Badge key="s" text={status.text} tone={status.tone} />],
                  ["So với ngưỡng", alert ? <Badge key="a" text={alert.text} tone={alert.tone} /> : null],
                  ["Ngưỡng pH", rangeText(t.phMin, t.phMax)],
                  ["Ngưỡng độ mặn", rangeText(t.salinityMin, t.salinityMax, "‰")],
                  ["Ngưỡng nhiệt độ", rangeText(t.temperatureMin, t.temperatureMax, "°C")],
                  ["Đã gửi cảnh báo lúc", m.alertedAt ? dateTime(m.alertedAt) : null],
                  ["Người đo", m.measuredBy?.name],
                  ["Lý do hủy", m.voidReason],
                ]}
              />
              {editable && (
                <Actions>
                  <Button variant="secondary" size="large" onClick={() => setCorrecting(true)}>
                    Sửa số đo
                  </Button>
                  <Button variant="secondary" type="danger" size="large" onClick={() => setVoidOpen(true)}>
                    Hủy số đo
                  </Button>
                </Actions>
              )}

              {correcting && (
                <WaterValuesSheet
                  visible
                  title="Sửa số đo nước"
                  zoneId={m.zoneId}
                  initial={{ raftId: m.raftId, raftCode: m.raftCode, measuredAt: m.measuredAt, ph: m.ph, salinity: m.salinity, temperature: m.temperature }}
                  notice="Số đo được sửa tại chỗ và ghi lại lý do. Ngưỡng đã lưu theo lần đo này không đổi."
                  thresholds={t}
                  withReason
                  saveText="Lưu số đã sửa"
                  onClose={() => setCorrecting(false)}
                  onSave={async (values, reason) => {
                    const saved = await correctWater(id, { ...values, reason });
                    setData(saved);
                    setCorrecting(false);
                  }}
                />
              )}
            </>
          );
        }}
      </Loadable>

      <ReasonSheet
        visible={voidOpen}
        title="Hủy số đo"
        intro="Số đo bị hủy không còn tính vào biểu đồ và cảnh báo. Không hoàn tác được."
        confirmText="Hủy số đo"
        required
        danger
        busy={busy}
        onClose={() => setVoidOpen(false)}
        onConfirm={async (reason) => {
          const saved = await run(() => voidWater(id, reason), "Đã hủy số đo.");
          if (saved) setData(saved);
          return Boolean(saved);
        }}
      />
    </ManagePage>
  );
}

export default WaterDetailPage;
