import { useState } from "react";
import { Button, useNavigate, useParams, useSnackbar } from "zmp-ui";

import { Actions } from "@/components/Actions/Actions";
import { Badge } from "@/components/Badge/Badge";
import { Facts } from "@/components/Facts/Facts";
import { Loadable } from "@/components/Loadable/Loadable";
import { ManagePage } from "@/components/ManagePage/ManagePage";
import { ReasonSheet } from "@/components/ReasonSheet/ReasonSheet";
import { Row } from "@/components/Row/Row";
import { Rows } from "@/components/Rows/Rows";
import { Section } from "@/components/Section/Section";
import { useAction } from "@/hooks/useAction";
import { useLoad } from "@/hooks/useLoad";
import { getRaft, setRaftInUse, uploadRaftPhoto, USAGE } from "@/features/farming/services/farmService";
import { absoluteUrl } from "@/services/httpClient";
import { choosePhoto } from "@/services/zaloService";
import { date, money, num } from "@/utils/format";
import { statusLabel } from "@/utils/labels";

/** Chi tiết một bè: thông tin, các hàng treo hàu, lịch sử bố trí hàng và chi phí vật tư đã nhập cho bè. */
function RaftDetailPage() {
  const { raftId: id = "" } = useParams();
  const navigate = useNavigate();
  const { data, error, reload, setData } = useLoad(() => getRaft(id), [id]);
  const { busy, run } = useAction();
  const [statusOpen, setStatusOpen] = useState(false);
  const { openSnackbar } = useSnackbar();
  const inUse = data?.statusId === USAGE.inUse;

  // Không bọc `choosePhoto` trong `run`: người dùng đóng bộ chọn ảnh thì SDK không báo, nút sẽ bị khóa mãi.
  const changePhoto = async () => {
    let photo: Blob | null;
    try {
      photo = await choosePhoto();
    } catch (err) {
      openSnackbar({ text: err instanceof Error ? err.message : "", type: "error", duration: 6000 });
      return;
    }
    if (!photo) return;
    const saved = await run(() => uploadRaftPhoto(id, photo), "Đã lưu ảnh bè.");
    if (saved) setData(saved);
  };

  return (
    <ManagePage title={data ? `Bè ${data.code}` : "Bè"}>
      <Loadable data={data} error={error} reload={() => void reload()}>
        {(r) => {
          const s = statusLabel(r.status);
          return (
            <>
              {r.photoUrl && <img className="record-photo" src={absoluteUrl(r.photoUrl) ?? undefined} alt={`Ảnh bè ${r.code}`} />}
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
                {inUse && (
                  <Button variant="secondary" size="large" disabled={busy} loading={busy} onClick={() => void changePhoto()}>
                    {r.photoUrl ? "Đổi ảnh bè" : "Thêm ảnh bè"}
                  </Button>
                )}
                <Button variant="secondary" size="large" onClick={() => navigate(`/manage/rafts/${r.id}/edit`)}>
                  Sửa thông tin bè
                </Button>
                <Button variant="secondary" size="large" type={inUse ? "danger" : "highlight"} onClick={() => setStatusOpen(true)}>
                  {inUse ? "Ngừng dùng bè" : "Dùng lại bè"}
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
        danger={inUse}
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
