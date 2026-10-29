import { lazyPage, type ManageRoute } from "@/components/manage/lazy";

/** Vùng nuôi, bè, giấy tờ và chỉ số nước của Chủ HTX. */
export const ROUTES: ManageRoute[] = [
  { path: "/manage/zones/:id/map", element: lazyPage(() => import("./zone-map")) },
  { path: "/manage/zones", element: lazyPage(() => import("./zones")) },
  { path: "/manage/zones/new", element: lazyPage(() => import("./zone-form")) },
  { path: "/manage/zones/:id", element: lazyPage(() => import("./zone-detail")) },
  { path: "/manage/zones/:id/edit", element: lazyPage(() => import("./zone-form")) },
  { path: "/manage/zones/:id/rafts/new", element: lazyPage(() => import("./raft-form")) },
  { path: "/manage/rafts/:raftId", element: lazyPage(() => import("./raft-detail")) },
  { path: "/manage/rafts/:raftId/edit", element: lazyPage(() => import("./raft-form")) },
  { path: "/manage/licenses/:id", element: lazyPage(() => import("./license-detail")) },
  { path: "/manage/water", element: lazyPage(() => import("./water")) },
  { path: "/manage/water/:id", element: lazyPage(() => import("./water-detail")) },
];
