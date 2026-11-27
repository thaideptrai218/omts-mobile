import type { ZoneView } from "@/features/farming/models/Zone";
import type { LicenseMapReading } from "@/features/farming/models/ZoneBoundary";
import { useEffect, useRef, useState } from "react";
import { Button, Input, useNavigate, useParams, useSnackbar } from "zmp-ui";

import FormError from "@/components/FormError/FormError";
import { BoundaryAreas, BoundaryConcerns, hasConcerns, MeridianInput } from "@/features/farming/components/BoundaryEditor/BoundaryEditor";
import LicenseMapScan from "@/features/farming/components/LicenseMapScan/LicenseMapScan";
import { ConfirmSheet } from "@/components/ConfirmSheet/ConfirmSheet";
import { Loadable } from "@/components/Loadable/Loadable";
import { ManagePage } from "@/components/ManagePage/ManagePage";
import { NumberInput } from "@/components/NumberInput/NumberInput";
import { Section } from "@/components/Section/Section";
import { errorText } from "@/utils/errorText";
import { MESSAGES } from "@/constants/messages";
import { useBoundaryDraft } from "@/features/farming/hooks/useBoundaryDraft";
import { createZone, getZone, saveZoneBoundary, updateZone } from "@/features/farming/services/farmService";
import { suggestedAreaHa } from "@/features/farming/utils/zoneMapReading";
import { num, parseNumber } from "@/utils/format";

const text = (n: number | null | undefined) => (n === null || n === undefined ? "" : String(n).replace(".", ","));

/** Điền ô từ sơ đồ chỉ khi ô còn trống hoặc đang giữ đúng giá trị của lần đọc trước; chữ người dùng đã gõ thì giữ nguyên. */
const fillable = (current: string, previous: string | null) => current.trim() === "" || current === previous;

/**
 * Thêm hoặc sửa vùng (`/manage/zones/new`, `/manage/zones/:id/edit`). Chỉ mã và tên bắt buộc. Khi thêm có thể đọc sơ đồ cấp phép
 * trước: ranh giới lưu ngay sau khi vùng được tạo, diện tích và vị trí được điền sẵn từ sơ đồ (tên vùng thì không).
 */
function ZoneFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { openSnackbar } = useSnackbar();
  const [loaded, setLoaded] = useState(!id);
  const [rowVersion, setRowVersion] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [location, setLocation] = useState("");
  const [area, setArea] = useState("");
  // Giá trị lần đọc sơ đồ gần nhất đã điền vào ô, để lần đọc sau biết ô nào chưa bị người dùng sửa.
  const [fromMap, setFromMap] = useState<{ area: string | null; location: string | null }>({ area: null, location: null });
  const [error, setError] = useState("");
  // Lỗi tải vùng đang sửa (thay cả form, có nút Thử lại); `error` là lỗi nhập và lưu.
  const [loadError, setLoadError] = useState("");
  const [attempt, setAttempt] = useState(0);
  const [saveTries, setSaveTries] = useState(0);
  const [busy, setBusy] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [confirm, setConfirm] = useState(false);
  // Vùng đã tạo nhưng chưa lưu được ranh giới: giữ lại để thử lại mà không tạo vùng lần hai.
  const [created, setCreated] = useState<ZoneView | null>(null);
  const draft = useBoundaryDraft(() => []);
  const [mapRead, setMapRead] = useState(false);
  const latest = useRef({ area, location, fromMap });
  latest.current = { area, location, fromMap };

  useEffect(() => {
    if (!id) return;
    getZone(id)
      .then((z) => {
        setRowVersion(z.rowVersion);
        setCode(z.code ?? "");
        setName(z.name ?? "");
        setLocation(z.location ?? "");
        setArea(text(z.area));
        setLoaded(true);
      })
      .catch((err) => setLoadError(errorText(err)));
  }, [id, attempt]);

  const applyMap = (reading: LicenseMapReading) => {
    const applied = draft.applyReading(reading);
    setMapRead(true);
    const { area: currentArea, location: currentLocation, fromMap: previous } = latest.current;
    const suggestedArea = suggestedAreaHa(reading);
    const next = { ...previous };
    if (suggestedArea !== null && fillable(currentArea, previous.area)) {
      next.area = text(suggestedArea);
      setArea(next.area);
    }
    if (reading.location && fillable(currentLocation, previous.location)) {
      next.location = reading.location;
      setLocation(next.location);
    }
    setFromMap(next);
    if (!applied) {
      setError("Chưa nhận ra bảng tọa độ nào trong ảnh. Thử chụp thẳng, đủ sáng, hoặc nhập điểm góc bằng tay, hoặc bỏ qua và thêm ranh giới sau.");
      return;
    }
    setError("");
    openSnackbar({ text: `Đã đọc ${applied.corners} điểm góc của ${applied.names.join(", ")}. Vui lòng đối chiếu với giấy.`, type: "success", duration: 5000 });
  };

  const goToZone = (zoneId: string) => navigate(`/manage/zones/${zoneId}`, { replace: true });

  /** Lưu ranh giới của vùng vừa tạo; lỗi thì ở lại màn "chưa lưu được ranh giới" để thử lại hoặc để sau. */
  const saveBoundary = async (zone: ZoneView) => {
    try {
      await saveZoneBoundary(zone.id, { boundary: draft.boundary, rowVersion: zone.rowVersion });
      goToZone(zone.id);
    } catch (err) {
      setCreated(zone);
      setError(errorText(err));
    }
  };

  const save = async (confirmed = false) => {
    if (busy || !loaded || scanning) return;
    setConfirm(false);
    // Backend chỉ bắt buộc mã và tên; vị trí, diện tích bỏ trống được, nhưng đã nhập thì diện tích phải lớn hơn 0.
    const areaValue = area.trim() ? parseNumber(area) : null;
    const missing = !code.trim() ? "Mã vùng" : !name.trim() ? "Tên vùng" : area.trim() && (areaValue === null || areaValue <= 0) ? "Diện tích" : null;
    if (missing) {
      setError(MESSAGES.MSG01(missing));
      return;
    }
    if (!id && draft.areas.length > 0) {
      const problem = draft.blocking();
      if (problem) {
        setError(problem);
        return;
      }
      if (!confirmed && hasConcerns(draft)) {
        setConfirm(true);
        return;
      }
    }
    const body = { code: code.trim(), name: name.trim(), location: location.trim() || null, area: areaValue, rowVersion };
    setBusy(true);
    setError("");
    try {
      const saved = id ? await updateZone(id, body) : await createZone(body);
      if (!id && draft.boundary) await saveBoundary(saved.zone);
      else goToZone(saved.zone.id);
    } catch (err) {
      setError(errorText(err));
    } finally {
      setBusy(false);
    }
  };

  const retryBoundary = async () => {
    if (busy || !created) return;
    setBusy(true);
    setError("");
    await saveBoundary(created);
    setBusy(false);
  };

  if (created) {
    return (
      <ManagePage title="Thêm vùng nuôi">
        <Section title="Vùng đã tạo, chưa lưu được ranh giới">
          <div className="form">
            <p className="form__intro">Vùng “{created.name ?? created.code}” đã được tạo. Ranh giới theo sơ đồ chưa lưu được; bạn có thể thử lại ngay, hoặc để sau và thêm ranh giới ở màn chi tiết vùng.</p>
            <FormError text={error} />
            <Button fullWidth size="large" loading={busy} disabled={busy} onClick={() => void retryBoundary()}>Thử lại</Button>
            <Button fullWidth size="large" variant="secondary" disabled={busy} onClick={() => goToZone(created.id)}>Để sau</Button>
          </div>
        </Section>
      </ManagePage>
    );
  }

  const locked = busy || scanning;
  const mapSection = !id;
  const mapSummary = draft.boundary ? `${draft.boundary.features.length} khu, tổng diện tích khoảng ${num(Math.round(draft.totalHa * 100) / 100, "ha")}.` : "Chưa khoanh được khu nào.";

  return (
    <ManagePage
      title={id ? "Sửa vùng nuôi" : "Thêm vùng nuôi"}
      footer={
        <Button
          fullWidth
          size="large"
          loading={busy}
          disabled={locked || !loaded}
          onClick={() => {
            setSaveTries((n) => n + 1);
            void save();
          }}
        >
          Lưu
        </Button>
      }
    >
      {/* Chưa tải xong vùng thì chưa hiện form: đang tải là khung chờ, lỗi thì có nút Thử lại. */}
      {!loaded ? (
        <Loadable data={null} error={loadError} reload={() => { setLoadError(""); setAttempt((n) => n + 1); }}>{() => null}</Loadable>
      ) : (
        <>
          <Section step={1} title="Thông tin vùng">
            <div className="form">
              <Input label="Mã vùng (bắt buộc)" value={code} onChange={(e) => setCode(e.target.value)} maxLength={50} disabled={locked} />
              <Input label="Tên vùng (bắt buộc)" value={name} onChange={(e) => setName(e.target.value)} maxLength={200} disabled={locked} />
            </div>
          </Section>
          {mapSection && (
            <Section step={2} title="Sơ đồ cấp phép (không bắt buộc)">
              <div className="form">
                <LicenseMapScan disabled={busy} onRead={applyMap} onBusyChange={setScanning} />
                {(mapRead || draft.areas.length > 0) && (
                  <>
                    <MeridianInput draft={draft} disabled={locked} />
                    <BoundaryAreas draft={draft} disabled={locked} emptyText="Đọc lại ảnh sơ đồ, hoặc nhập bằng tay." />
                    {draft.areas.length > 0 && <p className="form__hint">{mapSummary}</p>}
                  </>
                )}
              </div>
            </Section>
          )}
          <Section step={mapSection ? 3 : 2} title="Vị trí và diện tích (không bắt buộc)">
            <div className="form">
              <Input
                label="Vị trí"
                helperText={fromMap.location !== null && location === fromMap.location ? "Điền từ sơ đồ cấp phép, bạn có thể sửa." : "Ví dụ: Bắc đảo Cái Bầu, Vân Đồn"}
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                maxLength={500}
                disabled={locked}
              />
              <NumberInput decimal label="Diện tích, ha" value={area} onChange={setArea} disabled={locked} />
              {fromMap.area !== null && area === fromMap.area && <p className="form__hint">Diện tích điền từ sơ đồ cấp phép, bạn có thể sửa.</p>}
              {/* Nằm trong khung form để cách ô cuối 16px. Bấm Lưu lại mà vẫn cùng một lỗi thì key đổi để FormError cuộn tới lần nữa. */}
              <FormError key={saveTries} text={error} />
            </div>
          </Section>
        </>
      )}

      <ConfirmSheet
        visible={confirm}
        title="Lưu ranh giới này?"
        message={
          <>
            <BoundaryConcerns draft={draft} />
            <p>Bạn đã đối chiếu với sơ đồ giấy và vẫn muốn lưu?</p>
          </>
        }
        confirmText="Vẫn lưu"
        busy={busy}
        onClose={() => setConfirm(false)}
        onConfirm={() => void save(true)}
      />
    </ManagePage>
  );
}

export default ZoneFormPage;
