import { useAtomValue } from "jotai";
import { Fragment, type ReactNode } from "react";
import { Empty } from "@/components/Empty/Empty";
import { ManagePage } from "@/components/ManagePage/ManagePage";
import { PermissionsPending } from "@/features/auth/components/PermissionsPending/PermissionsPending";
import { hasFunction } from "@/features/auth/services/permissionsService";
import { permissionsAtom, sessionAtom } from "@/features/auth/state/authAtoms";

/**
 * Không mount màn hoặc tải dữ liệu trước khi xác định đúng tài khoản và quyền. `requests`: danh sách yêu cầu của nhân viên
 * (SCR-LABOR-03) cần quyền xem Phân công; Quản lý vùng chỉ xem, Chủ HTX mới duyệt (LABOR-05).
 */
export default function WorkforceGate({ mode, children }: { mode: "personal" | "manager" | "requests" | "owner"; children: ReactNode }) {
  const session = useAtomValue(sessionAtom);
  const permissions = useAtomValue(permissionsAtom);
  if (!session) return <ManagePage title="Công việc"><Empty title="Vui lòng liên kết tài khoản" /></ManagePage>;
  if (!permissions || permissions.accountId !== session.accountId) return <ManagePage title="Công việc"><PermissionsPending /></ManagePage>;
  const allowed = mode === "owner" ? permissions.isCooperativeOwner
    : mode === "personal" ? permissions.subjectType === "Staff" || permissions.isCooperativeOwner
    : mode === "requests" ? permissions.isCooperativeOwner || permissions.functions.some(f => f.function === "WORK_ASSIGNMENTS" && f.actions.includes("View"))
    : permissions.isCooperativeOwner || hasFunction(permissions, "WORK_ASSIGNMENTS") || hasFunction(permissions, "ATTENDANCE");
  if (!allowed) return <ManagePage title="Công việc"><Empty icon="zi-lock" title="Bạn chưa có quyền dùng chức năng này" /></ManagePage>;
  // Fragment, không bọc div: thẻ bọc làm trang mất chiều cao nên thanh "Quay lại" và nút chân màn hình không dính được.
  return <Fragment key={session.accountId}>{children}</Fragment>;
}
