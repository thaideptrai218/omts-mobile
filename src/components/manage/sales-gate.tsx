import { useAtomValue } from "jotai";
import type { ReactNode } from "react";
import { Empty, ManagePage } from "@/components/manage/ui";
import { hasFunction } from "@/services/acs/permissions";
import { permissionsAtom, sessionAtom } from "@/state/session";

export default function SalesGate({ mode, children }: { mode: "trader" | "inbox" | "owner"; children: ReactNode }) {
  const session = useAtomValue(sessionAtom); const p = useAtomValue(permissionsAtom);
  if (!session) return <ManagePage title="Mua bán"><Empty title="Vui lòng liên kết tài khoản" /></ManagePage>;
  if (!p || p.accountId !== session.accountId) return <ManagePage title="Mua bán"><div className="skeleton skeleton--form" aria-busy /></ManagePage>;
  const allowed = mode === "trader" ? p.subjectType === "Trader" : mode === "owner" ? p.isCooperativeOwner : p.isCooperativeOwner || hasFunction(p, "PURCHASE_REQUESTS");
  if (!allowed) return <ManagePage title="Mua bán"><Empty icon="zi-lock" title="Bạn chưa có quyền dùng chức năng này" /></ManagePage>;
  return <div key={session.accountId}>{children}</div>;
}
