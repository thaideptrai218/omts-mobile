import { lazyPage, type ManageRoute } from "@/components/manage/lazy";

/** Mua hàng: nhà cung cấp, công nợ, phiếu nhập, trả tiền, danh mục vật tư, chi phí vật tư bè. */
export const ROUTES: ManageRoute[] = [
  { path: "/manage/suppliers", element: lazyPage(() => import("./suppliers")) },
  { path: "/manage/suppliers/new", element: lazyPage(() => import("./supplier-form")) },
  { path: "/manage/suppliers/:id", element: lazyPage(() => import("./supplier-detail")) },
  { path: "/manage/suppliers/:id/edit", element: lazyPage(() => import("./supplier-form")) },
  { path: "/manage/supplier-debts", element: lazyPage(() => import("./supplier-debts")) },
  { path: "/manage/purchases", element: lazyPage(() => import("./purchases")) },
  { path: "/manage/purchases/new", element: lazyPage(() => import("./purchase-form")) },
  { path: "/manage/purchases/:id", element: lazyPage(() => import("./purchase-detail")) },
  { path: "/manage/purchases/:id/edit", element: lazyPage(() => import("./purchase-form")) },
  { path: "/manage/supplier-payments", element: lazyPage(() => import("./supplier-payments")) },
  { path: "/manage/input-items", element: lazyPage(() => import("./input-items")) },
  { path: "/manage/raft-costs", element: lazyPage(() => import("./raft-costs")) },
];
