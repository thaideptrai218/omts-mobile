import type { LinkRouteState } from "@/features/auth/models/LinkAccount";
import { useCallback } from "react";
import { useLocation, useNavigate } from "zmp-ui";

/**
 * Nút "Quay lại" của màn liên kết tài khoản.
 * - Mở từ nút "Liên kết tài khoản" (trang chủ, Tài khoản, Thông báo): lùi một trang như mọi màn khác.
 * - SessionGuard tự đẩy sang (mở màn bảo vệ lúc chưa có phiên, phiên hết hạn): trang phía sau là màn bảo vệ, lùi về đó
 *   thì SessionGuard lại đẩy sang `/link` ngay, người dùng thấy nút không có tác dụng. Khi đó về trang chủ.
 * - Mở thẳng `/link` khi chưa có trang nào phía sau (`location.key` là "default"): lùi không đi đâu cả, cũng về trang chủ.
 */
export function useLinkBack() {
  const navigate = useNavigate();
  const location = useLocation();
  const redirected = (location.state as LinkRouteState | null)?.redirected === true;
  const nothingBehind = location.key === "default";

  return useCallback(() => {
    if (redirected || nothingBehind) navigate("/", { replace: true, direction: "backward" });
    else navigate(-1);
  }, [navigate, redirected, nothingBehind]);
}
