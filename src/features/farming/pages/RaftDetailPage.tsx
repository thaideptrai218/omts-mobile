import { useAtomValue } from "jotai";
import { useState } from "react";
import { Button, useNavigate, useParams, useSnackbar } from "zmp-ui";

import { Actions } from "@/components/Actions/Actions";
import { Badge } from "@/components/Badge/Badge";
import { ConfirmSheet } from "@/components/ConfirmSheet/ConfirmSheet";
import { Facts } from "@/components/Facts/Facts";
import { Loadable } from "@/components/Loadable/Loadable";
import { ManagePage } from "@/components/ManagePage/ManagePage";
import { ReasonSheet } from "@/components/ReasonSheet/ReasonSheet";
import { Row } from "@/components/Row/Row";
import { Rows } from "@/components/Rows/Rows";
import { Section } from "@/components/Section/Section";
import { permissionsAtom } from "@/features/auth/state/authAtoms";
import { useAction } from "@/hooks/useAction";
import { useLoad } from "@/hooks/useLoad";
import { absoluteUrl } from "@/services/httpClient";
import { choosePhoto } from "@/services/zaloService";
import { money } from "@/utils/format";
import { statusLabel } from "@/utils/labels";
import { addRaftPhoto, getRaft, removeRaftPhoto, setRaftInUse, USAGE } from "@/features/farming/services/farmService";

const MAX_PHOTOS = 3;
const LANE_REMOVED = 2002;

/**
 * Chi tiết một bè (FARM-04): thông tin, tối đa ba ảnh, các hàng đang dùng và đã gỡ, tiền vật tư đã dùng sửa bè. Thêm, xóa
 * ảnh và sửa bè chỉ Chủ HTX làm được (backend `[RequireCooperativeOwner]`).
 */
function RaftDetailPage() {
  const { raftId: id = "" } = useParams();
  const navigate = useNavigate();
  const isOwner = useAtomValue(permissionsAtom)?.isCooperativeOwner ?? false;
  const { data, error, reload, setData } = useLoad(() => getRaft(id), [id]);
  const { busy, run } = useAction();
  const [statusOpen, setStatusOpen] = useState(false);
  const [removingPhoto, setRemovingPhoto] = useState<string | null>(null);
  const { openSnackbar } = useSnackbar();
  const inUse = data?.statusId === USAGE.inUse;

  // Không bọc `choosePhoto` trong `run`: người dùng đóng bộ chọn ảnh thì SDK không báo, nút sẽ bị khóa mãi.
  const addPhoto = async () => {
    let photo: Blob | null;
    try {
      photo = await choosePhoto();
    } catch (err) {
      openSnackbar({ text: err instanceof Error ? err.message : "", type: "error", duration: 6000 });
      return;
    }
    if (!photo) return;
    const saved = await run(() => addRaftPhoto(id, photo), "Đã thêm ảnh bè.");
    if (saved) setData(saved.raft);
  };

  const removePhoto = async () => {
    if (!removingPhoto) return;
    const saved = await run(() => removeRaftPhoto(id, removingPhoto), "Đã xóa ảnh bè.");
    setRemovingPhoto(null);
    if (saved) setData(saved.raft);
  };

  return (
    <ManagePage title={data ? `Bè ${data.code}` : "Bè"}>
      <Loadable data={data} error={error} reload={() => void reload()}>
        {(r) => {
          const s = statusLabel(r.status);
          const removed = r.lanes.filter((l) => l.statusId === LANE_REMOVED);
          return (
            <>
              {r.photos.map((p) => (
                <div key={p.id}>
                  <img className="record-photo" src={absoluteUrl(p.url) ?? undefined} alt={`Ảnh ${p.sortOrder} của bè ${r.code}`} />
                  {isOwner && (
                    <Button variant="tertiary" type="danger" size="large" disabled={busy} onClick={() => setRemovingPhoto(p.id)}>
                      Xóa ảnh này
                    </Button>
                  )}
                </div>
              ))}
              <Facts
                items={[
                  ["Vùng nuôi", r.zone.name],
                  ["Trạng thái", <Badge key="s" text={s.text} tone={s.tone} />],
                  ["Số hàng đang dùng", `${r.laneCount} hàng`],
                  ["Kích thước", r.size],
                  ["Vị trí", r.location],
                  ["Tọa độ", r.latitude !== null && r.longitude !== null ? `${r.latitude}, ${r.longitude}` : null],
                  ["Tình trạng", r.conditionNotes],
                  ["Tiền vật tư đã dùng sửa bè", r.materialCost !== null ? money(r.materialCost) : null],
                ]}
              />
              <Actions>
                <Button variant="secondary" size="large" onClick={() => navigate(`/manage/rafts/${r.id}/material-usages`)}>
                  Vật tư đã dùng sửa bè
                </Button>
                {isOwner && inUse && r.photos.length < MAX_PHOTOS && (
                  <Button variant="secondary" size="large" disabled={busy} loading={busy} onClick={() => void addPhoto()}>
                    Thêm ảnh bè ({r.photos.length}/{MAX_PHOTOS})
                  </Button>
                )}
                {isOwner && (
                  <Button variant="secondary" size="large" onClick={() => navigate(`/manage/rafts/${r.id}/edit`)}>
                    Sửa thông tin bè
                  </Button>
                )}
                {isOwner && (
                  <Button variant="secondary" size="large" type={inUse ? "danger" : "highlight"} onClick={() => setStatusOpen(true)}>
                    {inUse ? "Ngừng dùng bè" : "Dùng lại bè"}
                  </Button>
                )}
              </Actions>

              {removed.length > 0 && (
                <Section title="Hàng đã gỡ">
                  <Rows>
                    {removed.map((l) => (
                      <Row key={l.id} title={`Hàng ${l.laneNumber}`} meta="Đã gỡ khỏi bè; dữ liệu cũ của hàng vẫn giữ." badge={<Badge text="Đã gỡ" tone="neutral" />} />
                    ))}
                  </Rows>
                </Section>
              )}
            </>
          );
        }}
      </Loadable>

      <ConfirmSheet
        visible={removingPhoto !== null}
        title="Xóa ảnh bè?"
        message="Ảnh này sẽ bị xóa khỏi bè."
        confirmText="Xóa ảnh"
        danger
        busy={busy}
        onClose={() => setRemovingPhoto(null)}
        onConfirm={() => void removePhoto()}
      />

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
