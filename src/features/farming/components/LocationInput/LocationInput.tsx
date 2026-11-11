import type { Coordinates } from "@/models/Coordinates";
import { lazy, Suspense, useState } from "react";
import { Button, Input, Sheet } from "zmp-ui";

import FormError from "@/components/FormError/FormError";
import { errorText } from "@/utils/errorText";
import { ApiError, NetworkError } from "@/services/errors";
import { coordinateText, readCoordinates } from "@/utils/coordinates";
import { currentRaftPosition } from "@/features/farming/services/raftLocationService";

const LocationMap = lazy(() => import("@/features/farming/components/LocationMap/LocationMap"));

/** Các cách nhập chỉ đề xuất giá trị vào form, không tự lưu vùng/bè. */
export default function LocationInput({ latitude, longitude, onChange, disabled, mapCenter, required = false }: {
  latitude: string; longitude: string; onChange: (latitude: string, longitude: string) => void; disabled?: boolean; mapCenter?: Coordinates | null; required?: boolean;
}) {
  const mark = required ? " (bắt buộc)" : "";
  const [mapOpen, setMapOpen] = useState(false);
  const [locating, setLocating] = useState(false);
  const [proposal, setProposal] = useState<Coordinates | null>(null);
  const [error, setError] = useState("");
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
    <Sheet visible={proposal !== null} onClose={() => setProposal(null)} autoHeight mask title="Kiểm tra vị trí điện thoại">
      <div className="sheet-form form">
        <p className="form__intro">Chỉ dùng vị trí này nếu điện thoại đang ở đúng vị trí bạn muốn đánh dấu. Sai số phụ thuộc thiết bị.</p>
        {proposal && <p>Vĩ độ: {coordinateText(proposal.latitude)} · Kinh độ: {coordinateText(proposal.longitude)}</p>}
        <Button fullWidth size="large" onClick={() => proposal && apply(proposal)}>Dùng tọa độ này</Button>
        <Button fullWidth size="large" variant="secondary" onClick={() => setProposal(null)}>Để sau</Button>
      </div>
    </Sheet>
    <Sheet visible={mapOpen} onClose={() => setMapOpen(false)} height="85vh" mask title="Chọn vị trí">
      {mapOpen && <div className="sheet-form form"><Suspense fallback={<div className="skeleton skeleton--form" aria-busy />}><LocationMap initial={readCoordinates(latitude, longitude)} center={mapCenter} onConfirm={apply} /></Suspense></div>}
    </Sheet>
  </>;
}
