import { useEffect, useRef, useState } from "react";
import { Button } from "zmp-ui";
import vietmapgl from "@vietmap/vietmap-gl-js";
import "@vietmap/vietmap-gl-js/dist/vietmap-gl.css";

import { VIETMAP_API_KEY } from "@/config";
import { coordinateText, type Coordinates } from "@/services/coordinates";

export default function LocationMap({ initial, center, onConfirm }: { initial: Coordinates | null; center?: Coordinates | null; onConfirm: (position: Coordinates) => void }) {
  const container = useRef<HTMLDivElement>(null);
  const [start] = useState(initial);
  const [viewCenter] = useState(initial ?? center);
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
          marker = new vietmapgl.Marker({ color: "#006AF5", draggable: true }).setLngLat([position.longitude, position.latitude]).addTo(map);
          marker.on("dragend", () => { const point = marker!.getLngLat(); setSelected({ latitude: point.lat, longitude: point.lng }); });
        } else marker.setLngLat([position.longitude, position.latitude]);
      };
      map.on("load", () => { if (disposed) return; loaded = true; window.clearTimeout(timer); setReady(true); if (!failed) setError(""); if (start) choose(start); map?.resize(); });
      map.on("click", (event) => choose({ latitude: event.lngLat.lat, longitude: event.lngLat.lng }));
      map.on("error", (event) => {
        failed = true;
        const status = (event.error as Error & { status?: number }).status;
        if (!disposed) setError(status === 423 || status === 429 ? "VIETMAP đang giới hạn dịch vụ bản đồ. Bạn vẫn có thể nhập tọa độ bằng tay hoặc lấy vị trí qua Zalo." : "Không tải được bản đồ. Vui lòng kiểm tra kết nối và cấu hình dịch vụ.");
      });
      if (typeof ResizeObserver !== "undefined") { observer = new ResizeObserver(() => map?.resize()); observer.observe(container.current); }
    } catch { setError("Thiết bị chưa mở được bản đồ. Bạn có thể nhập tọa độ bằng tay hoặc dùng Zalo."); }
    return () => { disposed = true; window.clearTimeout(timer); observer?.disconnect(); marker?.remove(); map?.remove(); };
  }, [attempt, start, viewCenter]);
  if (!VIETMAP_API_KEY) return <p className="form__hint">Chưa cấu hình dịch vụ bản đồ. Bạn có thể nhập tọa độ bằng tay hoặc dùng Zalo.</p>;
  return <>
    <p className="form__hint">Chạm trên bản đồ để đặt ghim, kéo ghim để chỉnh. Sau đó bấm Dùng tọa độ này.</p>
    <div ref={container} style={{ height: "42vh", minHeight: "16rem", width: "100%", borderRadius: "1rem" }} role="region" aria-label="Bản đồ chọn vị trí" />
    {!ready && !error && <p role="status">Đang tải bản đồ…</p>}
    {error && <div role="alert"><p>{error}</p><Button variant="secondary" onClick={() => setAttempt((value) => value + 1)}>Thử lại bản đồ</Button></div>}
    {selected && <p>Vĩ độ: {coordinateText(selected.latitude)} · Kinh độ: {coordinateText(selected.longitude)}</p>}
    <Button fullWidth size="large" disabled={!ready || !selected || !!error} onClick={() => selected && onConfirm(selected)}>Dùng tọa độ này</Button>
  </>;
}
