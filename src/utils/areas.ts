import type { AreaKey, FeatureKey } from "@/models/Navigation";

/** Khu vực của từng chức năng: quyết định màu ô biểu tượng và màu đầu trang của màn đó. */
export const FEATURE_AREA: Record<FeatureKey, AreaKey> = {
  zones: "farm", cycles: "farm", seeding: "farm", cultivationLog: "farm", water: "farm", harvest: "farm",
  raftMaterials: "farm", materialUsage: "farm", harvestSettings: "farm", trace: "farm",
  suppliers: "buy", purchases: "buy", supplierPayments: "buy", inputItems: "buy", costs: "buy",
  salesOrders: "sell", salesProducts: "sell", receivables: "sell", receipts: "sell", reconcile: "sell", refunds: "sell",
  orders: "sell", payment: "sell", weighSlips: "sell", myInvoices: "sell", pickup: "sell", claims: "sell", portWeighing: "sell",
  customers: "sell", bankAccount: "sell",
  workPlans: "people", myWork: "people", leaveRequests: "people", attendanceSettings: "people", assignments: "people",
  attendance: "people", schedule: "people", payroll: "people", payRates: "people", payslips: "people", payrollSettings: "people",
  staff: "org", accounts: "org", permissions: "org", cooperative: "org", traderRequests: "org", settings: "org",
  auditLog: "org", broadcast: "org", reports: "org",
};

const PATH_AREAS: [string, AreaKey][] = [
  ["/manage/zones", "farm"], ["/manage/water", "farm"], ["/manage/rafts", "farm"], ["/manage/licenses", "farm"],
  ["/manage/raft-costs", "farm"], ["/manage/harvest", "farm"], ["/trace", "farm"],
  ["/manage/purchases", "buy"], ["/manage/supplier", "buy"], ["/manage/input-items", "buy"],
  ["/manage/purchase-requests", "sell"], ["/manage/sales-products", "sell"], ["/account/purchases", "sell"],
  ["/manage/weighings", "sell"], ["/manage/invoices", "sell"], ["/account/weighings", "sell"], ["/account/invoices", "sell"],
  ["/manage/work-plans", "people"], ["/manage/workforce", "people"], ["/manage/leave-requests", "people"],
  ["/manage/attendance-settings", "people"], ["/account/work", "people"],
  ["/manage/employees", "org"], ["/manage/accounts", "org"], ["/manage/roles", "org"], ["/manage/cooperative", "org"],
  ["/account/trader-requests", "org"],
];

/** Khu vực của một đường dẫn. Màn không thuộc khu vực nào (hồ sơ, thông báo...) trả về undefined và dùng màu biển. */
export function areaForPath(pathname: string): AreaKey | undefined {
  const found = PATH_AREAS.find(([prefix]) => pathname === prefix || pathname.startsWith(`${prefix}/`) || (prefix === "/manage/supplier" && pathname.startsWith(prefix)));
  if (found) return found[1];
  const feature = /^\/(?:feature|mock)\/([^/]+)/.exec(pathname)?.[1];
  return feature && feature in FEATURE_AREA ? FEATURE_AREA[feature as FeatureKey] : undefined;
}
