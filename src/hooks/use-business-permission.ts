import { useAtomValue } from "jotai";
import { permissionsAtom, sessionAtom } from "@/state/session";

/** Chỉ điều khiển nút trên UI; máy chủ vẫn kiểm tra quyền thao tác và vùng của bản ghi. */
export function useBusinessPermission() {
  const permissions = useAtomValue(permissionsAtom);
  const session = useAtomValue(sessionAtom);
  return (code: string, action: string, zoneId?: string | null) => {
    if (!permissions || permissions.accountId !== session?.accountId) return false;
    return permissions.isCooperativeOwner || permissions.functions.some(f => f.function === code && f.actions.includes(action)
      && (!zoneId || f.allZones || f.zoneIds.includes(zoneId)));
  };
}
