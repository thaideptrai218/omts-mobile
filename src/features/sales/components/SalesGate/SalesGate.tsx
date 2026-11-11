import { useAtomValue } from "jotai";
import { Fragment, type ReactNode } from "react";
import { Empty } from "@/components/Empty/Empty";
import { ManagePage } from "@/components/ManagePage/ManagePage";
import { hasFunction } from "@/features/auth/services/permissionsService";
import { permissionsAtom, sessionAtom } from "@/features/auth/state/authAtoms";

export default function SalesGate({ mode, children }: { mode: "trader" | "inbox" | "owner"; children: ReactNode }) {
  const session = useAtomValue(sessionAtom); const p = useAtomValue(permissionsAtom);
  if (!session) return <ManagePage title="Mua bán"><Empty title="Vui lòng liên kết tài khoản" /></ManagePage>;
  if (!p || p.accountId !== session.accountId) return <ManagePage title="Mua bán"><div className="loading" role="status" aria-busy><p className="loading__text">Đang tải...</p><div className="skeleton skeleton--form" aria-hidden /></div></ManagePage>;
  const allowed = mode === "trader" ? p.subjectType === "Trader" : mode === "owner" ? p.isCooperativeOwner : p.isCooperativeOwner || hasFunction(p, "PURCHASE_REQUESTS");
  if (!allowed) return <ManagePage title="Mua bán"><Empty icon="zi-lock" title="Bạn chưa có quyền dùng chức năng này" /></ManagePage>;
  // Fragment, không bọc div: thẻ bọc làm trang mất chiều cao nên thanh "Quay lại" và nút chân màn hình không dính được.
  return <Fragment key={session.accountId}>{children}</Fragment>;
}
