import type { RaftView } from "@/features/farming/models/Raft";
import type { RaftFormSuggestion } from "@/features/farming/models/RaftForm";
import type { Coordinates } from "@/models/Coordinates";
import { useEffect, useState } from "react";
import { Button, Input, useNavigate, useParams } from "zmp-ui";

import FormError from "@/components/FormError/FormError";
import LocationInput from "@/features/farming/components/LocationInput/LocationInput";
import RaftFormImport from "@/features/farming/components/RaftFormImport/RaftFormImport";
import { ManagePage } from "@/components/ManagePage/ManagePage";
import { NumberInput } from "@/components/NumberInput/NumberInput";
import { Section } from "@/components/Section/Section";
import { errorText } from "@/utils/errorText";
import { MESSAGES } from "@/constants/messages";
import { createRaft, getRaft, getZone, updateRaft } from "@/features/farming/services/farmService";
import { parseNumber } from "@/utils/format";
import { readCoordinates } from "@/utils/coordinates";

/** Số hàng tối đa backend nhận (RaftLaneChange.MaxLaneCount). */
const MAX_LANES = 200;

const text = (n: number | null | undefined) => (n === null || n === undefined ? "" : String(n).replace(".", ","));

/**
 * Thêm bè vào một vùng (`/manage/zones/:id/rafts/new`) hoặc sửa thông tin bè (`/manage/rafts/:id/edit`), FARM-04. Bè chỉ
 * lưu số hàng: sửa số hàng thì backend gỡ các hàng cuối (giữ dữ liệu cũ) hoặc dùng lại hàng đã gỡ. Tọa độ không bắt buộc.
 */
function RaftFormPage() {
  const { id: zoneId, raftId } = useParams();
  const navigate = useNavigate();
  const [raft, setRaft] = useState<RaftView | null>(null);
  const [code, setCode] = useState("");
  const [size, setSize] = useState("");
  const [location, setLocation] = useState("");
  const [notes, setNotes] = useState("");
  const [laneCount, setLaneCount] = useState("10");
  const [lat, setLat] = useState("");
  const [lng, setLng] = useState("");
  const [zoneCenter, setZoneCenter] = useState<Coordinates | null>(null);
  const [error, setError] = useState("");
  const [saveTries, setSaveTries] = useState(0);
  const [busy, setBusy] = useState(false);
  const [importing, setImporting] = useState(false);
  const editing = !!raftId;
  const applyImport = (fields: RaftFormSuggestion) => {
    if (fields.code.trim()) setCode(fields.code.trim());
    if (fields.size.trim()) setSize(fields.size.trim());
    if (fields.location.trim()) setLocation(fields.location.trim());
    if (fields.notes.trim()) setNotes(fields.notes.trim());
    if (fields.latitude && fields.longitude) { setLat(fields.latitude); setLng(fields.longitude); }
    if (!editing && fields.laneCount) setLaneCount(fields.laneCount);
    setError("");
  };

  useEffect(() => {
    if (!raftId) return;
    getRaft(raftId)
      .then((r) => {
        setRaft(r);
        setCode(r.code ?? "");
        setSize(r.size ?? "");
        setLocation(r.location ?? "");
        setNotes(r.conditionNotes ?? "");
        setLat(text(r.latitude));
        setLng(text(r.longitude));
        setLaneCount(String(r.laneCount));
      })
      .catch((err) => setError(errorText(err)));
  }, [raftId]);

  // Tọa độ vùng chỉ dùng căn giữa bản đồ, không gán nhầm thành vị trí của mọi bè mới.
  useEffect(() => {
    if (!zoneId || raftId) return;
    getZone(zoneId)
      .then((z) => {
        setZoneCenter(readCoordinates(String(z.latitude ?? ""), String(z.longitude ?? "")));
      })
      .catch(() => undefined);
  }, [zoneId, raftId]);

  const save = async () => {
    if (busy || importing || (editing && !raft)) return;
    // Tọa độ không bắt buộc, nhưng đã nhập thì phải đủ cả vĩ độ và kinh độ.
    const hasCoordinates = Boolean(lat.trim() || lng.trim());
    const position = hasCoordinates ? readCoordinates(lat, lng) : null;
    const count = parseNumber(laneCount);
    const missing = !code.trim()
      ? "Mã bè"
      : !size.trim()
        ? "Kích thước"
        : hasCoordinates && !position
          ? "Tọa độ"
          : count === null || !Number.isInteger(count) || count < 1 || count > MAX_LANES
            ? "Số hàng"
            : "";
    if (missing || count === null) {
      setError(MESSAGES.MSG01(missing || "Số hàng"));
      return;
    }
    const body = {
      code: code.trim(),
      size: size.trim(),
      location: location.trim() || null,
      conditionNotes: notes.trim() || null,
      latitude: position?.latitude ?? null,
      longitude: position?.longitude ?? null,
      laneCount: count,
      rowVersion: raft?.rowVersion ?? null,
    };
    setBusy(true);
    setError("");
    try {
      const saved = raft ? await updateRaft(raft.id, body) : await createRaft(zoneId ?? "", body);
      navigate(`/manage/rafts/${saved.raft.id}`, { replace: true });
    } catch (err) {
      setError(errorText(err));
    } finally {
      setBusy(false);
    }
  };

  const loading = editing && !raft && !error;

  return (
    <ManagePage
      title={editing ? "Sửa bè" : "Thêm bè"}
      footer={
        <Button
          fullWidth
          size="large"
          loading={busy}
          disabled={busy || importing || (editing && !raft)}
          onClick={() => {
            setSaveTries((n) => n + 1);
            void save();
          }}
        >
          Lưu
        </Button>
      }
    >
      {loading ? (
        <div className="skeleton skeleton--form" aria-busy />
      ) : (
        <>
          <Section step={1} title="Điền nhanh từ ảnh (không bắt buộc)">
            <div className="form">
              <RaftFormImport editing={editing} disabled={busy || (editing && !raft)} onApply={applyImport} onBusyChange={setImporting} />
            </div>
          </Section>
          <fieldset disabled={busy || importing || (editing && !raft)} className="raft-form-fields">
            <div>
              <Section step={2} title="Thông tin bè">
                <div className="form">
                  <Input label="Mã bè (bắt buộc)" value={code} onChange={(e) => setCode(e.target.value)} maxLength={50} disabled={busy} />
                  <Input label="Kích thước (bắt buộc)" placeholder="Ví dụ: 10 x 12 m" value={size} onChange={(e) => setSize(e.target.value)} maxLength={100} disabled={busy} />
                </div>
              </Section>
              <Section step={3} title="Vị trí của bè">
                <div className="form">
                  <LocationInput latitude={lat} longitude={lng} onChange={(latitude, longitude) => { setLat(latitude); setLng(longitude); }} mapCenter={zoneCenter} disabled={busy || importing} />
                  <Input label="Vị trí" value={location} onChange={(e) => setLocation(e.target.value)} maxLength={500} disabled={busy} />
                </div>
              </Section>
              <Section step={4} title="Các hàng treo hàu">
                <div className="form">
                  <NumberInput label="Số hàng (bắt buộc)" value={laneCount} onChange={setLaneCount} disabled={busy} helperText={`Từ 1 đến ${MAX_LANES} hàng`} />
                  {editing && raft && (
                    <p className="form__hint">
                      Bè đang dùng {raft.laneCount} hàng. Giảm số hàng thì các hàng cuối chuyển sang Đã gỡ, dữ liệu cũ vẫn giữ; tăng thì dùng lại hàng đã gỡ trước.
                    </p>
                  )}
                </div>
              </Section>
              <Section step={5} title="Ghi chú">
                <div className="form">
                  <Input.TextArea label="Ghi chú tình trạng" value={notes} onChange={(e) => setNotes(e.target.value)} maxLength={2000} showCount disabled={busy} />
                  {/* Bấm Lưu lại mà vẫn cùng một lỗi thì key đổi để FormError cuộn tới lần nữa. */}
                  <FormError key={saveTries} text={error} />
                </div>
              </Section>
            </div>
          </fieldset>
        </>
      )}
    </ManagePage>
  );
}

export default RaftFormPage;
