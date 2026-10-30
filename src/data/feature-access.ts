import { hasFunction } from "@/services/acs/permissions";
import type { MyPermissions } from "@/services/acs/types";

import type { FeatureKey } from "./features";
import type { RoleKey } from "./roles";

/**
 * Điều kiện để một chức năng xuất hiện trên dashboard, đối chiếu với `GET api/me/permissions`:
 * - `functions`: có quyền trên ít nhất một mã chức năng trong danh mục `PermissionFunctions` của backend;
 * - `owner`: chức năng riêng của Chủ HTX (không có trong danh mục vì Chủ HTX luôn có mọi quyền);
 * - `trader`: chức năng của thương lái;
 * - `everyone`: ai cũng thấy.
 * Đây chỉ là bộ lọc hiển thị; backend vẫn là nơi kiểm tra quyền cuối cùng (MSG02 khi bị từ chối).
 */
type Access = { functions?: string[]; owner?: boolean; trader?: boolean; employee?: boolean; everyone?: boolean };

export const FEATURE_ACCESS: Record<FeatureKey, Access> = {
  myWork: { employee: true },
  leaveRequests: { owner: true },
  attendanceSettings: { owner: true },
  zones: { owner: true },
  cycles: { functions: ["CULTIVATION_CYCLES"] },
  seeding: { functions: ["CULTIVATION_CYCLES"] },
  cultivationLog: { functions: ["CULTIVATION_LOGS"] },
  water: { functions: ["WATER_MEASUREMENTS"] },
  harvest: { functions: ["HARVESTS", "HARVEST_LOTS"] },
  raftMaterials: { owner: true },
  assignments: { functions: ["WORK_ASSIGNMENTS"] },
  attendance: { functions: ["ATTENDANCE"] },
  schedule: { functions: ["WORK_ASSIGNMENTS", "ATTENDANCE"] },
  portWeighing: { functions: ["SALES_INVOICES"] },
  salesOrders: { functions: ["SALES_INVOICES", "PURCHASE_REQUESTS"] },
  receivables: { functions: ["CUSTOMER_DEBTS"] },
  receipts: { functions: ["CUSTOMER_PAYMENTS"] },
  reconcile: { functions: ["CUSTOMER_PAYMENTS"] },
  refunds: { functions: ["QUALITY_CLAIMS", "CUSTOMER_PAYMENTS"] },
  payroll: { functions: ["PAYROLL"] },
  costs: { functions: ["PURCHASE_RECEIPTS", "SUPPLIER_PAYMENTS"] },
  staff: { functions: ["LABOR_WORKERS"] },
  reports: { functions: ["SALES_REPORTS"] },
  orders: { trader: true },
  payment: { trader: true },
  weighSlips: { trader: true },
  pickup: { trader: true },
  claims: { trader: true },
  accounts: { owner: true },
  permissions: { owner: true },
  auditLog: { owner: true },
  broadcast: { owner: true },
  settings: { owner: true },
  suppliers: { owner: true, functions: ["SUPPLIERS"] },
  purchases: { owner: true, functions: ["PURCHASE_RECEIPTS"] },
  supplierPayments: { owner: true },
  inputItems: { owner: true },
  traderRequests: { owner: true },
  cooperative: { owner: true },
  trace: { everyone: true },
};

export function canUseFeature(permissions: MyPermissions, key: FeatureKey): boolean {
  const access = FEATURE_ACCESS[key];
  if (access.everyone) return true;
  if (access.employee && (permissions.subjectType === "Staff" || permissions.isCooperativeOwner)) return true;
  if (access.owner && permissions.isCooperativeOwner) return true;
  if (access.trader && permissions.subjectType === "Trader") return true;
  return access.functions?.some((code) => hasFunction(permissions, code)) ?? false;
}

/** Vai trò gần nhất để chọn bộ số liệu và việc cần làm mẫu của dashboard (dữ liệu mẫu, chưa nối API). */
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
  return permissions.grants.map((g) => `${g.role}, ${g.allZones ? "toàn HTX" : (g.zoneName ?? g.zoneCode ?? "một vùng")}`).join("; ");
}
