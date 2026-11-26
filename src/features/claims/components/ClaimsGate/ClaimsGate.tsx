import { useAtomValue } from "jotai";
import { Fragment, type ReactNode } from "react";

import { Empty } from "@/components/Empty/Empty";
import { ManagePage } from "@/components/ManagePage/ManagePage";
import { PermissionsPending } from "@/features/auth/components/PermissionsPending/PermissionsPending";
import { hasFunction } from "@/features/auth/services/permissionsService";
import { permissionsAtom, sessionAtom } from "@/features/auth/state/authAtoms";

/** Khung chờ trong lúc chuyển sang màn khiếu nại của HTX. */
export function ClaimsLoading() {
  return (
    <ManagePage title="Khiếu nại">
      <div className="loading" role="status" aria-busy>
        <p className="loading__text">Đang tải...</p>
        <div className="skeleton skeleton--form" aria-hidden />
      </div>
    </ManagePage>
  );
}

/**
 * Ai mở được màn khiếu nại: `trader` là thương lái xem khiếu nại của mình (BR-ACCOUNT-04); `staff` là Chủ HTX hoặc nhân viên
 * có quyền QUALITY_CLAIMS (Quản lý vùng chỉ xem). Đây chỉ là cổng điều hướng, backend vẫn kiểm tra quyền và vùng.
 */
export function ClaimsGate({ mode, children }: { mode: "trader" | "staff"; children: ReactNode }) {
  const session = useAtomValue(sessionAtom);
  const p = useAtomValue(permissionsAtom);
  if (!session) {
    return (
      <ManagePage title="Khiếu nại">
        <Empty icon="zi-lock" title="Vui lòng liên kết tài khoản" />
      </ManagePage>
    );
  }
  if (!p || p.accountId !== session.accountId) {
    return (
      <ManagePage title="Khiếu nại">
        <PermissionsPending />
      </ManagePage>
    );
  }
  const allowed = mode === "trader" ? p.subjectType === "Trader" : p.subjectType !== "Trader" && (p.isCooperativeOwner || hasFunction(p, "QUALITY_CLAIMS"));
  if (!allowed) {
    return (
      <ManagePage title="Khiếu nại">
        <Empty icon="zi-lock" title="Bạn chưa có quyền dùng chức năng này" />
      </ManagePage>
    );
  }
  // Fragment, không bọc div: thẻ bọc làm trang mất chiều cao nên thanh "Quay lại" và nút chân màn hình không dính được.
  return <Fragment key={session.accountId}>{children}</Fragment>;
}
