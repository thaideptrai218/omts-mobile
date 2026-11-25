import type { ManageRoute } from "@/models/Navigation";
import { lazyPage } from "@/routes/lazyPage";

/** Vùng nuôi, bè, giấy tờ, chu kỳ nuôi (thả giống, nhật ký), vật tư sửa bè, thu hoạch và chỉ số nước. */
export const ROUTES: ManageRoute[] = [
  { path: "/manage/zones/:id/map", element: lazyPage(() => import("@/features/farming/pages/ZoneMapPage")) },
  { path: "/manage/zones/:id/boundary", element: lazyPage(() => import("@/features/farming/pages/ZoneBoundaryPage")) },
  { path: "/manage/zones", element: lazyPage(() => import("@/features/farming/pages/ZonesPage")) },
  { path: "/manage/zones/new", element: lazyPage(() => import("@/features/farming/pages/ZoneFormPage")) },
  { path: "/manage/zones/:id", element: lazyPage(() => import("@/features/farming/pages/ZoneDetailPage")) },
  { path: "/manage/zones/:id/edit", element: lazyPage(() => import("@/features/farming/pages/ZoneFormPage")) },
  { path: "/manage/zones/:id/rafts/new", element: lazyPage(() => import("@/features/farming/pages/RaftFormPage")) },
  { path: "/manage/rafts/:raftId", element: lazyPage(() => import("@/features/farming/pages/RaftDetailPage")) },
  { path: "/manage/rafts/:raftId/edit", element: lazyPage(() => import("@/features/farming/pages/RaftFormPage")) },
  { path: "/manage/licenses/new", element: lazyPage(() => import("@/features/farming/pages/LicenseFormPage")) },
  { path: "/manage/licenses/:id", element: lazyPage(() => import("@/features/farming/pages/LicenseDetailPage")) },
  { path: "/manage/licenses/:id/edit", element: lazyPage(() => import("@/features/farming/pages/LicenseFormPage")) },
  { path: "/manage/licenses/:id/replace", element: lazyPage(() => import("@/features/farming/pages/LicenseFormPage")) },
  { path: "/manage/cycles", element: lazyPage(() => import("@/features/farming/pages/CyclesPage")) },
  { path: "/manage/cycles/raft/:raftId", element: lazyPage(() => import("@/features/farming/pages/RaftCyclesPage")) },
  { path: "/manage/cycles/:cycleId", element: lazyPage(() => import("@/features/farming/pages/CyclePage")) },
  { path: "/manage/cycles/:cycleId/seeding", element: lazyPage(() => import("@/features/farming/pages/SeedingPage")) },
  { path: "/manage/cycles/:cycleId/logs", element: lazyPage(() => import("@/features/farming/pages/CultivationLogsPage")) },
  { path: "/manage/harvest", element: lazyPage(() => import("@/features/farming/pages/HarvestPage")) },
  { path: "/manage/harvest/:raftId", element: lazyPage(() => import("@/features/farming/pages/RaftHarvestPage")) },
  { path: "/manage/material-usages", element: lazyPage(() => import("@/features/farming/pages/MaterialUsagesPage")) },
  { path: "/manage/material-usages/:id", element: lazyPage(() => import("@/features/farming/pages/MaterialUsageDetailPage")) },
  { path: "/manage/rafts/:raftId/material-usages", element: lazyPage(() => import("@/features/farming/pages/RaftMaterialUsagesPage")) },
  { path: "/manage/harvest-settings", element: lazyPage(() => import("@/features/farming/pages/HarvestSettingsPage")) },
  { path: "/manage/water", element: lazyPage(() => import("@/features/farming/pages/WaterPage")) },
  { path: "/manage/lot-trace", element: lazyPage(() => import("@/features/traceability/pages/LotTraceSearchPage")) },
  { path: "/manage/lot-trace/:lotId", element: lazyPage(() => import("@/features/traceability/pages/LotTracePage")) },
  { path: "/manage/water/:id", element: lazyPage(() => import("@/features/farming/pages/WaterDetailPage")) },
];
