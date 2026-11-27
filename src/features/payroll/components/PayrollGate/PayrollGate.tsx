import { useAtomValue } from "jotai";
import { Fragment, type ReactNode } from "react";
import { Empty } from "@/components/Empty/Empty";
import { ManagePage } from "@/components/ManagePage/ManagePage";
import { PermissionsPending } from "@/features/auth/components/PermissionsPending/PermissionsPending";
import { permissionsAtom, sessionAtom } from "@/features/auth/state/authAtoms";

/**
 * Không mount màn hoặc tải dữ liệu trước khi biết đúng tài khoản và quyền. `owner`: bảng lương, trả lương và cài đặt lương
 * chỉ dành cho Chủ HTX, theo loại tài khoản chứ không theo vai trò (LABOR-12 đến LABOR-16). `payRules`: Bảng giá công cho
 * Kế toán và Chủ HTX (LABOR-11, quyền PAY_RULES xem). Máy chủ vẫn là chốt chặn cuối.
 */
export default function PayrollGate({ mode, title, children }: { mode: "owner" | "payRules"; title: string; children: ReactNode }) {
  const session = useAtomValue(sessionAtom);
  const permissions = useAtomValue(permissionsAtom);
  if (!session) return <ManagePage title={title}><Empty title="Vui lòng liên kết tài khoản" /></ManagePage>;
  if (!permissions || permissions.accountId !== session.accountId) {
    return (
      <ManagePage title={title}>
        <PermissionsPending />
      </ManagePage>
    );
  }
  const allowed = permissions.isCooperativeOwner
    || (mode === "payRules" && permissions.functions.some((f) => f.function === "PAY_RULES" && f.actions.includes("View")));
  if (!allowed) {
    return (
      <ManagePage title={title}>
        <Empty icon="zi-lock" title="Bạn chưa có quyền dùng chức năng này" text={mode === "owner" ? "Chức năng này chỉ dành cho Chủ HTX." : undefined} />
      </ManagePage>
    );
  }
  // Fragment, không bọc div: thẻ bọc làm trang mất chiều cao nên thanh "Quay lại" và nút chân màn hình không dính được.
  return <Fragment key={session.accountId}>{children}</Fragment>;
}
