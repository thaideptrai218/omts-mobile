import type { ManageRoute } from "@/models/Navigation";
import { lazyPage } from "@/routes/lazyPage";

/** Màn chỉ có ở bản dev; điều kiện này được thay lúc build nên bản production không chứa các màn dưới. */
export const ROUTES: ManageRoute[] = import.meta.env.DEV
  ? [
      { path: "/dev/payment-sandbox", element: lazyPage(() => import("@/features/development/pages/PaymentSandboxPage")) },
      { path: "/mock/:key", element: lazyPage(() => import("@/features/mock/pages/MockListPage")) },
      { path: "/mock/:key/:id", element: lazyPage(() => import("@/features/mock/pages/MockDetailPage")) },
    ]
  : [];
