import type { Role, RoleKey } from "@/features/dashboard/models/Dashboard";
import type { FeatureKey } from "@/models/Navigation";

/** Chỉ bản dev mới có màn cho các chức năng này (dữ liệu mẫu). */
const devOnly = (actions: FeatureKey[]): FeatureKey[] => (import.meta.env.DEV ? actions : []);

/** Chức năng hiện trên trang chủ theo vai trò. Số liệu thật chỉ lấy từ API, không để số mẫu ở đây. */
export const ROLES: Record<RoleKey, Role> = {
  owner: {
    key: "owner",
    label: "Chủ HTX",
    actions: ["zones", "cycles", "salesOrders", "workPlans", "receivables", "staff", "trace", "reports"],
    actionGroups: [
      { title: "Vùng nuôi", hint: "Bè, chu kỳ nuôi, nước biển", area: "farm", actions: ["zones", "cycles", "seeding", "cultivationLog", "water", "raftMaterials", "materialUsage", "harvestSettings", "lotTrace", "trace"] },
      { title: "Mua hàng", hint: "Phiếu nhập, vật tư", area: "buy", actions: ["purchases", "suppliers", "supplierPayments", "inputItems", "inputUses"] },
      { title: "Bán hàng", hint: "Thương lái đặt mua", area: "sell", actions: ["salesOrders", "portWeighing", "salesProducts", "customers", "claims"] },
      { title: "Thu tiền", hint: "Công nợ, phiếu thu", area: "sell", actions: ["receivables", "receipts", "reconcile", "refunds", "bankAccount"] },
      { title: "Nhân công", hint: "Chấm công, nghỉ phép", area: "people", actions: ["workPlans", "assignments", "attendance", "leaveRequests", "attendanceSettings", "myWork"] },
      { title: "Lương", hint: "Bảng lương, giá công", area: "people", actions: ["payroll", "payRates"] },
      { title: "Tổ chức", hint: "Nhân sự, tài khoản, báo cáo", area: "org", actions: ["staff", "accounts", "permissions", "traderRequests", "cooperative", "reports", "auditLog"] },
      ...(import.meta.env.DEV
        ? [{ title: "Chưa có trên hệ thống", hint: "Dữ liệu mẫu", actions: devOnly(["broadcast"]) }]
        : [{ title: "Sắp có", hint: "Các chức năng đang làm", area: "stone" as const, actions: ["broadcast"] as FeatureKey[] }]),
    ],
  },
  zoneManager: {
    key: "zoneManager",
    label: "Quản lý vùng",
    actions: ["water", "purchases", "suppliers", "workPlans", "assignments", "attendance", "myWork", "cycles", "seeding", "cultivationLog", "portWeighing", "materialUsage", "inputUses", "customers", "claims", "lotTrace", "trace"],
  },
  staff: {
    key: "staff",
    label: "Nhân viên",
    actions: ["myWork", "schedule", "water", "purchases", "suppliers", "assignments", "attendance", "cultivationLog", "portWeighing", ...devOnly(["payslips"])],
  },
  accountant: {
    key: "accountant",
    label: "Kế toán",
    // Bảng lương chỉ Chủ HTX dùng được (backend), nên Kế toán không có mục "Lương nhân công".
    actions: ["supplierPayments", "purchases", "receipts", "receivables", "reconcile", "refunds", "customers", "payRates", "costs", "inputUses", "reports", "lotTrace", ...devOnly(["payslips"])],
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
