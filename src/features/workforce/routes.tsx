import { lazyPage, type ManageRoute } from "@/shared/routing/lazy-page";

export const ROUTES: ManageRoute[] = [
  { path: "/account/work", element: lazyPage(() => import("./pages/mine")) },
  { path: "/manage/workforce", element: lazyPage(() => import("./pages/crew")) },
  { path: "/manage/leave-requests", element: lazyPage(() => import("./pages/review")) },
  { path: "/manage/attendance-settings", element: lazyPage(() => import("./pages/settings")) },
];
