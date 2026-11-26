import type { RaftListItem } from "@/features/farming/models/Raft";
import type { ZoneView } from "@/features/farming/models/Zone";
import type { AreaDraft, CornerDraft, CornerTableReading } from "@/features/farming/models/ZoneBoundary";
import { lazy, Suspense, useMemo, useState } from "react";
import { Button, Input, Sheet, useNavigate, useParams, useSnackbar } from "zmp-ui";

import FormError from "@/components/FormError/FormError";
import CornerTableScan from "@/features/farming/components/CornerTableScan/CornerTableScan";
import { BoundaryAreaCard, CornerSheet } from "@/features/farming/components/BoundaryAreaCard/BoundaryAreaCard";
import { ConfirmSheet } from "@/components/ConfirmSheet/ConfirmSheet";
import { Empty } from "@/components/Empty/Empty";
import { Loadable } from "@/components/Loadable/Loadable";
import { ManagePage } from "@/components/ManagePage/ManagePage";
import { Section } from "@/components/Section/Section";
import { useAction } from "@/hooks/useAction";
import { useLoad } from "@/hooks/useLoad";
import { getZone, listRafts, saveZoneBoundary, USAGE } from "@/features/farming/services/farmService";
import { DEFAULT_CENTRAL_MERIDIAN, dmsText, parseDms } from "@/features/farming/utils/vn2000";
import { areaDraft, areaPositions, boundaryOf, checkCorner, cornerDraft, draftsOf, emptyCorner, placementOf, ringAreaHa, selfIntersects, strayCorners } from "@/features/farming/utils/zoneBoundary";
import { num } from "@/utils/format";

const RaftMap = lazy(() => import("@/features/farming/components/RaftMap/RaftMap"));

/** Kinh tuyến trục hiển thị "107°45'". */
const meridianText = (value: number) => dmsText(value).replace(/'00\.00"$/, "'");

/**
 * Ranh giới vùng nuôi theo sơ đồ cấp phép khu vực biển (`/manage/zones/:id/boundary`). Đọc bảng tọa độ các điểm góc từ ảnh
 * (hoặc gõ tay), đối chiếu vĩ/kinh độ với X, Y, đổi từ VN-2000 sang WGS84 rồi lưu dạng GeoJSON. Bè có ghim ngoài ranh giới
 * chỉ bị cảnh báo, không bị chặn (PM chốt 25/11/2026).
 */
function ZoneBoundaryPage() {
  const { id = "" } = useParams();
  const { data, error, reload } = useLoad(async () => {
    const [zone, rafts] = await Promise.all([getZone(id), listRafts(id)]);
    return { zone, rafts };
  }, [id]);
  if (!data) {
    return (
      <ManagePage title="Ranh giới vùng">
        <Loadable data={data} error={error} reload={() => void reload()}>{() => null}</Loadable>
      </ManagePage>
    );
  }
  return <BoundaryEditor zone={data.zone} rafts={data.rafts} />;
}

function BoundaryEditor({ zone, rafts }: { zone: ZoneView; rafts: RaftListItem[] }) {
  const navigate = useNavigate();
  const { openSnackbar } = useSnackbar();
  const { busy, run } = useAction();
  const [meridian, setMeridian] = useState(DEFAULT_CENTRAL_MERIDIAN);
  const [meridianInput, setMeridianInput] = useState(meridianText(DEFAULT_CENTRAL_MERIDIAN));
  const [areas, setAreas] = useState<AreaDraft[]>(() => draftsOf(zone.boundary, DEFAULT_CENTRAL_MERIDIAN));
  const [editing, setEditing] = useState<{ area: string; corner: CornerDraft } | null>(null);
  const [reading, setReading] = useState<CornerTableReading | null>(null);
  const [scanning, setScanning] = useState(false);
  const [mapOpen, setMapOpen] = useState(false);
  const [confirm, setConfirm] = useState<"save" | "remove" | null>(null);
  const [error, setError] = useState("");
  const [saveTries, setSaveTries] = useState(0);

  const boundary = useMemo(() => boundaryOf(areas, meridian), [areas, meridian]);
  const outside = useMemo(() => rafts.filter((raft) => {
    if (raft.statusId !== USAGE.inUse || raft.latitude === null || raft.longitude === null) return false;
    return placementOf(boundary, { latitude: raft.latitude, longitude: raft.longitude })?.inside === false;
  }), [boundary, rafts]);
  const totalHa = useMemo(() => areas.reduce((sum, area) => {
    const positions = areaPositions(area, meridian).map(({ position }) => position);
    return positions.length >= 3 ? sum + ringAreaHa(positions) : sum;
  }, 0), [areas, meridian]);
  const locked = busy || scanning;

  const updateArea = (key: string, change: (area: AreaDraft) => AreaDraft) => setAreas((current) => current.map((area) => (area.key === key ? change(area) : area)));

  const applyReading = (result: CornerTableReading) => {
    setReading(result);
    if (result.centralMeridian !== null) { setMeridian(result.centralMeridian); setMeridianInput(meridianText(result.centralMeridian)); }
    const found = result.areas.filter((area) => area.corners.length > 0);
    if (found.length === 0) {
      setError("Chưa nhận ra dòng tọa độ nào trong khung. Thử chụp thẳng, đủ sáng, kéo khung sát bảng hơn, hoặc nhập điểm góc bằng tay.");
      return;
    }
    setError("");
    setAreas((current) => {
      const next = [...current];
      for (const area of found) {
        const corners = area.corners.map(cornerDraft);
        const same = next.findIndex((existing) => existing.name.trim().toLowerCase() === area.name.toLowerCase());
        if (same >= 0) next[same] = { ...next[same], corners };
        else next.push(areaDraft(area.name, corners));
      }
      return next;
    });
    const corners = found.reduce((sum, area) => sum + area.corners.length, 0);
    openSnackbar({ text: `Đã đọc ${corners} điểm góc của ${found.map((area) => area.name).join(", ")}. Vui lòng đối chiếu với giấy.`, type: "success", duration: 5000 });
  };

  const addArea = () => {
    const corner = emptyCorner();
    const area = areaDraft(`Khu ${areas.length + 1}`, [corner]);
    setAreas((current) => [...current, area]);
    setEditing({ area: area.key, corner });
  };

  const addCorner = (area: AreaDraft) => {
    const corner = emptyCorner();
    updateArea(area.key, (current) => ({ ...current, corners: [...current.corners, corner] }));
    setEditing({ area: area.key, corner });
  };

  const changeMeridian = (text: string) => {
    setMeridianInput(text);
    const value = parseDms(text);
    if (value !== null && value >= 102 && value <= 110) setMeridian(value);
  };

  /**
   * Lỗi chặn lưu, giống các điều backend từ chối: điểm chưa có số, khu chưa đủ 3 điểm, hai điểm trùng một chỗ, quá 10 khu hoặc
   * quá 100 điểm một khu. Lệch X, Y, chưa đối chiếu và đường tự cắt chỉ hỏi lại.
   */
  const blocking = (): string => {
    if (areas.length > 10) return "Một vùng có tối đa 10 khu. Bỏ bớt các khu không thuộc vùng này.";
    for (const area of areas) {
      const name = area.name.trim() || "Khu chưa đặt tên";
      const bad = area.corners.findIndex((corner) => { const state = checkCorner(corner, meridian).state; return state === "missing" || state === "outside"; });
      if (bad >= 0) return `${name}: điểm ${area.corners[bad].label || bad + 1} chưa có tọa độ hợp lệ. Sửa hoặc xóa điểm này.`;
      const placed = areaPositions(area, meridian);
      if (placed.length < 3) return `${name} cần ít nhất 3 điểm góc.`;
      if (placed.length > 100) return `${name} có quá 100 điểm góc.`;
      // Backend làm tròn 6 chữ số thập phân (khoảng 0,1 m) rồi mới so trùng.
      const seen = new Map<string, string>();
      for (const [index, { label, position }] of placed.entries()) {
        const spot = `${position.latitude.toFixed(6)},${position.longitude.toFixed(6)}`;
        const twin = seen.get(spot);
        if (twin !== undefined) return `${name}: điểm ${label || index + 1} trùng vị trí với điểm ${twin}. Xóa một trong hai điểm.`;
        seen.set(spot, label || String(index + 1));
      }
    }
    return "";
  };
  const countCorners = (states: string[]) => areas.reduce((sum, area) => sum + area.corners.filter((corner) => states.includes(checkCorner(corner, meridian).state)).length, 0);
  const doubts = countCorners(["mismatch"]);
  const unchecked = countCorners(["dmsOnly", "gridOnly"]);
  const strays = areas.reduce((sum, area) => sum + strayCorners(area, meridian).size, 0);
  const crossing = areas.filter((area) => selfIntersects(areaPositions(area, meridian).map(({ position }) => position))).map((area) => area.name.trim() || "Khu chưa đặt tên");

  const save = async (value = boundary) => {
    setConfirm(null);
    const saved = await run(() => saveZoneBoundary(zone.id, { boundary: value, rowVersion: zone.rowVersion }));
    if (!saved) return;
    const warning = saved.warnings?.find((item) => item.code === "RAFTS_OUTSIDE_ZONE_BOUNDARY");
    const codes = Array.isArray(warning?.details?.raftCodes) ? (warning!.details!.raftCodes as unknown[]).map(String) : [];
    openSnackbar({
      text: value === null ? "Đã xóa ranh giới vùng." : codes.length > 0 ? `Đã lưu ranh giới vùng. Bè nằm ngoài ranh giới: ${codes.join(", ")}.` : "Đã lưu ranh giới vùng.",
      type: codes.length > 0 ? "warning" : "success",
      duration: codes.length > 0 ? 8000 : 4000,
    });
    navigate(`/manage/zones/${zone.id}`, { replace: true });
  };

  const trySave = () => {
    setSaveTries((count) => count + 1);
    if (areas.length === 0) { setError("Chưa có khu nào. Đọc ảnh sơ đồ hoặc nhập điểm góc bằng tay."); return; }
    const problem = blocking();
    if (problem) { setError(problem); return; }
    setError("");
    if (doubts > 0 || unchecked > 0 || strays > 0 || crossing.length > 0 || outside.length > 0) setConfirm("save");
    else void save();
  };

  return (
    <ManagePage
      title={`Ranh giới ${zone.name ?? zone.code ?? "vùng"}`}
      footer={<Button fullWidth size="large" loading={busy} disabled={locked} onClick={trySave}>Lưu ranh giới</Button>}
    >
      <Section step={1} title="Đọc từ ảnh sơ đồ cấp phép">
        <div className="form">
          <CornerTableScan disabled={busy} onRead={applyReading} onBusyChange={setScanning} />
          {reading && (
            <>
              {reading.confidence < 70 && <p className="form-error form-warning" role="alert"><span>Ảnh khó đọc. Vui lòng đối chiếu từng điểm với giấy gốc.</span></p>}
              <details><summary style={{ minHeight: 48, padding: "12px 0" }}>Chữ đọc được từ ảnh</summary><pre style={{ whiteSpace: "pre-wrap", overflowWrap: "anywhere", fontSize: "1rem" }}>{reading.text || "Không đọc được chữ."}</pre></details>
            </>
          )}
          <Input
            label="Kinh tuyến trục (ghi ở đầu bảng tọa độ)"
            helperText="Dùng để đổi X, Y sang vĩ độ, kinh độ. Quảng Ninh: 107°45'."
            value={meridianInput}
            onChange={(event) => changeMeridian(event.target.value)}
            disabled={locked}
          />
        </div>
      </Section>

      <Section step={2} title="Các khu và điểm góc">
        <div className="form">
          {areas.length === 0 ? (
            <Empty icon="zi-location" title="Chưa có điểm góc" text="Đọc ảnh sơ đồ ở bước 1, hoặc nhập bằng tay." />
          ) : (
            areas.map((area) => (
              <BoundaryAreaCard
                key={area.key}
                area={area}
                centralMeridian={meridian}
                disabled={locked}
                onRename={(name) => updateArea(area.key, (current) => ({ ...current, name }))}
                onEditCorner={(corner) => setEditing({ area: area.key, corner })}
                onAddCorner={() => addCorner(area)}
                onRemove={() => setAreas((current) => current.filter((item) => item.key !== area.key))}
              />
            ))
          )}
          <Button fullWidth size="large" variant="secondary" disabled={locked} onClick={addArea}>Nhập một khu bằng tay</Button>
        </div>
      </Section>

      <Section step={3} title="Kiểm tra trên bản đồ">
        <div className="form">
          <p className="form__hint">
            {boundary ? `${boundary.features.length} khu, tổng diện tích khoảng ${num(Math.round(totalHa * 100) / 100, "ha")}` : "Chưa khoanh được khu nào"}
            {zone.area !== null ? ` (giấy tờ của vùng ghi ${num(zone.area, "ha")}).` : "."}
          </p>
          {outside.length > 0 && (
            <p className="form-error form-warning" role="alert">
              <span>{outside.length} bè đang dùng nằm ngoài ranh giới này: {outside.map((raft) => raft.code).join(", ")}.</span>
            </p>
          )}
          <Button fullWidth size="large" variant="secondary" disabled={!boundary} onClick={() => setMapOpen(true)}>Xem ranh giới trên bản đồ</Button>
          {zone.boundary && <Button fullWidth size="large" variant="secondary" type="danger" disabled={locked} onClick={() => setConfirm("remove")}>Xóa ranh giới đã lưu</Button>}
          <FormError key={saveTries} text={error} />
        </div>
      </Section>

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

      <Sheet visible={mapOpen} onClose={() => setMapOpen(false)} height="85vh" mask handler swipeToClose title="Ranh giới trên bản đồ">
        {mapOpen && (
          <div className="sheet-form form">
            <Suspense fallback={<div className="skeleton skeleton--form" aria-busy />}>
              <RaftMap zone={zone} rafts={rafts} boundary={boundary} />
            </Suspense>
          </div>
        )}
      </Sheet>

      <ConfirmSheet
        visible={confirm === "save"}
        title="Lưu ranh giới này?"
        message={
          <>
            {doubts > 0 && <p>{doubts} điểm có vĩ/kinh độ chưa khớp X, Y.</p>}
            {unchecked > 0 && <p>{unchecked} điểm chưa đối chiếu được giữa vĩ/kinh độ và X, Y.</p>}
            {strays > 0 && <p>{strays} điểm nằm xa bất thường so với các điểm khác cùng khu.</p>}
            {crossing.length > 0 && <p>Đường ranh giới của {crossing.join(", ")} tự cắt nhau.</p>}
            {outside.length > 0 && <p>{outside.length} bè đang dùng sẽ nằm ngoài ranh giới: {outside.map((raft) => raft.code).join(", ")}.</p>}
            <p>Bạn đã đối chiếu với sơ đồ giấy và vẫn muốn lưu?</p>
          </>
        }
        confirmText="Vẫn lưu"
        busy={busy}
        onClose={() => setConfirm(null)}
        onConfirm={() => void save()}
      />
      <ConfirmSheet
        visible={confirm === "remove"}
        title="Xóa ranh giới vùng?"
        message="Vùng sẽ không còn ranh giới để cảnh báo bè đặt ngoài vùng. Bạn có thể đọc lại từ sơ đồ bất cứ lúc nào."
        confirmText="Xóa ranh giới"
        danger
        busy={busy}
        onClose={() => setConfirm(null)}
        onConfirm={() => void save(null)}
      />
    </ManagePage>
  );
}

export default ZoneBoundaryPage;
