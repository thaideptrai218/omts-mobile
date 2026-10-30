import { useAtomValue } from "jotai";
import type { ReactNode } from "react";
import { Empty, ManagePage } from "@/components/manage/ui";
import { hasFunction } from "@/services/acs/permissions";
import { permissionsAtom, sessionAtom } from "@/state/session";

/** Không mount màn hoặc tải dữ liệu trước khi xác định đúng tài khoản và quyền. */
export default function WorkforceGate({ mode, children }: { mode: "personal" | "manager" | "owner"; children: ReactNode }) {
  const session = useAtomValue(sessionAtom);
  const permissions = useAtomValue(permissionsAtom);
  if (!session) return <ManagePage title="Công việc"><Empty title="Vui lòng liên kết tài khoản" /></ManagePage>;
  if (!permissions || permissions.accountId !== session.accountId) return <ManagePage title="Công việc"><div className="skeleton skeleton--form" aria-busy /></ManagePage>;
  const allowed = mode === "owner" ? permissions.isCooperativeOwner
    : mode === "personal" ? permissions.subjectType === "Staff" || permissions.isCooperativeOwner
    : permissions.isCooperativeOwner || hasFunction(permissions, "WORK_ASSIGNMENTS") || hasFunction(permissions, "ATTENDANCE");
  if (!allowed) return <ManagePage title="Công việc"><Empty icon="zi-lock" title="Bạn chưa có quyền dùng chức năng này" /></ManagePage>;
  return <div key={session.accountId}>{children}</div>;
}
