import type { ZoneBoundary } from "@/features/farming/models/ZoneBoundary";
import type { Coordinates } from "@/models/Coordinates";
import { lazy, Suspense, useState } from "react";
import { Button, Icon, Input, Sheet } from "zmp-ui";

import FormError from "@/components/FormError/FormError";
import { errorText } from "@/utils/errorText";
import { ApiError, NetworkError } from "@/services/errors";
import { coordinateText, readCoordinates } from "@/utils/coordinates";
import { currentRaftPosition } from "@/features/farming/services/raftLocationService";
import { placementOf } from "@/features/farming/utils/zoneBoundary";

const LocationMap = lazy(() => import("@/features/farming/components/LocationMap/LocationMap"));

/**
 * Các cách nhập chỉ đề xuất giá trị vào form, không tự lưu vùng/bè. Có `boundary` (ranh giới vùng của bè) thì bản đồ vẽ ranh
 * giới, và điểm nằm ngoài được báo ngay dưới ô tọa độ, dù nhập bằng cách nào (PM chốt 25/11/2026: chỉ cảnh báo, không chặn).
 */
export default function LocationInput({ latitude, longitude, onChange, disabled, mapCenter, boundary, required = false }: {
  latitude: string; longitude: string; onChange: (latitude: string, longitude: string) => void; disabled?: boolean; mapCenter?: Coordinates | null;
  boundary?: ZoneBoundary | null; required?: boolean;
}) {
  const mark = required ? " (bắt buộc)" : "";
  const [mapOpen, setMapOpen] = useState(false);
  const [locating, setLocating] = useState(false);
  const [proposal, setProposal] = useState<Coordinates | null>(null);
  const [error, setError] = useState("");
  const typed = readCoordinates(latitude, longitude);
  const placement = typed ? placementOf(boundary, typed) : null;
  const apply = (position: Coordinates) => { onChange(coordinateText(position.latitude), coordinateText(position.longitude)); setProposal(null); setMapOpen(false); };
  const locate = async () => {
    setError(""); setLocating(true);
    try { setProposal(await currentRaftPosition()); }
    catch (cause) { setError(cause instanceof ApiError || cause instanceof NetworkError ? errorText(cause) : cause instanceof Error ? cause.message : errorText(cause)); }
    finally { setLocating(false); }
  };
  return <>
    <p className="form__hint">Tọa độ là hai con số (vĩ độ và kinh độ) chỉ đúng một điểm trên bản đồ. Bạn không cần tự gõ: bấm một trong hai nút dưới đây, app sẽ điền giúp.</p>
    <p className="form__hint">Nếu đang đứng đúng chỗ cần đánh dấu, bạn có thể dùng vị trí điện thoại. Zalo sẽ xin quyền chia sẻ vị trí khi bạn bấm nút; vị trí chưa được lưu cho đến khi bấm Lưu.</p>
    <Button fullWidth size="large" variant="secondary" loading={locating} disabled={disabled || locating} onClick={() => void locate()}>Lấy vị trí điện thoại</Button>
    <Button fullWidth size="large" variant="secondary" disabled={disabled || locating} onClick={() => { setError(""); setMapOpen(true); }}>Chọn điểm trên bản đồ</Button>
    <FormError text={error} />
    <Input label={`Vĩ độ${mark}`} value={latitude} inputMode="decimal" onChange={(e) => onChange(e.target.value, longitude)} disabled={disabled || locating} />
    <Input label={`Kinh độ${mark}`} value={longitude} inputMode="decimal" onChange={(e) => onChange(latitude, e.target.value)} disabled={disabled || locating} />
    {placement && !placement.inside && (
      <p className="form-error form-warning" role="alert">
        <Icon icon="zi-warning-solid" />
        <span>Vị trí này nằm ngoài ranh giới vùng theo sơ đồ cấp phép, cách khoảng {Math.round(placement.distanceM).toLocaleString("vi-VN")} m. Kiểm tra lại vị trí bè trước khi lưu.</span>
      </p>
    )}
    <Sheet visible={proposal !== null} onClose={() => setProposal(null)} autoHeight mask title="Kiểm tra vị trí điện thoại">
      <div className="sheet-form form">
        <p className="form__intro">Chỉ dùng vị trí này nếu điện thoại đang ở đúng vị trí bạn muốn đánh dấu. Sai số phụ thuộc thiết bị.</p>
        {proposal && <p>Vĩ độ: {coordinateText(proposal.latitude)} · Kinh độ: {coordinateText(proposal.longitude)}</p>}
        <Button fullWidth size="large" onClick={() => proposal && apply(proposal)}>Dùng tọa độ này</Button>
        <Button fullWidth size="large" variant="secondary" onClick={() => setProposal(null)}>Để sau</Button>
      </div>
    </Sheet>
    <Sheet visible={mapOpen} onClose={() => setMapOpen(false)} height="85vh" mask title="Chọn vị trí">
      {mapOpen && <div className="sheet-form form"><Suspense fallback={<div className="skeleton skeleton--form" aria-busy />}><LocationMap initial={readCoordinates(latitude, longitude)} center={mapCenter} boundary={boundary} onConfirm={apply} /></Suspense></div>}
    </Sheet>
  </>;
}
