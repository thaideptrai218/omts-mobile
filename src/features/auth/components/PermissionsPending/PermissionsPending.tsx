import { useCallback, useEffect, useState } from "react";

import { Loadable } from "@/components/Loadable/Loadable";
import { loadPermissions } from "@/features/auth/services/permissionsService";
import { errorText } from "@/utils/errorText";

/**
 * Chỗ chờ của các cổng quyền (Lương, Mua bán, Khiếu nại, Công việc) khi chưa có quyền của phiên. Tự tải lại quyền thay vì
 * chỉ chờ `SessionGuard`: lần tải đó bỏ qua lỗi (ví dụ mở app lúc mất mạng), nên trước đây màn đứng mãi ở "Đang tải...".
 * Lỗi thì hiện chữ lỗi và nút "Thử lại" như mọi màn khác.
 */
export function PermissionsPending() {
  const [error, setError] = useState("");
  const load = useCallback(() => {
    setError("");
    loadPermissions().catch((err: unknown) => setError(errorText(err)));
  }, []);
  useEffect(load, [load]);
  return (
    <Loadable data={null} error={error} reload={load}>
      {() => null}
    </Loadable>
  );
}
