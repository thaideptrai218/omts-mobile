import type { RaftListItem } from "@/features/farming/models/Raft";
import type { ZoneView } from "@/features/farming/models/Zone";
import type { CornerTableReading } from "@/features/farming/models/ZoneBoundary";
import { lazy, Suspense, useMemo, useState } from "react";
import { Button, Sheet, useNavigate, useParams, useSnackbar } from "zmp-ui";

import FormError from "@/components/FormError/FormError";
import CornerTableScan from "@/features/farming/components/CornerTableScan/CornerTableScan";
import { BoundaryAreas, BoundaryConcerns, hasConcerns, MeridianInput } from "@/features/farming/components/BoundaryEditor/BoundaryEditor";
import { ConfirmSheet } from "@/components/ConfirmSheet/ConfirmSheet";
import { Loadable } from "@/components/Loadable/Loadable";
import { ManagePage } from "@/components/ManagePage/ManagePage";
import { Section } from "@/components/Section/Section";
import { useAction } from "@/hooks/useAction";
import { useLoad } from "@/hooks/useLoad";
import { useBoundaryDraft } from "@/features/farming/hooks/useBoundaryDraft";
import { getZone, listRafts, saveZoneBoundary, USAGE } from "@/features/farming/services/farmService";
import { DEFAULT_CENTRAL_MERIDIAN } from "@/features/farming/utils/vn2000";
import { draftsOf, placementOf } from "@/features/farming/utils/zoneBoundary";
import { num } from "@/utils/format";

const RaftMap = lazy(() => import("@/features/farming/components/RaftMap/RaftMap"));

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
  const draft = useBoundaryDraft(() => draftsOf(zone.boundary, DEFAULT_CENTRAL_MERIDIAN));
  const { areas, boundary, totalHa } = draft;
  const [reading, setReading] = useState<CornerTableReading | null>(null);
  const [scanning, setScanning] = useState(false);
  const [mapOpen, setMapOpen] = useState(false);
  const [confirm, setConfirm] = useState<"save" | "remove" | null>(null);
  const [error, setError] = useState("");
  const [saveTries, setSaveTries] = useState(0);

  const outside = useMemo(() => rafts.filter((raft) => {
    if (raft.statusId !== USAGE.inUse || raft.latitude === null || raft.longitude === null) return false;
    return placementOf(boundary, { latitude: raft.latitude, longitude: raft.longitude })?.inside === false;
  }), [boundary, rafts]);
  const locked = busy || scanning;

  const applyReading = (result: CornerTableReading) => {
    setReading(result);
    const applied = draft.applyReading(result);
    if (!applied) {
      setError("Chưa nhận ra dòng tọa độ nào trong khung. Thử chụp thẳng, đủ sáng, kéo khung sát bảng hơn, hoặc nhập điểm góc bằng tay.");
      return;
    }
    setError("");
    openSnackbar({ text: `Đã đọc ${applied.corners} điểm góc của ${applied.names.join(", ")}. Vui lòng đối chiếu với giấy.`, type: "success", duration: 5000 });
  };

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
    const problem = draft.blocking();
    if (problem) { setError(problem); return; }
    setError("");
    if (hasConcerns(draft) || outside.length > 0) setConfirm("save");
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
          <MeridianInput draft={draft} disabled={locked} />
        </div>
      </Section>

      <Section step={2} title="Các khu và điểm góc">
        <BoundaryAreas draft={draft} disabled={locked} emptyText="Đọc ảnh sơ đồ ở bước 1, hoặc nhập bằng tay." />
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
            <BoundaryConcerns draft={draft} />
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
