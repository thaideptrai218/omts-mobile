import { lazyPage, type ManageRoute } from "@/shared/routing/lazy-page";

/** Tổ chức của HTX: nhân viên, tài khoản và phân quyền, vai trò, hồ sơ HTX. */
export const ROUTES: ManageRoute[] = [
  { path: "/manage/employees", element: lazyPage(() => import("@/features/organization/pages/employees")) },
  { path: "/manage/employees/new", element: lazyPage(() => import("@/features/organization/pages/employee-form")) },
  { path: "/manage/employees/:id", element: lazyPage(() => import("@/features/organization/pages/employee-detail")) },
  { path: "/manage/employees/:id/edit", element: lazyPage(() => import("@/features/organization/pages/employee-form")) },
  { path: "/manage/accounts", element: lazyPage(() => import("@/features/organization/pages/accounts")) },
  { path: "/manage/accounts/:id", element: lazyPage(() => import("@/features/organization/pages/account-detail")) },
  { path: "/manage/roles", element: lazyPage(() => import("@/features/organization/pages/roles")) },
  { path: "/manage/roles/:id", element: lazyPage(() => import("@/features/organization/pages/role-detail")) },
  { path: "/manage/cooperative", element: lazyPage(() => import("@/features/organization/pages/cooperative")) },
];
