import type { MyPermissions } from "@/features/auth/models/Permissions";
import type { RoleKey } from "@/features/dashboard/models/Dashboard";
import type { Access, FeatureKey } from "@/models/Navigation";
import { EMPLOYEE_WORK_ENABLED } from "@/constants/features";
import { hasFunction } from "@/features/auth/services/permissionsService";
import { roleName } from "@/utils/labels";

export const FEATURE_ACCESS: Record<FeatureKey, Access> = {
  workPlans: { functions: ["WORK_ASSIGNMENTS"] },
  salesProducts: { owner: true },
  myWork: { employee: true },
  leaveRequests: { owner: true },
  attendanceSettings: { owner: true },
  zones: { owner: true },
  cycles: { functions: ["CULTIVATION_CYCLES"] },
  seeding: { functions: ["CULTIVATION_CYCLES"] },
  cultivationLog: { functions: ["CULTIVATION_LOGS"] },
  water: { functions: ["WATER_MEASUREMENTS"] },
  raftMaterials: { owner: true },
  assignments: { functions: ["WORK_ASSIGNMENTS"] },
  attendance: { functions: ["ATTENDANCE"] },
  schedule: { functions: ["WORK_ASSIGNMENTS", "ATTENDANCE"] },
  // Cân từng lồng (`api/harvest-lots/{id}/cages`) cần quyền sửa lô thu hoạch trong vùng (HarvestLots Edit), như việc cân lô.
  portWeighing: { functions: ["HARVEST_LOTS"] },
  // Kế hoạch thu hoạch: Chủ HTX và Quản lý vùng xem (HARVEST_PLANS View); ghi nhận thu cần thêm quyền ghi thu hoạch của vùng.
  harvestPlans: { functions: ["HARVEST_PLANS"] },
  salesOrders: { functions: ["PURCHASE_REQUESTS"] },
  receivables: { functions: ["CUSTOMER_DEBTS"] },
  receipts: { functions: ["CUSTOMER_PAYMENTS"] },
  reconcile: { functions: ["CUSTOMER_PAYMENTS"] },
  // Trả lại tiền (`customer-payments/pay-back`) cần quyền tạo phiếu thu, không cần quyền khiếu nại.
  refunds: { functions: ["CUSTOMER_PAYMENTS"] },
  // Backend chỉ cho Chủ HTX dùng bảng lương (`PayrollsController` có `[RequireCooperativeOwner]`), dù vai trò Kế toán có PAYROLL.
  payroll: { owner: true },
  costs: { functions: ["PURCHASE_RECEIPTS", "SUPPLIER_PAYMENTS"] },
  staff: { functions: ["LABOR_WORKERS"] },
  // Báo cáo sản lượng (`api/harvest-yield`) cần quyền xem lô thu hoạch; SALES_REPORTS chưa có API nào dùng.
  reports: { functions: ["HARVEST_LOTS"] },
  orders: { trader: true },
  payment: { trader: true },
  weighSlips: { trader: true },
  myInvoices: { trader: true },
  pickup: { trader: true },
  claims: { trader: true, owner: true, functions: ["QUALITY_CLAIMS"] },
  accounts: { owner: true },
  permissions: { owner: true },
  auditLog: { owner: true },
  broadcast: { owner: true },
  settings: { owner: true },
  suppliers: { owner: true, functions: ["SUPPLIERS"] },
  purchases: { owner: true, functions: ["PURCHASE_RECEIPTS"] },
  supplierPayments: { owner: true, functions: ["SUPPLIER_PAYMENTS"] },
  inputItems: { owner: true },
  traderRequests: { owner: true },
  cooperative: { owner: true },
  customers: { functions: ["CUSTOMERS"] },
  materialUsage: { functions: ["CULTIVATION_CYCLES"] },
  harvestSettings: { owner: true },
  payRates: { functions: ["PAY_RULES"] },
  payslips: { employee: true },
  bankAccount: { owner: true },
  // Truy vết (TRACE-02): Quản lý vùng, Kế toán và Chủ HTX; backend lọc theo vùng của lô.
  lotTrace: { owner: true, functions: ["LOT_TRACING"] },
  // Xuất dùng (INPUT_ISSUES): Quản lý vùng lập phiếu ở vùng mình, Kế toán chỉ xem; xuất hủy và thẻ kho để bản web.
  inputUses: { owner: true, functions: ["INPUT_ISSUES"] },
  trace: { everyone: true },
};

/** Chức năng mở màn "Công việc của tôi". */
const EMPLOYEE_WORK_FEATURES: FeatureKey[] = ["myWork", "schedule"];

export function canUseFeature(permissions: MyPermissions, key: FeatureKey): boolean {
  if (!EMPLOYEE_WORK_ENABLED && EMPLOYEE_WORK_FEATURES.includes(key)) return false;
  const access = FEATURE_ACCESS[key];
  if (access.everyone) return true;
  if (access.employee && (permissions.subjectType === "Staff" || permissions.isCooperativeOwner)) return true;
  if (access.owner && permissions.isCooperativeOwner) return true;
  if (access.trader && permissions.subjectType === "Trader") return true;
  return access.functions?.some((code) => hasFunction(permissions, code)) ?? false;
}

/** Vai trò gần nhất để chọn bộ chức năng hiện trên trang chủ. */
export function roleKeyFor(permissions: MyPermissions): RoleKey {
  if (permissions.isCooperativeOwner) return "owner";
  if (permissions.subjectType === "Trader") return "trader";
  const roles = permissions.grants.map((g) => g.role.toLowerCase());
  if (roles.some((r) => r.includes("zone manager") || r.includes("quản lý vùng"))) return "zoneManager";
  if (roles.some((r) => r.includes("accountant") || r.includes("kế toán"))) return "accountant";
  return "staff";
}

/** Tên vai trò hiện trên trang chủ và tài khoản: nhân viên thấy các vai trò và vùng được cấp. */
export function describeGrants(permissions: MyPermissions): string {
  if (permissions.isCooperativeOwner) return "Chủ HTX, toàn HTX";
  if (permissions.subjectType === "Trader") return "Thương lái";
  if (permissions.grants.length === 0) return "Nhân viên, chưa có quyền quản lý vùng";
  return permissions.grants.map((g) => `${roleName(g.role)}, ${g.allZones ? "toàn HTX" : (g.zoneName ?? g.zoneCode ?? "một vùng")}`).join("; ");
}
