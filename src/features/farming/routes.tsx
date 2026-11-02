import { lazyPage, type ManageRoute } from "@/shared/routing/lazy-page";

/** Vùng nuôi, bè, giấy tờ và chỉ số nước của Chủ HTX. */
export const ROUTES: ManageRoute[] = [
  { path: "/manage/zones/:id/map", element: lazyPage(() => import("@/features/farming/pages/zone-map")) },
  { path: "/manage/zones", element: lazyPage(() => import("@/features/farming/pages/zones")) },
  { path: "/manage/zones/new", element: lazyPage(() => import("@/features/farming/pages/zone-form")) },
  { path: "/manage/zones/:id", element: lazyPage(() => import("@/features/farming/pages/zone-detail")) },
  { path: "/manage/zones/:id/edit", element: lazyPage(() => import("@/features/farming/pages/zone-form")) },
  { path: "/manage/zones/:id/rafts/new", element: lazyPage(() => import("@/features/farming/pages/raft-form")) },
  { path: "/manage/rafts/:raftId", element: lazyPage(() => import("@/features/farming/pages/raft-detail")) },
  { path: "/manage/rafts/:raftId/edit", element: lazyPage(() => import("@/features/farming/pages/raft-form")) },
  { path: "/manage/licenses/:id", element: lazyPage(() => import("@/features/farming/pages/license-detail")) },
  { path: "/manage/water", element: lazyPage(() => import("@/features/farming/pages/water")) },
  { path: "/manage/water/:id", element: lazyPage(() => import("@/features/farming/pages/water-detail")) },
];
