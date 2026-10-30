import { useCallback } from "react";
import { useNavigate, useSnackbar } from "zmp-ui";

import { routeForScan } from "@/shared/platform/scan-targets";
import { scanQr, ScanUnavailable } from "@/shared/platform/zalo";

/**
 * Quét QR rồi mở màn tương ứng với mã (nút giữa thanh điều hướng). Ngoài Zalo không có máy quét nên mở màn truy
 * xuất để nhập mã lô; trong Zalo mà người dùng đóng máy quét thì không làm gì.
 */
export function useScan() {
  const navigate = useNavigate();
  const { openSnackbar } = useSnackbar();

  return useCallback(async () => {
    try {
      const to = routeForScan(await scanQr());
      if (to) navigate(to);
      else openSnackbar({ text: "Mã QR này không phải mã của OMTS. Hãy quét mã in trên bao bì hàu.", type: "warning", duration: 5000 });
    } catch (err) {
      if (err instanceof ScanUnavailable && !err.insideZalo) {
        navigate("/trace");
        openSnackbar({ text: "Chỉ quét được khi mở trong Zalo. Bạn có thể nhập mã lô.", type: "info", duration: 5000 });
      }
    }
  }, [navigate, openSnackbar]);
}
