import type { ManageRoute } from "@/models/Navigation";
import { lazyPage } from "@/routes/lazyPage";

/** Tổ chức của HTX: nhân viên, tài khoản và phân quyền, vai trò, hồ sơ HTX. */
export const ROUTES: ManageRoute[] = [
  { path: "/manage/employees", element: lazyPage(() => import("@/features/organization/pages/EmployeesPage")) },
  { path: "/manage/employees/new", element: lazyPage(() => import("@/features/organization/pages/EmployeeFormPage")) },
  { path: "/manage/employees/:id", element: lazyPage(() => import("@/features/organization/pages/EmployeeDetailPage")) },
  { path: "/manage/employees/:id/edit", element: lazyPage(() => import("@/features/organization/pages/EmployeeFormPage")) },
  { path: "/manage/accounts", element: lazyPage(() => import("@/features/organization/pages/AccountsPage")) },
  { path: "/manage/accounts/:id", element: lazyPage(() => import("@/features/organization/pages/AccountDetailPage")) },
  { path: "/manage/roles", element: lazyPage(() => import("@/features/organization/pages/RolesPage")) },
  { path: "/manage/roles/:id", element: lazyPage(() => import("@/features/organization/pages/RoleDetailPage")) },
  { path: "/manage/cooperative", element: lazyPage(() => import("@/features/organization/pages/CooperativePage")) },
];
