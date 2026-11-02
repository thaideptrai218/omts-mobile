import { useState } from "react";
import { useSnackbar } from "zmp-ui";

import { errorText } from "@/shared/lib/messages";

/**
 * Chạy một thao tác ghi (lưu, duyệt, khóa…): `busy` để khóa nút, lỗi hiện bằng snackbar tiếng Việt, thành công
 * hiện `success` nếu có. Trả về kết quả, hoặc undefined khi lỗi.
 */
export function useAction() {
  const { openSnackbar } = useSnackbar();
  const [busy, setBusy] = useState(false);

  async function run<T>(action: () => Promise<T>, success?: string): Promise<T | undefined> {
    setBusy(true);
    try {
      const result = await action();
      if (success) openSnackbar({ text: success, type: "success", duration: 4000 });
      return result;
    } catch (err) {
      openSnackbar({ text: errorText(err), type: "error", duration: 6000 });
      return undefined;
    } finally {
      setBusy(false);
    }
  }

  return { busy, run };
}
