import { useCallback, useState } from "react";
import { useNavigate, useSnackbar } from "zmp-ui";

import { logout } from "@/services/acs/auth";
import { MESSAGES } from "@/services/acs/messages";

/**
 * Đăng xuất rồi về trang chủ công khai. Phiên đã hết hạn thì báo MSG19; đang mất mạng thì báo MSG07
 * (phiên trên máy đã xóa, lệnh thu hồi trên server sẽ gửi khi có mạng).
 */
export function useLogout() {
  const navigate = useNavigate();
  const { openSnackbar } = useSnackbar();
  const [busy, setBusy] = useState(false);

  const run = useCallback(async () => {
    setBusy(true);
    try {
      const outcome = await logout();
      navigate("/", { replace: true });
      if (outcome === "expired") openSnackbar({ text: MESSAGES.MSG19, type: "warning", duration: 6000 });
      if (outcome === "offline") openSnackbar({ text: MESSAGES.MSG07, type: "warning", duration: 8000 });
    } finally {
      setBusy(false);
    }
  }, [navigate, openSnackbar]);

  return { logout: run, busy };
}
