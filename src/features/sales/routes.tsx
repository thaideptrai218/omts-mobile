import { lazyPage, type ManageRoute } from "@/shared/routing/lazy-page";

export const ROUTES: ManageRoute[] = [
  { path: "/account/purchases", element: lazyPage(() => import("./pages/my-purchases")) },
  { path: "/manage/purchase-requests", element: lazyPage(() => import("./pages/requests")) },
  { path: "/manage/sales-products", element: lazyPage(() => import("./pages/products")) },
];
