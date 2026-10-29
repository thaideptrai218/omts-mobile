import { lazyPage, type ManageRoute } from "@/components/manage/lazy";

/** Tổ chức của HTX: nhân viên, tài khoản và phân quyền, vai trò, hồ sơ HTX. */
export const ROUTES: ManageRoute[] = [
  { path: "/manage/employees", element: lazyPage(() => import("./employees")) },
  { path: "/manage/employees/new", element: lazyPage(() => import("./employee-form")) },
  { path: "/manage/employees/:id", element: lazyPage(() => import("./employee-detail")) },
  { path: "/manage/employees/:id/edit", element: lazyPage(() => import("./employee-form")) },
  { path: "/manage/accounts", element: lazyPage(() => import("./accounts")) },
  { path: "/manage/accounts/:id", element: lazyPage(() => import("./account-detail")) },
  { path: "/manage/roles", element: lazyPage(() => import("./roles")) },
  { path: "/manage/roles/:id", element: lazyPage(() => import("./role-detail")) },
  { path: "/manage/cooperative", element: lazyPage(() => import("./cooperative")) },
];
