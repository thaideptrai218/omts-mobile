import type { ManageRoute } from "@/models/Navigation";
import { lazyPage } from "@/routes/lazyPage";

export const ROUTES: ManageRoute[] = [
  { path: "/account/purchases", element: lazyPage(() => import("@/features/sales/pages/MyPurchasesPage")) },
  { path: "/account/weighings", element: lazyPage(() => import("@/features/sales/pages/MyWeighingsPage")) },
  { path: "/account/invoices", element: lazyPage(() => import("@/features/sales/pages/MyInvoicesPage")) },
  { path: "/manage/purchase-requests", element: lazyPage(() => import("@/features/sales/pages/PurchaseRequestsPage")) },
  { path: "/manage/sales-products", element: lazyPage(() => import("@/features/sales/pages/SalesProductsPage")) },
  { path: "/manage/weighings", element: lazyPage(() => import("@/features/sales/pages/WeighingsPage")) },
  { path: "/manage/weighings/:requestId", element: lazyPage(() => import("@/features/sales/pages/RequestWeighingsPage")) },
  { path: "/manage/invoices/new", element: lazyPage(() => import("@/features/sales/pages/InvoiceFormPage")) },
  { path: "/manage/invoices/:id", element: lazyPage(() => import("@/features/sales/pages/InvoiceDetailPage")) },
];
