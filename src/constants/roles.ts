import type { Role, RoleKey } from "@/features/dashboard/models/Dashboard";
import type { FeatureKey } from "@/models/Navigation";

/** Chỉ bản dev mới có màn cho các chức năng này (dữ liệu mẫu). */
const devOnly = (actions: FeatureKey[]): FeatureKey[] => (import.meta.env.DEV ? actions : []);

/** Chức năng hiện trên trang chủ theo vai trò. Số liệu thật chỉ lấy từ API, không để số mẫu ở đây. */
export const ROLES: Record<RoleKey, Role> = {
  owner: {
    key: "owner",
    label: "Chủ HTX",
    actions: ["zones", "cycles", "harvest", "salesOrders", "workPlans", "receivables", "staff", "trace", "reports"],
    actionGroups: [
      { title: "Vùng nuôi", hint: "Bè, nước biển", area: "farm", actions: ["zones", "harvest", "water", "raftMaterials", "trace"] },
      { title: "Mua hàng", hint: "Phiếu nhập, vật tư", area: "buy", actions: ["purchases", "suppliers", "supplierPayments", "inputItems"] },
      { title: "Bán hàng", hint: "Thương lái đặt mua", area: "sell", actions: ["salesOrders", "portWeighing", "salesProducts"] },
      { title: "Nhân công", hint: "Chấm công, nghỉ phép", area: "people", actions: ["workPlans", "assignments", "attendance", "leaveRequests", "attendanceSettings", "myWork"] },
      { title: "Tổ chức", hint: "Nhân sự, tài khoản", area: "org", actions: ["staff", "accounts", "permissions", "traderRequests", "cooperative"] },
      ...(import.meta.env.DEV
        ? [
            { title: "Nuôi và thu hoạch", hint: "Dữ liệu mẫu", actions: devOnly(["cycles", "seeding", "cultivationLog", "materialUsage", "harvestSettings"]) },
            { title: "Bán hàng và tiền", hint: "Dữ liệu mẫu", actions: devOnly(["customers", "claims", "receivables", "receipts", "reconcile", "refunds", "bankAccount"]) },
            { title: "Lương, báo cáo", hint: "Dữ liệu mẫu", actions: devOnly(["payroll", "payRates", "payrollSettings", "reports", "auditLog", "broadcast"]) },
          ]
        : [{ title: "Sắp có", hint: "Các chức năng đang làm", area: "stone" as const, actions: ["cycles", "receivables", "payroll", "reports", "auditLog", "broadcast"] as FeatureKey[] }]),
    ],
  },
  zoneManager: {
    key: "zoneManager",
    label: "Quản lý vùng",
    actions: ["water", "purchases", "suppliers", "workPlans", "assignments", "attendance", "myWork", "cultivationLog", "seeding", "harvest", "portWeighing", "trace", ...devOnly(["cycles", "materialUsage", "customers", "claims"])],
  },
  staff: {
    key: "staff",
    label: "Nhân viên",
    actions: ["myWork", "schedule", "water", "purchases", "suppliers", "assignments", "attendance", "cultivationLog", "portWeighing", "harvest", ...devOnly(["payslips"])],
  },
  accountant: {
    key: "accountant",
    label: "Kế toán",
    actions: ["supplierPayments", "purchases", "receipts", "receivables", "reconcile", "refunds", "payroll", "costs", "reports", ...devOnly(["payRates", "payslips"])],
  },
  trader: {
    key: "trader",
    label: "Thương lái",
    actions: ["orders", "weighSlips", "myInvoices", "payment", "pickup", "claims", "trace"],
  },
  admin: {
    key: "admin",
    label: "Quản trị hệ thống",
    actions: ["accounts", "permissions", "zones", "auditLog", "broadcast", "settings"],
    note: "Các thao tác quản trị đầy đủ nằm trên bản web.",
  },
  viewer: {
    key: "viewer",
    label: "Người xem QR",
    actions: [],
  },
};
