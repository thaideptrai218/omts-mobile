import type { ManageRoute } from "@/models/Navigation";
import { lazyPage } from "@/routes/lazyPage";

/** Mua hàng: nhà cung cấp, công nợ, phiếu nhập, trả tiền, danh mục vật tư, chi phí vật tư bè. */
export const ROUTES: ManageRoute[] = [
  { path: "/manage/suppliers", element: lazyPage(() => import("@/features/purchasing/pages/SuppliersPage")) },
  { path: "/manage/suppliers/new", element: lazyPage(() => import("@/features/purchasing/pages/SupplierFormPage")) },
  { path: "/manage/suppliers/:id", element: lazyPage(() => import("@/features/purchasing/pages/SupplierDetailPage")) },
  { path: "/manage/suppliers/:id/edit", element: lazyPage(() => import("@/features/purchasing/pages/SupplierFormPage")) },
  { path: "/manage/supplier-debts", element: lazyPage(() => import("@/features/purchasing/pages/SupplierDebtsPage")) },
  { path: "/manage/supplier-debts/:id", element: lazyPage(() => import("@/features/purchasing/pages/SupplierDebtPage")) },
  { path: "/manage/purchases", element: lazyPage(() => import("@/features/purchasing/pages/PurchasesPage")) },
  { path: "/manage/purchases/new", element: lazyPage(() => import("@/features/purchasing/pages/PurchaseFormPage")) },
  { path: "/manage/purchases/:id", element: lazyPage(() => import("@/features/purchasing/pages/PurchaseDetailPage")) },
  { path: "/manage/purchases/:id/return", element: lazyPage(() => import("@/features/purchasing/pages/PurchaseReturnPage")) },
  { path: "/manage/purchases/:id/edit", element: lazyPage(() => import("@/features/purchasing/pages/PurchaseFormPage")) },
  { path: "/manage/supplier-payments", element: lazyPage(() => import("@/features/purchasing/pages/SupplierPaymentsPage")) },
  { path: "/manage/input-items", element: lazyPage(() => import("@/features/purchasing/pages/InputItemsPage")) },
  { path: "/manage/raft-costs", element: lazyPage(() => import("@/features/purchasing/pages/RaftCostsPage")) },
];
