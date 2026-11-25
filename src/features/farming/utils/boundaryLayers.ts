import type { ZoneBoundary } from "@/features/farming/models/ZoneBoundary";
import vietmapgl from "@vietmap/vietmap-gl-js";

const SOURCE = "zone-boundary";
// Màu của khu vực vùng nuôi (xanh ngọc, `farm` trong app.scss); lớp bản đồ không đọc được biến CSS.
const FILL = "#0a6f6c";

/**
 * Vẽ ranh giới vùng lên bản đồ đã tải xong: nền xanh ngọc mờ, viền đậm, nhãn tên điểm góc ở từng góc. Gọi lại với ranh giới
 * mới thì thay dữ liệu cũ. Trả các nhãn để gỡ khi vẽ lại hoặc khi đóng bản đồ, và mở rộng `bounds` cho vừa ranh giới.
 */
export function drawBoundary(map: vietmapgl.Map, boundary: ZoneBoundary | null, bounds?: vietmapgl.LngLatBounds, labels = true): vietmapgl.Marker[] {
  const data: ZoneBoundary = boundary ?? { type: "FeatureCollection", features: [] };
  const source = map.getSource(SOURCE) as vietmapgl.GeoJSONSource | undefined;
  if (source) source.setData(data);
  else {
    map.addSource(SOURCE, { type: "geojson", data });
    map.addLayer({ id: `${SOURCE}-fill`, type: "fill", source: SOURCE, paint: { "fill-color": FILL, "fill-opacity": 0.18 } });
    map.addLayer({ id: `${SOURCE}-line`, type: "line", source: SOURCE, paint: { "line-color": FILL, "line-width": 3 } });
  }
  const markers: vietmapgl.Marker[] = [];
  boundary?.features.forEach((feature) => {
    const ring = feature.geometry.coordinates[0] ?? [];
    const names = feature.properties?.corners ?? [];
    ring.slice(0, -1).forEach((position, index) => {
      bounds?.extend(position);
      if (!labels || !names[index]) return;
      const element = document.createElement("span");
      element.className = "boundary-corner";
      element.textContent = names[index];
      markers.push(new vietmapgl.Marker({ element, anchor: "bottom-left" }).setLngLat(position).addTo(map));
    });
  });
  return markers;
}
