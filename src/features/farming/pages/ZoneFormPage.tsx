import { useEffect, useState } from "react";
import { Button, Input, useNavigate, useParams } from "zmp-ui";

import FormError from "@/components/FormError/FormError";
import LocationInput from "@/features/farming/components/LocationInput/LocationInput";
import { ManagePage } from "@/components/ManagePage/ManagePage";
import { NumberInput } from "@/components/NumberInput/NumberInput";
import { Section } from "@/components/Section/Section";
import { errorText } from "@/utils/errorText";
import { MESSAGES } from "@/constants/messages";
import { createZone, getZone, updateZone } from "@/features/farming/services/farmService";
import { parseNumber } from "@/utils/format";
import { parseCoordinate } from "@/utils/coordinates";

const text = (n: number | null | undefined) => (n === null || n === undefined ? "" : String(n).replace(".", ","));

/** Thêm hoặc sửa vùng nuôi (`/manage/zones/new`, `/manage/zones/:id/edit`). */
function ZoneFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loaded, setLoaded] = useState(!id);
  const [rowVersion, setRowVersion] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [location, setLocation] = useState("");
  const [area, setArea] = useState("");
  const [lat, setLat] = useState("");
  const [lng, setLng] = useState("");
  const [point, setPoint] = useState("");
  const [error, setError] = useState("");
  const [saveTries, setSaveTries] = useState(0);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!id) return;
    getZone(id)
      .then((z) => {
        setRowVersion(z.rowVersion);
        setCode(z.code ?? "");
        setName(z.name ?? "");
        setLocation(z.location ?? "");
        setArea(text(z.area));
        setLat(text(z.latitude));
        setLng(text(z.longitude));
        setPoint(z.waterMeasurementPoint ?? "");
        setLoaded(true);
      })
      .catch((err) => setError(errorText(err)));
  }, [id]);

  const save = async () => {
    if (busy || !loaded) return;
    if (!code.trim() || !name.trim()) {
      setError(MESSAGES.MSG01(!code.trim() ? "Mã vùng" : "Tên vùng"));
      return;
    }
    if ((lat.trim() && parseCoordinate(lat, "latitude") === null) || (lng.trim() && parseCoordinate(lng, "longitude") === null)) {
      setError(MESSAGES.MSG01("Tọa độ"));
      return;
    }
    const body = {
      code: code.trim(),
      name: name.trim(),
      location: location.trim() || null,
      area: parseNumber(area),
      latitude: parseCoordinate(lat, "latitude"),
      longitude: parseCoordinate(lng, "longitude"),
      waterMeasurementPoint: point.trim() || null,
      rowVersion,
    };
    setBusy(true);
    setError("");
    try {
      const saved = id ? await updateZone(id, body) : await createZone(body);
      navigate(`/manage/zones/${saved.id}`, { replace: true });
    } catch (err) {
      setError(errorText(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <ManagePage
      title={id ? "Sửa vùng nuôi" : "Thêm vùng nuôi"}
      footer={
        <Button
          fullWidth
          size="large"
          loading={busy}
          disabled={busy || !loaded}
          onClick={() => {
            setSaveTries((n) => n + 1);
            void save();
          }}
        >
          Lưu
        </Button>
      }
    >
      {!loaded && !error ? (
        <div className="skeleton skeleton--form" aria-busy />
      ) : (
        <>
          <Section step={1} title="Thông tin vùng">
            <div className="form">
              <Input label="Mã vùng (bắt buộc)" value={code} onChange={(e) => setCode(e.target.value)} maxLength={50} disabled={busy} />
              <Input label="Tên vùng (bắt buộc)" value={name} onChange={(e) => setName(e.target.value)} maxLength={200} disabled={busy} />
              <NumberInput decimal label="Diện tích (ha)" value={area} onChange={setArea} disabled={busy} />
            </div>
          </Section>
          <Section step={2} title="Vị trí của vùng">
            <div className="form">
              <Input label="Vị trí" value={location} onChange={(e) => setLocation(e.target.value)} maxLength={500} disabled={busy} />
              <LocationInput latitude={lat} longitude={lng} onChange={(latitude, longitude) => { setLat(latitude); setLng(longitude); }} disabled={busy || !loaded} />
            </div>
          </Section>
          <Section step={3} title="Đo nước">
            <div className="form">
              <Input label="Điểm đo nước" value={point} onChange={(e) => setPoint(e.target.value)} maxLength={200} disabled={busy} />
              {/* Bấm Lưu lại mà vẫn cùng một lỗi thì key đổi để FormError cuộn tới lần nữa. */}
              <FormError key={saveTries} text={error} />
            </div>
          </Section>
        </>
      )}
    </ManagePage>
  );
}

export default ZoneFormPage;
