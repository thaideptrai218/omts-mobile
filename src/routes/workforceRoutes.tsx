import type { ManageRoute } from "@/models/Navigation";
import { lazyPage } from "@/routes/lazyPage";

/** Nhân công: kế hoạch ngày làm, phân công, chấm công, nghỉ phép, bảng lương và giá công. */
export const ROUTES: ManageRoute[] = [
  { path: "/manage/work-plans", element: lazyPage(() => import("@/features/workforce/pages/WorkDayPlansPage")) },
  { path: "/account/work", element: lazyPage(() => import("@/features/workforce/pages/MyWorkPage")) },
  { path: "/manage/workforce", element: lazyPage(() => import("@/features/workforce/pages/WorkforcePage")) },
  { path: "/manage/leave-requests", element: lazyPage(() => import("@/features/workforce/pages/LeaveRequestsPage")) },
  { path: "/manage/attendance-settings", element: lazyPage(() => import("@/features/workforce/pages/AttendanceSettingsPage")) },
  { path: "/manage/payrolls", element: lazyPage(() => import("@/features/payroll/pages/PayrollsPage")) },
  { path: "/manage/payrolls/new", element: lazyPage(() => import("@/features/payroll/pages/PayrollCreatePage")) },
  { path: "/manage/payrolls/:id", element: lazyPage(() => import("@/features/payroll/pages/PayrollDetailPage")) },
  { path: "/manage/payroll-slips/:slipId", element: lazyPage(() => import("@/features/payroll/pages/PayslipPage")) },
  { path: "/manage/payroll-employees/:employeeId", element: lazyPage(() => import("@/features/payroll/pages/EmployeePayslipsPage")) },
  { path: "/manage/payroll-payments", element: lazyPage(() => import("@/features/payroll/pages/PayrollPaymentsPage")) },
  { path: "/manage/pay-rates", element: lazyPage(() => import("@/features/payroll/pages/PayRatesPage")) },
  { path: "/manage/pay-rates/:id", element: lazyPage(() => import("@/features/payroll/pages/PayRateDetailPage")) },
  { path: "/manage/payroll-settings", element: lazyPage(() => import("@/features/payroll/pages/PayrollSettingsPage")) },
];
