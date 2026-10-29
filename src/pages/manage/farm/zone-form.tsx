import { useEffect, useState } from "react";
import { Button, Input, useNavigate, useParams } from "zmp-ui";

import FormError from "@/components/form-error";
import LocationInput from "@/components/manage/location-input";
import { ManagePage, NumberInput } from "@/components/manage/ui";
import { errorText, MESSAGES } from "@/services/acs/messages";
import { createZone, getZone, updateZone } from "@/services/farm";
import { parseNumber } from "@/services/format";
import { parseCoordinate } from "@/services/coordinates";

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
        <Button fullWidth size="large" loading={busy} disabled={busy || !loaded} onClick={() => void save()}>
          Lưu
        </Button>
      }
    >
      {!loaded && !error ? (
        <div className="skeleton skeleton--form" aria-busy />
      ) : (
        <div className="form">
          <Input label="Mã vùng" value={code} onChange={(e) => setCode(e.target.value)} maxLength={50} disabled={busy} />
          <Input label="Tên vùng" value={name} onChange={(e) => setName(e.target.value)} maxLength={200} disabled={busy} />
          <Input label="Vị trí" value={location} onChange={(e) => setLocation(e.target.value)} maxLength={500} disabled={busy} />
          <NumberInput decimal label="Diện tích (ha)" value={area} onChange={setArea} disabled={busy} />
          <LocationInput latitude={lat} longitude={lng} onChange={(latitude, longitude) => { setLat(latitude); setLng(longitude); }} disabled={busy || !loaded} />
          <Input label="Điểm đo nước" value={point} onChange={(e) => setPoint(e.target.value)} maxLength={200} disabled={busy} />
          <FormError text={error} />
        </div>
      )}
    </ManagePage>
  );
}

export default ZoneFormPage;
