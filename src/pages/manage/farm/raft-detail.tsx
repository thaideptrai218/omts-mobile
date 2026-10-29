import { useState } from "react";
import { Button, useNavigate, useParams } from "zmp-ui";

import { Actions, Badge, Facts, Loadable, ManagePage, ReasonSheet, Row, Rows, Section } from "@/components/manage/ui";
import { useAction } from "@/hooks/use-action";
import { useLoad } from "@/hooks/use-load";
import { getRaft, setRaftInUse, USAGE } from "@/services/farm";
import { date, money, num } from "@/services/format";
import { statusLabel } from "@/services/labels";

/** Chi tiết một bè: thông tin, các hàng treo hàu, lịch sử bố trí hàng và chi phí vật tư đã nhập cho bè. */
function RaftDetailPage() {
  const { raftId: id = "" } = useParams();
  const navigate = useNavigate();
  const { data, error, reload, setData } = useLoad(() => getRaft(id), [id]);
  const { busy, run } = useAction();
  const [statusOpen, setStatusOpen] = useState(false);
  const inUse = data?.statusId === USAGE.inUse;

  return (
    <ManagePage title={data ? `Bè ${data.code}` : "Bè"}>
      <Loadable data={data} error={error} reload={() => void reload()}>
        {(r) => {
          const s = statusLabel(r.status);
          return (
            <>
              <Facts
                items={[
                  ["Vùng nuôi", r.zone.name],
                  ["Trạng thái", <Badge key="s" text={s.text} tone={s.tone} />],
                  ["Kích thước", r.size],
                  ["Vị trí", r.location],
                  ["Tọa độ", r.latitude !== null && r.longitude !== null ? `${r.latitude}, ${r.longitude}` : null],
                  ["Tình trạng", r.conditionNotes],
                  ["Chi phí vật tư đã nhập", r.materialCost !== null ? money(r.materialCost) : null],
                ]}
              />
              <Actions>
                <Button variant="secondary" size="large" onClick={() => navigate(`/manage/rafts/${r.id}/edit`)}>
                  Sửa
                </Button>
                <Button variant="secondary" size="large" type={inUse ? "danger" : "highlight"} onClick={() => setStatusOpen(true)}>
                  {inUse ? "Ngừng dùng" : "Dùng lại"}
                </Button>
              </Actions>

              <Section title={`Các hàng (bố trí lần ${r.layoutVersion})`}>
                <Rows>
                  {r.lanes.map((l) => (
                    <Row
                      key={l.id ?? l.laneNumber}
                      title={`Hàng ${l.laneNumber}`}
                      meta={[l.markerA && `Mốc đầu: ${l.markerA}`, l.markerB && `Mốc cuối: ${l.markerB}`].filter(Boolean).join(" · ") || undefined}
                      value={l.length !== null ? num(l.length, "m") : undefined}
                    />
                  ))}
                </Rows>
              </Section>

              {r.layoutVersions.length > 1 && (
                <Section title="Lịch sử bố trí hàng">
                  <Rows>
                    {r.layoutVersions.map((v) => (
                      <Row key={v.versionNumber} title={`Lần ${v.versionNumber}: ${v.laneCount} hàng`} meta={`Từ ${date(v.validFrom)}${v.validTo ? ` đến ${date(v.validTo)}` : " đến nay"}`} />
                    ))}
                  </Rows>
                </Section>
              )}
            </>
          );
        }}
      </Loadable>

      <ReasonSheet
        visible={statusOpen}
        title={inUse ? "Ngừng dùng bè" : "Dùng lại bè"}
        intro={inUse ? "Bè ngừng dùng không thả giống hay ghi nhật ký mới được. Dữ liệu cũ vẫn giữ nguyên." : undefined}
        confirmText={inUse ? "Ngừng dùng" : "Dùng lại"}
        busy={busy}
        onClose={() => setStatusOpen(false)}
        onConfirm={async (reason) => {
          if (!data) return false;
          const saved = await run(() => setRaftInUse(id, !inUse, reason, data.rowVersion), inUse ? "Đã ngừng dùng bè." : "Đã dùng lại bè.");
          if (saved) setData(saved);
          return !!saved;
        }}
      />
    </ManagePage>
  );
}

export default RaftDetailPage;
