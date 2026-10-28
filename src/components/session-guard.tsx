import { useAtom, useAtomValue } from "jotai";
import { useEffect } from "react";
import { useLocation, useNavigate, useSnackbar } from "zmp-ui";

import { silentZaloLogin } from "@/services/acs/link";
import { MESSAGES } from "@/services/acs/messages";
import { loadPermissions } from "@/services/acs/permissions";
import { flashMessageAtom, permissionsAtom, sessionAtom, sessionExpiredAtom } from "@/state/session";

/** Đường dẫn chỉ mở được khi đã liên kết tài khoản. */
const PROTECTED_PREFIX = "/account/";

/**
 * Điều hướng theo trạng thái phiên, đặt ngay trong ZMPRouter nên có `useNavigate`:
 * - mở app không có phiên: thử vào lại im lặng bằng token Zalo (tài khoản đã liên kết);
 * - màn bảo vệ cần phiên, màn liên kết ẩn khi đã có phiên;
 * - phiên hết hạn (làm mới token thất bại) thì về màn liên kết và báo MSG19;
 * - có phiên thì tải quyền để dựng menu.
 */
function SessionGuard() {
  const session = useAtomValue(sessionAtom);
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
    if (!session && path.startsWith(PROTECTED_PREFIX)) {
      navigate("/link", { replace: true, animate: false });
      return;
    }
    if (session && path === "/link") {
      navigate("/", { replace: true, animate: false });
    }
  }, [session, path, navigate]);

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
    if (!accountId || permissions) return;
    loadPermissions().catch(() => {
      // Lỗi mạng: trang chủ hiện trạng thái tương ứng, không cần xử lý thêm ở đây.
    });
  }, [accountId, permissions]);

  return null;
}

export default SessionGuard;
