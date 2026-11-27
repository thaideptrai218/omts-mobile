import type { ZoneBoundary } from "@/features/farming/models/ZoneBoundary";
import type { Coordinates } from "@/models/Coordinates";
import { useEffect, useRef, useState } from "react";
import { Button } from "zmp-ui";
import vietmapgl from "@vietmap/vietmap-gl-js";
import "@vietmap/vietmap-gl-js/dist/vietmap-gl.css";

import { VIETMAP_API_KEY } from "@/constants/env";
import { coordinateText } from "@/utils/coordinates";
import { drawBoundary } from "@/features/farming/utils/boundaryLayers";
import { placementOf } from "@/features/farming/utils/zoneBoundary";

import "@/features/farming/components/LocationMap/LocationMap.scss";

export default function LocationMap({ initial, center, boundary = null, onConfirm }: {
  initial: Coordinates | null; center?: Coordinates | null; boundary?: ZoneBoundary | null; onConfirm: (position: Coordinates) => void;
}) {
  const container = useRef<HTMLDivElement>(null);
  const [start] = useState(initial);
  const [viewCenter] = useState(initial ?? center);
  const [area] = useState(boundary);
  const [selected, setSelected] = useState<Coordinates | null>(initial);
  const [error, setError] = useState("");
  const [ready, setReady] = useState(false);
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    if (!VIETMAP_API_KEY || !container.current) return;
    let map: vietmapgl.Map | undefined;
    let observer: ResizeObserver | undefined;
    let marker: vietmapgl.Marker | undefined;
    let disposed = false;
    let loaded = false;
    let failed = false;
    setError(""); setReady(false); setSelected(start);
    const timer = window.setTimeout(() => { if (!loaded && !disposed) setError("Bản đồ tải chậm. Bạn có thể thử lại hoặc nhập tọa độ bằng tay."); }, 9000);
    try {
      map = new vietmapgl.Map({ container: container.current, style: `https://maps.vietmap.vn/maps/styles/hm/style.json?apikey=${encodeURIComponent(VIETMAP_API_KEY)}`,
        center: viewCenter ? [viewCenter.longitude, viewCenter.latitude] : [106, 16], zoom: viewCenter ? 16 : 5, attributionControl: {} });
      const choose = (position: Coordinates) => {
        if (!map || disposed) return;
        setSelected(position);
        if (!marker) {
          marker = new vietmapgl.Marker({ color: "#0050C8", draggable: true }).setLngLat([position.longitude, position.latitude]).addTo(map);
          marker.on("dragend", () => { const point = marker!.getLngLat(); setSelected({ latitude: point.lat, longitude: point.lng }); });
        } else marker.setLngLat([position.longitude, position.latitude]);
      };
      map.on("load", () => {
        if (disposed || !map) return;
        loaded = true; window.clearTimeout(timer); setReady(true); if (!failed) setError("");
        // Vẽ ranh giới vùng để chọn ghim bè bên trong; chưa có ghim nào thì thu bản đồ cho vừa ranh giới.
        const bounds = new vietmapgl.LngLatBounds();
        drawBoundary(map, area, bounds);
        if (!viewCenter && !bounds.isEmpty()) map.fitBounds(bounds, { padding: 48, maxZoom: 17, duration: 0 });
        if (start) choose(start);
        map.resize();
      });
      map.on("click", (event) => choose({ latitude: event.lngLat.lat, longitude: event.lngLat.lng }));
      map.on("error", (event) => {
        // Bản đồ đã tải xong mà một ô (tile) hoặc nguồn dữ liệu lỗi thì vẫn chọn điểm được: không báo lỗi, không khóa nút.
        const source = event as { sourceId?: string; tile?: unknown };
        if (loaded && (source.sourceId || source.tile)) return;
        failed = true;
        const status = (event.error as Error & { status?: number }).status;
        if (!disposed) setError(status === 423 || status === 429 ? "Bản đồ đang bị giới hạn lượt tải. Bạn vẫn có thể nhập tọa độ bằng tay hoặc lấy vị trí điện thoại." : "Không tải được bản đồ. Vui lòng kiểm tra kết nối và cấu hình dịch vụ.");
      });
      if (typeof ResizeObserver !== "undefined") { observer = new ResizeObserver(() => map?.resize()); observer.observe(container.current); }
    } catch { setError("Thiết bị chưa mở được bản đồ. Bạn có thể nhập tọa độ bằng tay hoặc lấy vị trí điện thoại."); }
    return () => { disposed = true; window.clearTimeout(timer); observer?.disconnect(); marker?.remove(); map?.remove(); };
  }, [area, attempt, start, viewCenter]);
  if (!VIETMAP_API_KEY) return <p className="form__hint">Chưa cấu hình dịch vụ bản đồ. Bạn có thể nhập tọa độ bằng tay hoặc lấy vị trí điện thoại.</p>;
  return <>
    <p className="form__hint">Chạm trên bản đồ để đặt ghim, kéo ghim để chỉnh. Sau đó bấm Dùng tọa độ này.</p>
    <div ref={container} className="location-map" role="region" aria-label="Bản đồ chọn vị trí" />
    {!ready && !error && <p role="status">Đang tải bản đồ…</p>}
    {error && <div role="alert"><p>{error}</p><Button variant="secondary" onClick={() => setAttempt((value) => value + 1)}>Thử lại bản đồ</Button></div>}
    {selected && <p>Vĩ độ: {coordinateText(selected.latitude)} · Kinh độ: {coordinateText(selected.longitude)}</p>}
    {selected && placementOf(area, selected)?.inside === false && <p className="form-error form-warning" role="alert"><span>Điểm này nằm ngoài vùng tô xanh (ranh giới vùng theo sơ đồ cấp phép).</span></p>}
    <div className="location-map__actions">
      <Button fullWidth size="large" disabled={!ready || !selected || !!error} onClick={() => selected && onConfirm(selected)}>Dùng tọa độ này</Button>
    </div>
  </>;
}
