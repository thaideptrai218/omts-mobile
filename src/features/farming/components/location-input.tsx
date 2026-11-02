import { lazy, Suspense, useState } from "react";
import { Button, Input, Sheet } from "zmp-ui";

import FormError from "@/shared/ui/form-error";
import { errorText } from "@/shared/lib/messages";
import { ApiError, NetworkError } from "@/shared/api/errors";
import { coordinateText, type Coordinates, readCoordinates } from "@/shared/lib/coordinates";
import { currentRaftPosition } from "@/features/farming/api/raft-location";

const LocationMap = lazy(() => import("@/features/farming/components/location-map"));

/** Các cách nhập chỉ đề xuất giá trị vào form, không tự lưu vùng/bè. */
export default function LocationInput({ latitude, longitude, onChange, disabled, mapCenter }: {
  latitude: string; longitude: string; onChange: (latitude: string, longitude: string) => void; disabled?: boolean; mapCenter?: Coordinates | null;
}) {
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
    <div className="two-col">
      <Input label="Vĩ độ" value={latitude} inputMode="decimal" onChange={(e) => onChange(e.target.value, longitude)} disabled={disabled || locating} />
      <Input label="Kinh độ" value={longitude} inputMode="decimal" onChange={(e) => onChange(latitude, e.target.value)} disabled={disabled || locating} />
    </div>
    <p className="form__hint">Nếu đang ở trên bè, bạn có thể dùng vị trí điện thoại. Zalo sẽ xin quyền chia sẻ vị trí khi bạn bấm nút; vị trí chưa được lưu cho đến khi bấm Lưu.</p>
    <Button fullWidth size="large" variant="secondary" loading={locating} disabled={disabled || locating} onClick={() => void locate()}>Lấy vị trí qua Zalo</Button>
    <Button fullWidth size="large" variant="secondary" disabled={disabled || locating} onClick={() => { setError(""); setMapOpen(true); }}>Chọn điểm trên bản đồ</Button>
    <FormError text={error} />
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
