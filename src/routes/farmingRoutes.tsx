import type { ManageRoute } from "@/models/Navigation";
import { lazyPage } from "@/routes/lazyPage";

/** Vùng nuôi, bè, giấy tờ và chỉ số nước của Chủ HTX. */
export const ROUTES: ManageRoute[] = [
  { path: "/manage/zones/:id/map", element: lazyPage(() => import("@/features/farming/pages/ZoneMapPage")) },
  { path: "/manage/zones", element: lazyPage(() => import("@/features/farming/pages/ZonesPage")) },
  { path: "/manage/zones/new", element: lazyPage(() => import("@/features/farming/pages/ZoneFormPage")) },
  { path: "/manage/zones/:id", element: lazyPage(() => import("@/features/farming/pages/ZoneDetailPage")) },
  { path: "/manage/zones/:id/edit", element: lazyPage(() => import("@/features/farming/pages/ZoneFormPage")) },
  { path: "/manage/zones/:id/rafts/new", element: lazyPage(() => import("@/features/farming/pages/RaftFormPage")) },
  { path: "/manage/rafts/:raftId", element: lazyPage(() => import("@/features/farming/pages/RaftDetailPage")) },
  { path: "/manage/rafts/:raftId/edit", element: lazyPage(() => import("@/features/farming/pages/RaftFormPage")) },
  { path: "/manage/licenses/:id", element: lazyPage(() => import("@/features/farming/pages/LicenseDetailPage")) },
  { path: "/manage/water", element: lazyPage(() => import("@/features/farming/pages/WaterPage")) },
  { path: "/manage/water/:id", element: lazyPage(() => import("@/features/farming/pages/WaterDetailPage")) },
];
