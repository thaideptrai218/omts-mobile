import type { RaftListItem } from "@/features/farming/models/Raft";
import type { ZoneView } from "@/features/farming/models/Zone";
import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "zmp-ui";
import vietmapgl from "@vietmap/vietmap-gl-js";
import "@vietmap/vietmap-gl-js/dist/vietmap-gl.css";

import { Empty } from "@/components/Empty/Empty";
import { VIETMAP_API_KEY } from "@/constants/env";
import { USAGE } from "@/features/farming/services/farmService";
import { statusLabel } from "@/utils/labels";

import "@/features/farming/components/RaftMap/RaftMap.scss";

/** Không chuyển null thành 0 hoặc ghim nhầm bè có tọa độ ngoài phạm vi hợp lệ. */
function coordinate(value: { latitude: number | null; longitude: number | null }): [number, number] | null {
  const { latitude: lat, longitude: lng } = value;
  return typeof lat === "number" && typeof lng === "number" && Number.isFinite(lat) && Number.isFinite(lng)
    && Math.abs(lat) <= 90 && Math.abs(lng) <= 180 ? [lng, lat] : null;
}

/** Chỉ đọc mã trạng thái, không đưa URL chứa API key hoặc nội dung lỗi SDK lên giao diện/log. */
function mapErrorText(cause: unknown): string {
  const event = cause as { error?: { status?: number }; status?: number } | undefined;
  const status = event?.error?.status ?? event?.status;
  if (status === 423 || status === 429) {
    return "Bản đồ đang bị giới hạn lượt tải. Vui lòng liên hệ người quản trị kiểm tra quyền sử dụng và hạn mức dịch vụ.";
  }
  if (status === 401 || status === 403) {
    return "Dịch vụ bản đồ từ chối truy cập. Vui lòng liên hệ người quản trị kiểm tra cấu hình dịch vụ.";
  }
  return "Không tải được bản đồ. Vui lòng kiểm tra kết nối hoặc cấu hình dịch vụ bản đồ rồi thử lại.";
}

export default function RaftMap({ zone, rafts, onOpenRaft }: {
  zone: ZoneView;
  rafts: RaftListItem[];
  onOpenRaft: (id: string) => void;
}) {
  const container = useRef<HTMLDivElement>(null);
  const [attempt, setAttempt] = useState(0);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState("");
  const points = useMemo(() => rafts.reduce<{ raft: RaftListItem; position: [number, number] }[]>((result, raft) => {
    const position = coordinate(raft);
    if (position) result.push({ raft, position });
    return result;
  }, []), [rafts]);
  const zonePosition = useMemo(() => coordinate(zone), [zone]);
  const hasPosition = points.length > 0 || zonePosition !== null;

  useEffect(() => {
    if (!VIETMAP_API_KEY || !hasPosition || !container.current) return;
    let map: vietmapgl.Map | undefined;
    let observer: ResizeObserver | undefined;
    let disposed = false;
    let loaded = false;
    let resourceFailed = false;
    const fail = (cause?: unknown) => {
      resourceFailed = true;
      window.clearTimeout(timeout);
      if (!disposed) setError(mapErrorText(cause));
    };
    const timeout = window.setTimeout(() => {
      if (!loaded && !disposed) setError("Bản đồ đang tải lâu hơn dự kiến. Vui lòng kiểm tra kết nối hoặc thử lại.");
    }, 9000);
    setReady(false);
    setError("");
    try {
      map = new vietmapgl.Map({
        container: container.current,
        style: `https://maps.vietmap.vn/maps/styles/hm/style.json?apikey=${encodeURIComponent(VIETMAP_API_KEY)}`,
        center: points[0]?.position ?? zonePosition!,
        zoom: 16,
        attributionControl: {},
      });
      map.on("error", fail);
      map.on("load", () => {
        if (disposed || !map) return;
        loaded = true;
        window.clearTimeout(timeout);
        if (!resourceFailed) setError("");
        const bounds = new vietmapgl.LngLatBounds();
        if (zonePosition) {
          new vietmapgl.Marker({ color: "#0050C8" }).setLngLat(zonePosition)
            .setPopup(new vietmapgl.Popup().setText(`Vùng ${zone.name ?? zone.code ?? "nuôi"}`)).addTo(map);
          bounds.extend(zonePosition);
        }
        points.forEach(({ raft, position }) => {
          const button = document.createElement("button");
          button.type = "button";
          button.className = `raft-map__pin${raft.statusId === USAGE.inUse ? "" : " raft-map__pin--inactive"}`;
          button.textContent = `Bè ${raft.code ?? "chưa có mã"}${raft.statusId === USAGE.inUse ? "" : ` · ${statusLabel(raft.status).text}`}`;
          button.setAttribute("aria-label", `Mở bè ${raft.code ?? "chưa có mã"}, ${statusLabel(raft.status).text}`);
          button.addEventListener("click", () => onOpenRaft(raft.id));
          new vietmapgl.Marker({ element: button, anchor: "bottom" }).setLngLat(position).addTo(map!);
          bounds.extend(position);
        });
        map.fitBounds(bounds, { padding: 64, maxZoom: 17, duration: 0 });
        map.resize();
        setReady(true);
      });
      if (typeof ResizeObserver !== "undefined") {
        observer = new ResizeObserver(() => map?.resize());
        observer.observe(container.current);
      }
    } catch (cause) {
      fail(cause);
    }
    return () => {
      disposed = true;
      window.clearTimeout(timeout);
      observer?.disconnect();
      map?.remove();
    };
  }, [attempt, hasPosition, onOpenRaft, points, zone, zonePosition]);

  if (!VIETMAP_API_KEY) return <Empty icon="zi-location" title="Bản đồ chưa được cấu hình" text="Vui lòng liên hệ người quản trị để bật dịch vụ bản đồ." />;
  if (!hasPosition) return <Empty icon="zi-location" title="Chưa có tọa độ để hiển thị" text="Cập nhật tọa độ vùng nuôi hoặc bè rồi mở lại bản đồ." />;

  return (
    <div className="raft-map">
      <p className="form__hint">Ghim xanh dương là vùng nuôi. Chạm nhãn bè để mở chi tiết; bè ngừng dùng có nhãn “Ngừng dùng” trong danh sách bên dưới.</p>
      <div className="raft-map__frame">
        <div className="raft-map__canvas" ref={container} role="region" aria-label="Bản đồ vị trí vùng nuôi và bè" />
        {!ready && !error && <div className="raft-map__loading skeleton" role="status">Đang tải bản đồ…</div>}
      </div>
      {error && <div role="alert"><p className="form__hint">{error}</p><Button variant="secondary" onClick={() => setAttempt((value) => value + 1)}>Thử lại bản đồ</Button></div>}
      <p className="form__hint">Đã ghim {points.length}/{rafts.length} bè. {rafts.length > points.length ? "Bè thiếu tọa độ hoặc có tọa độ không hợp lệ chưa được ghim." : ""}</p>
      <ul className="rows">
        {points.map(({ raft }) => <li key={raft.id}><button className="row" type="button" onClick={() => onOpenRaft(raft.id)}><span>Bè {raft.code} · {statusLabel(raft.status).text}</span></button></li>)}
      </ul>
    </div>
  );
}
