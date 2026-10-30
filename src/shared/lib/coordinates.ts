export type Coordinates = { latitude: number; longitude: number };

/** Tọa độ dùng dấu chấm hoặc phẩy thập phân, tuyệt đối không bỏ dấu chấm như phân cách hàng nghìn. */
export function parseCoordinate(text: string, axis: "latitude" | "longitude"): number | null {
  const normalized = text.trim().replace(",", ".");
  if (!/^[+-]?\d+(?:\.\d+)?$/.test(normalized)) return null;
  const value = Number(normalized);
  return Number.isFinite(value) && Math.abs(value) <= (axis === "latitude" ? 90 : 180) ? value : null;
}

export function readCoordinates(latitude: string, longitude: string): Coordinates | null {
  const lat = parseCoordinate(latitude, "latitude");
  const lng = parseCoordinate(longitude, "longitude");
  return lat !== null && lng !== null ? { latitude: lat, longitude: lng } : null;
}

export function coordinateText(value: number): string { return value.toFixed(6); }
