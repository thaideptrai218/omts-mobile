import { useAtomValue } from "jotai";
import { Fragment, type ReactNode } from "react";
import { Empty } from "@/components/Empty/Empty";
import { ManagePage } from "@/components/ManagePage/ManagePage";
import { hasFunction } from "@/features/auth/services/permissionsService";
import { permissionsAtom, sessionAtom } from "@/features/auth/state/authAtoms";

/** Không mount màn hoặc tải dữ liệu trước khi xác định đúng tài khoản và quyền. */
export default function WorkforceGate({ mode, children }: { mode: "personal" | "manager" | "owner"; children: ReactNode }) {
  const session = useAtomValue(sessionAtom);
  const permissions = useAtomValue(permissionsAtom);
  if (!session) return <ManagePage title="Công việc"><Empty title="Vui lòng liên kết tài khoản" /></ManagePage>;
  if (!permissions || permissions.accountId !== session.accountId) return <ManagePage title="Công việc"><div className="loading" role="status" aria-busy><p className="loading__text">Đang tải...</p><div className="skeleton skeleton--form" aria-hidden /></div></ManagePage>;
  const allowed = mode === "owner" ? permissions.isCooperativeOwner
    : mode === "personal" ? permissions.subjectType === "Staff" || permissions.isCooperativeOwner
    : permissions.isCooperativeOwner || hasFunction(permissions, "WORK_ASSIGNMENTS") || hasFunction(permissions, "ATTENDANCE");
  if (!allowed) return <ManagePage title="Công việc"><Empty icon="zi-lock" title="Bạn chưa có quyền dùng chức năng này" /></ManagePage>;
  // Fragment, không bọc div: thẻ bọc làm trang mất chiều cao nên thanh "Quay lại" và nút chân màn hình không dính được.
  return <Fragment key={session.accountId}>{children}</Fragment>;
}
