import { api } from "@/shared/api/http";
import { type Coordinates, readCoordinates } from "@/shared/lib/coordinates";
import { NotInZalo, zaloAccessToken, zaloLocationToken } from "@/shared/platform/zalo";

export async function currentRaftPosition(): Promise<Coordinates> {
  let zaloAccess: string;
  try { zaloAccess = await zaloAccessToken(); }
  catch (cause) {
    if (cause instanceof NotInZalo) throw new Error("Lấy vị trí chỉ dùng được khi mở trong Zalo trên điện thoại. Bạn có thể nhập tọa độ hoặc chọn trên bản đồ.");
    throw cause;
  }
  const locationToken = await zaloLocationToken();
  const resolved = await api<Coordinates>("/api/me/zalo-location", {
    method: "POST", body: { zaloAccessToken: zaloAccess, locationToken },
  });
  const valid = readCoordinates(String(resolved.latitude), String(resolved.longitude));
  if (!valid) throw new Error("Zalo chưa trả về tọa độ hợp lệ. Vui lòng thử lại.");
  return valid;
}
