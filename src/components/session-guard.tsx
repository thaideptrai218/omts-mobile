import { useAtom, useAtomValue } from "jotai";
import { useEffect } from "react";
import { useLocation, useNavigate, useSnackbar } from "zmp-ui";

import { silentZaloLogin } from "@/services/acs/link";
import { MESSAGES } from "@/services/acs/messages";
import { loadPermissions } from "@/services/acs/permissions";
import { flashMessageAtom, gateAtom, permissionsAtom, sessionAtom, sessionExpiredAtom } from "@/state/session";

/** Đường dẫn chỉ mở được khi đã đăng nhập. */
const PROTECTED_PREFIXES = ["/account/", "/gate/"];
/** Đường dẫn chỉ dành cho người chưa đăng nhập. */
const LOGGED_OUT_ONLY = ["/link", "/recover", "/recover/reset"];
/** Màn được mở trong lúc bị cổng chặn (ngoài màn của chính cổng đó). */
const ALLOWED_DURING_GATE = ["/verify"];

/**
 * Điều hướng theo trạng thái phiên, đặt ngay trong ZMPRouter nên có `useNavigate`:
 * - mở app không có phiên: thử vào lại im lặng bằng token Zalo (tài khoản đã liên kết);
 * - cổng mật khẩu / số điện thoại chặn toàn bộ app cho tới khi xong (ACS-02);
 * - màn bảo vệ cần phiên, màn liên kết/khôi phục ẩn khi đã đăng nhập;
 * - phiên hết hạn (làm mới token thất bại) thì về màn liên kết và báo MSG19;
 * - có phiên và không bị chặn thì tải quyền để dựng menu.
 */
function SessionGuard() {
  const session = useAtomValue(sessionAtom);
  const gate = useAtomValue(gateAtom);
  const permissions = useAtomValue(permissionsAtom);
  const [expired, setExpired] = useAtom(sessionExpiredAtom);
  const [flash, setFlash] = useAtom(flashMessageAtom);
  const location = useLocation();
  const navigate = useNavigate();
  const { openSnackbar } = useSnackbar();
  const path = location.pathname;

  useEffect(() => {
    void silentZaloLogin();
  }, []);

  useEffect(() => {
    if (gate) {
      const gatePath = gate === "password" ? "/gate/password" : "/gate/phone";
      if (path !== gatePath && !ALLOWED_DURING_GATE.includes(path)) navigate(gatePath, { replace: true, animate: false });
      return;
    }
    if (!session && PROTECTED_PREFIXES.some((p) => path.startsWith(p))) {
      navigate("/link", { replace: true, animate: false });
      return;
    }
    if (session && LOGGED_OUT_ONLY.includes(path)) {
      navigate("/", { replace: true, animate: false });
    }
  }, [gate, session, path, navigate]);

  useEffect(() => {
    if (!expired) return;
    setExpired(false);
    navigate("/link", { replace: true });
    openSnackbar({ text: MESSAGES.MSG19, type: "warning", duration: 6000 });
  }, [expired, setExpired, navigate, openSnackbar]);

  useEffect(() => {
    if (!flash) return;
    setFlash(null);
    openSnackbar({ text: flash.text, type: flash.type ?? "success", duration: flash.duration ?? 5000 });
  }, [flash, setFlash, openSnackbar]);

  const accountId = session?.accountId;
  useEffect(() => {
    if (!accountId || gate || permissions) return;
    loadPermissions().catch(() => {
      // Lỗi mạng hoặc cổng chặn: trang chủ hiện trạng thái tương ứng, không cần xử lý thêm ở đây.
    });
  }, [accountId, gate, permissions]);

  return null;
}

export default SessionGuard;
