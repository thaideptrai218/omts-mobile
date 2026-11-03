import type { ManageRoute } from "@/models/Navigation";
import { lazyPage } from "@/routes/lazyPage";

export const ROUTES: ManageRoute[] = [
  { path: "/account/purchases", element: lazyPage(() => import("@/features/sales/pages/MyPurchasesPage")) },
  { path: "/manage/purchase-requests", element: lazyPage(() => import("@/features/sales/pages/PurchaseRequestsPage")) },
  { path: "/manage/sales-products", element: lazyPage(() => import("@/features/sales/pages/SalesProductsPage")) },
];
