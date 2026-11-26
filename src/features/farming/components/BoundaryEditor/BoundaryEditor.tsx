import type { BoundaryDraft } from "@/features/farming/hooks/useBoundaryDraft";
import { Button, Input } from "zmp-ui";

import { Empty } from "@/components/Empty/Empty";
import { BoundaryAreaCard, CornerSheet } from "@/features/farming/components/BoundaryAreaCard/BoundaryAreaCard";

/** Ô kinh tuyến trục ghi ở đầu bảng tọa độ, dùng để đổi X, Y sang vĩ độ, kinh độ. */
export function MeridianInput({ draft, disabled }: { draft: BoundaryDraft; disabled: boolean }) {
  return (
    <Input
      label="Kinh tuyến trục (ghi ở đầu bảng tọa độ)"
      helperText="Dùng để đổi X, Y sang vĩ độ, kinh độ. Quảng Ninh: 107°45'."
      value={draft.meridianInput}
      onChange={(event) => draft.changeMeridian(event.target.value)}
      disabled={disabled}
    />
  );
}

/** Các khu và điểm góc để đối chiếu, thêm, sửa, xóa; sửa một điểm mở sheet riêng. */
export function BoundaryAreas({ draft, disabled, emptyText }: { draft: BoundaryDraft; disabled: boolean; emptyText: string }) {
  const { areas, editing, meridian, updateArea, setAreas, setEditing } = draft;
  return (
    <>
      <div className="form">
        {areas.length === 0 ? (
          <Empty icon="zi-location" title="Chưa có điểm góc" text={emptyText} />
        ) : (
          areas.map((area) => (
            <BoundaryAreaCard
              key={area.key}
              area={area}
              centralMeridian={meridian}
              disabled={disabled}
              onRename={(name) => updateArea(area.key, (current) => ({ ...current, name }))}
              onEditCorner={(corner) => setEditing({ area: area.key, corner })}
              onAddCorner={() => draft.addCorner(area)}
              onRemove={() => setAreas((current) => current.filter((item) => item.key !== area.key))}
            />
          ))
        )}
        <Button fullWidth size="large" variant="secondary" disabled={disabled} onClick={draft.addArea}>Nhập một khu bằng tay</Button>
      </div>
      <CornerSheet
        corner={editing?.corner ?? null}
        centralMeridian={meridian}
        onClose={() => setEditing(null)}
        onSave={(corner) => {
          if (editing) updateArea(editing.area, (area) => ({ ...area, corners: area.corners.map((item) => (item.key === corner.key ? corner : item)) }));
          setEditing(null);
        }}
        onRemove={(corner) => {
          if (editing) updateArea(editing.area, (area) => ({ ...area, corners: area.corners.filter((item) => item.key !== corner.key) }));
          setEditing(null);
        }}
      />
    </>
  );
}

/** Các điều chưa chắc của ranh giới, hỏi lại trước khi lưu; không có gì thì không hiện gì. */
export function BoundaryConcerns({ draft }: { draft: BoundaryDraft }) {
  const { doubts, unchecked, strays, crossing } = draft.concerns;
  return (
    <>
      {doubts > 0 && <p>{doubts} điểm có vĩ/kinh độ chưa khớp X, Y.</p>}
      {unchecked > 0 && <p>{unchecked} điểm chưa đối chiếu được giữa vĩ/kinh độ và X, Y.</p>}
      {strays > 0 && <p>{strays} điểm nằm xa bất thường so với các điểm khác cùng khu.</p>}
      {crossing.length > 0 && <p>Đường ranh giới của {crossing.join(", ")} tự cắt nhau.</p>}
    </>
  );
}

/** Có điều nào của {@link BoundaryConcerns} để hỏi lại không. */
export const hasConcerns = ({ concerns }: BoundaryDraft) => concerns.doubts > 0 || concerns.unchecked > 0 || concerns.strays > 0 || concerns.crossing.length > 0;
