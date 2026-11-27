import type { AreaDraft, CornerCheck, CornerDraft } from "@/features/farming/models/ZoneBoundary";
import type { Tone } from "@/models/UI";
import { useState } from "react";
import { Button, Input, Sheet } from "zmp-ui";

import { Actions } from "@/components/Actions/Actions";
import { Badge } from "@/components/Badge/Badge";
import { Row } from "@/components/Row/Row";
import { Rows } from "@/components/Rows/Rows";
import { areaCheck } from "@/features/farming/utils/boundaryScan";
import { areaPositions, checkCorner, ringAreaHa, selfIntersects, strayCorners } from "@/features/farming/utils/zoneBoundary";
import { num } from "@/utils/format";

/**
 * Nhãn đối chiếu của một điểm, có chữ chứ không chỉ có màu. Điểm không đối chiếu được giữa vĩ/kinh độ và X, Y là mức cảnh
 * báo: khi thử OCR, phần lớn điểm đọc sai rơi vào loại này.
 */
export function cornerBadge(check: CornerCheck, strayM?: number): { text: string; tone: Tone } {
  if (strayM !== undefined) return { text: `Xa các điểm khác ${Math.round(strayM).toLocaleString("vi-VN")} m`, tone: "danger" };
  switch (check.state) {
    case "match": return { text: "Khớp X, Y", tone: "success" };
    case "mismatch": return { text: `Lệch X, Y ${Math.round(check.gapM ?? 0).toLocaleString("vi-VN")} m`, tone: "danger" };
    case "dmsOnly": return { text: "Chưa có X, Y để đối chiếu", tone: "warning" };
    case "gridOnly": return { text: "Chưa có vĩ/kinh độ để đối chiếu", tone: "warning" };
    case "outside": return { text: "Ngoài Việt Nam", tone: "danger" };
    default: return { text: "Thiếu số", tone: "danger" };
  }
}

/** Một khu trên sơ đồ: tên, các điểm góc theo thứ tự và kết quả đối chiếu từng điểm. */
export function BoundaryAreaCard({ area, centralMeridian, disabled, onRename, onEditCorner, onAddCorner, onRemove }: {
  area: AreaDraft;
  centralMeridian: number;
  disabled: boolean;
  onRename: (name: string) => void;
  onEditCorner: (corner: CornerDraft) => void;
  onAddCorner: () => void;
  onRemove: () => void;
}) {
  const positions = areaPositions(area, centralMeridian).map(({ position }) => position);
  const checks = area.corners.map((corner) => checkCorner(corner, centralMeridian));
  const matched = checks.filter((check) => check.state === "match").length;
  const stray = strayCorners(area, centralMeridian);
  const check = areaCheck(area);
  return (
    <div className="card form">
      <Input label="Tên khu" value={area.name} onChange={(event) => onRename(event.target.value)} maxLength={100} disabled={disabled} />
      <p className="form__hint">
        {area.corners.length} điểm góc · {matched} điểm khớp X, Y
        {positions.length >= 3 ? ` · diện tích khoảng ${num(Math.round(ringAreaHa(positions) * 100) / 100, "ha")}` : ""}
      </p>
      {check.writtenHa !== null && (
        <p className="form__hint">
          Tính từ tọa độ: {check.gridHa === null ? "chưa đủ điểm" : num(Math.round(check.gridHa * 100) / 100, "ha")} · Giấy ghi: {num(check.writtenHa, "ha")}{" "}
          {check.matches === true && <Badge text="Khớp diện tích" tone="success" />}
          {check.matches === false && <Badge text="Lệch diện tích, kiểm tra lại tọa độ" tone="warning" />}
        </p>
      )}
      {positions.length < 3 && <p className="form-error form-warning" role="alert"><span>Cần ít nhất 3 điểm có tọa độ để khoanh khu này.</span></p>}
      {selfIntersects(positions) && <p className="form-error form-warning" role="alert"><span>Đường ranh giới tự cắt nhau: có điểm sai thứ tự hoặc đọc sai số. Đối chiếu lại với giấy.</span></p>}
      <Rows>
        {area.corners.map((corner, index) => {
          const badge = cornerBadge(checks[index], stray.get(corner.key));
          return (
            <Row
              key={corner.key}
              title={corner.label || `Điểm ${index + 1}`}
              meta={corner.latitude || corner.longitude ? `Vĩ độ ${corner.latitude || "?"} · Kinh độ ${corner.longitude || "?"}` : corner.x || corner.y ? `X ${corner.x || "?"} · Y ${corner.y || "?"}` : "Chưa có số"}
              badge={<Badge text={badge.text} tone={badge.tone} />}
              onClick={disabled ? undefined : () => onEditCorner(corner)}
            />
          );
        })}
      </Rows>
      <Actions>
        <Button variant="secondary" size="large" disabled={disabled} onClick={onAddCorner}>Thêm điểm góc</Button>
        <Button variant="secondary" size="large" type="danger" disabled={disabled} onClick={onRemove}>Bỏ khu này</Button>
      </Actions>
    </div>
  );
}

/** Sửa một điểm góc. Vĩ/kinh độ gõ như trên giấy (21°07'06.66" hoặc 21 07 06.66); X, Y tính bằng mét. */
export function CornerSheet({ corner, centralMeridian, onSave, onRemove, onClose }: {
  corner: CornerDraft | null;
  centralMeridian: number;
  onSave: (corner: CornerDraft) => void;
  onRemove: (corner: CornerDraft) => void;
  onClose: () => void;
}) {
  return (
    <Sheet visible={!!corner} onClose={onClose} height="85vh" mask handler swipeToClose title="Điểm góc">
      {corner && <CornerForm key={corner.key} corner={corner} centralMeridian={centralMeridian} onSave={onSave} onRemove={onRemove} />}
    </Sheet>
  );
}

function CornerForm({ corner, centralMeridian, onSave, onRemove }: {
  corner: CornerDraft;
  centralMeridian: number;
  onSave: (corner: CornerDraft) => void;
  onRemove: (corner: CornerDraft) => void;
}) {
  const [draft, setDraft] = useState(corner);
  const check = checkCorner(draft, centralMeridian);
  const badge = cornerBadge(check);
  const set = (field: keyof CornerDraft) => (event: { target: { value: string } }) => setDraft((current) => ({ ...current, [field]: event.target.value }));
  return (
    <div className="sheet-form form">
      <p className="form__intro">Gõ đúng như trên sơ đồ (hệ VN-2000). Có cả vĩ/kinh độ và X, Y thì app đối chiếu hai cột với nhau để bắt số đọc sai.</p>
      <Input label="Tên điểm" value={draft.label} onChange={set("label")} maxLength={20} />
      <Input label="Vĩ độ" placeholder={`21°07'06.66"`} helperText={`Ví dụ: 21°07'06.66" hoặc 21 07 06.66`} value={draft.latitude} onChange={set("latitude")} />
      <Input label="Kinh độ" placeholder={`107°30'41.08"`} helperText={`Ví dụ: 107°30'41.08" hoặc 107 30 41.08`} value={draft.longitude} onChange={set("longitude")} />
      <Input label="X (m)" placeholder="Ví dụ: 2336990.46" value={draft.x} onChange={set("x")} inputMode="decimal" />
      <Input label="Y (m)" placeholder="Ví dụ: 474920.21" value={draft.y} onChange={set("y")} inputMode="decimal" />
      <p><Badge text={badge.text} tone={badge.tone} /></p>
      {check.state === "mismatch" && <p className="form__hint">Vĩ/kinh độ và X, Y của điểm này chỉ cùng một chỗ khi lệch dưới 3 m. Thường là một chữ số bị đọc sai: so lại từng số với giấy.</p>}
      {(check.state === "dmsOnly" || check.state === "gridOnly") && <p className="form__hint">Điền thêm ô còn trống theo giấy để app đối chiếu giúp; số đọc từ ảnh mà không đối chiếu được thì hay sai.</p>}
      <div className="sheet-actions">
        <Button fullWidth size="large" onClick={() => onSave(draft)}>Dùng số này</Button>
        <Button fullWidth size="large" variant="secondary" type="danger" onClick={() => onRemove(draft)}>Xóa điểm này</Button>
      </div>
    </div>
  );
}
