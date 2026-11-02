import { lazyPage, type ManageRoute } from "@/shared/routing/lazy-page";

/** Mua hàng: nhà cung cấp, công nợ, phiếu nhập, trả tiền, danh mục vật tư, chi phí vật tư bè. */
export const ROUTES: ManageRoute[] = [
  { path: "/manage/suppliers", element: lazyPage(() => import("@/features/purchasing/pages/suppliers")) },
  { path: "/manage/suppliers/new", element: lazyPage(() => import("@/features/purchasing/pages/supplier-form")) },
  { path: "/manage/suppliers/:id", element: lazyPage(() => import("@/features/purchasing/pages/supplier-detail")) },
  { path: "/manage/suppliers/:id/edit", element: lazyPage(() => import("@/features/purchasing/pages/supplier-form")) },
  { path: "/manage/supplier-debts", element: lazyPage(() => import("@/features/purchasing/pages/supplier-debts")) },
  { path: "/manage/purchases", element: lazyPage(() => import("@/features/purchasing/pages/purchases")) },
  { path: "/manage/purchases/new", element: lazyPage(() => import("@/features/purchasing/pages/purchase-form")) },
  { path: "/manage/purchases/:id", element: lazyPage(() => import("@/features/purchasing/pages/purchase-detail")) },
  { path: "/manage/purchases/:id/edit", element: lazyPage(() => import("@/features/purchasing/pages/purchase-form")) },
  { path: "/manage/supplier-payments", element: lazyPage(() => import("@/features/purchasing/pages/supplier-payments")) },
  { path: "/manage/input-items", element: lazyPage(() => import("@/features/purchasing/pages/input-items")) },
  { path: "/manage/raft-costs", element: lazyPage(() => import("@/features/purchasing/pages/raft-costs")) },
];
