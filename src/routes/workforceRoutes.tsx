import type { ManageRoute } from "@/models/Navigation";
import { lazyPage } from "@/routes/lazyPage";

export const ROUTES: ManageRoute[] = [
  { path: "/account/work", element: lazyPage(() => import("@/features/workforce/pages/MyWorkPage")) },
  { path: "/manage/workforce", element: lazyPage(() => import("@/features/workforce/pages/WorkforcePage")) },
  { path: "/manage/leave-requests", element: lazyPage(() => import("@/features/workforce/pages/LeaveRequestsPage")) },
  { path: "/manage/attendance-settings", element: lazyPage(() => import("@/features/workforce/pages/AttendanceSettingsPage")) },
];
