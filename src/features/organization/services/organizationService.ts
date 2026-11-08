import type { AccountSearchParams, GrantDraft, GrantRow, StaffAccount } from "@/features/organization/models/Account";
import type { CooperativeProfile, CooperativeProfileSaved, SaveCooperativeProfile } from "@/features/organization/models/Cooperative";
import type { EmployeeListItem, EmployeeSaved, EmployeeSearchParams, EmployeeView, EmploymentChanged, SaveEmployee } from "@/features/organization/models/Employee";
import type { ZoneLookupItem } from "@/features/organization/models/OrganizationZone";
import type { FunctionCatalogItem, RoleImpact, RoleStatusLabel, RoleView } from "@/features/organization/models/Role";
import type { Paged } from "@/models/Pagination";

import { API_BASE_URL } from "@/constants/env";
import { api } from "@/services/httpClient";

export const STATUS_ID = {
  employeeWorking: 401,
  employeeLeft: 402,
  accountActive: 301,
  accountLocked: 302,
  inUse: 101,
  discontinued: 102,
} as const;

function query(params: Record<string, string | number | null | undefined>) {
  const parts = Object.entries(params)
    .filter(([, v]) => v !== null && v !== undefined && v !== "")
    .map(([k, v]) => `${k}=${encodeURIComponent(String(v))}`);
  return parts.length ? `?${parts.join("&")}` : "";
}

export function lookupZones() {
  return api<ZoneLookupItem[]>("/api/zones/lookup");
}

// Nhân viên
export function listEmployees(p: EmployeeSearchParams) {
  return api<Paged<EmployeeListItem>>(`/api/employees${query({ search: p.search, statusId: p.statusId, page: p.page, pageSize: p.pageSize ?? 20 })}`);
}

export function getEmployee(id: string) {
  return api<EmployeeView>(`/api/employees/${id}`);
}

export function createEmployee(body: SaveEmployee) {
  return api<EmployeeSaved>("/api/employees", { method: "POST", body });
}

export function updateEmployee(id: string, body: SaveEmployee) {
  return api<EmployeeSaved>(`/api/employees/${id}`, { method: "PUT", body });
}

export function endEmployment(id: string, endDate: string, rowVersion: string | null) {
  return api<EmploymentChanged>(`/api/employees/${id}/end-employment`, { method: "POST", body: { endDate, rowVersion } });
}

export function reinstateEmployee(id: string, rowVersion: string | null) {
  return api<EmploymentChanged>(`/api/employees/${id}/reinstate`, { method: "POST", body: { rowVersion } });
}

// Tài khoản và phân quyền
export function listAccounts(p: AccountSearchParams) {
  return api<Paged<StaffAccount>>(`/api/accounts${query({ search: p.search, statusId: p.statusId, page: p.page, pageSize: p.pageSize ?? 20 })}`);
}

export function getAccount(id: string) {
  return api<StaffAccount>(`/api/accounts/${id}`);
}

export function lockAccount(id: string, reason: string) {
  return api<StaffAccount>(`/api/accounts/${id}/lock`, { method: "POST", body: { reason } });
}

export function unlockAccount(id: string, reason: string) {
  return api<StaffAccount>(`/api/accounts/${id}/unlock`, { method: "POST", body: { reason } });
}

export function listGrants(accountId: string) {
  return api<GrantRow[]>(`/api/accounts/${accountId}/grants`);
}

export function addGrant(accountId: string, draft: GrantDraft) {
  return api<GrantRow>(`/api/accounts/${accountId}/grants`, { method: "POST", body: draft });
}

export function revokeGrant(accountId: string, grantId: string, reason: string) {
  return api<GrantRow>(`/api/accounts/${accountId}/grants/${grantId}/revoke`, { method: "POST", body: { reason } });
}

// Vai trò
export function listRoles(statusId?: number | null) {
  return api<RoleView[]>(`/api/roles${query({ statusId })}`);
}

export function getRole(id: string) {
  return api<RoleView>(`/api/roles/${id}`);
}

export function getRoleImpact(id: string) {
  return api<RoleImpact>(`/api/roles/${id}/impact`);
}

export function discontinueRole(id: string) {
  return api<RoleView>(`/api/roles/${id}/discontinue`, { method: "POST" });
}

export function reactivateRole(id: string) {
  return api<RoleView>(`/api/roles/${id}/reactivate`, { method: "POST" });
}

export function listPermissionFunctions() {
  return api<FunctionCatalogItem[]>("/api/permission-functions");
}

// Hồ sơ HTX
export function getCooperativeProfile() {
  return api<CooperativeProfile>("/api/cooperative/profile");
}

export function updateCooperativeProfile(body: SaveCooperativeProfile) {
  return api<CooperativeProfileSaved>("/api/cooperative/profile", { method: "PUT", body });
}

/** Logo server trả đường dẫn tương đối (`/api/public/...`): ghép gốc API để ảnh tải được trong Zalo. */
export function absoluteUrl(path: string | null) {
  if (!path) return null;
  return /^https?:\/\//.test(path) ? path : API_BASE_URL + path;
}

/** Tên chức năng trong danh mục quyền (backend trả tiếng Anh kèm mã use case) → tiếng Việt. */
export const FUNCTION_NAME: Record<string, string> = {
  CULTIVATION_CYCLES: "Chu kỳ nuôi, thả giống",
  CULTIVATION_LOGS: "Nhật ký nuôi, loại bỏ hàng hàu",
  WATER_MEASUREMENTS: "Đo chỉ số nước",
  HARVESTS: "Kế hoạch và ghi nhận thu hoạch",
  HARVEST_LOTS: "Lô thu hoạch, sản lượng, truy vết lô",
  PROVENANCE: "Công bố truy xuất, tem QR",
  SUPPLIERS: "Nhà cung cấp",
  PURCHASE_RECEIPTS: "Phiếu nhập và trả hàng",
  SUPPLIER_PAYMENTS: "Trả tiền và công nợ nhà cung cấp",
  CUSTOMERS: "Hồ sơ khách hàng",
  PURCHASE_REQUESTS: "Phản hồi yêu cầu mua hàng",
  SALES_INVOICES: "Hóa đơn bán",
  QUALITY_CLAIMS: "Khiếu nại chất lượng, trả hàng",
  CUSTOMER_PAYMENTS: "Thu tiền khách hàng",
  CUSTOMER_DEBTS: "Công nợ khách hàng",
  LABOR_WORKERS: "Nhân công thời vụ và tổ đội",
  WORK_ASSIGNMENTS: "Phân công, xác nhận khoán",
  ATTENDANCE: "Chấm công",
  PAY_RULES: "Bảng giá công",
  PAYROLL: "Bảng lương, trả lương",
  SALES_REPORTS: "Báo cáo bán hàng, doanh thu",
  DASHBOARD_DAILY_REVENUE: "Ô tổng quan: doanh thu ngày",
  DASHBOARD_RECEIVABLES: "Ô tổng quan: công nợ phải thu",
  DASHBOARD_OPEN_HARVEST_LOTS: "Ô tổng quan: lô thu hoạch đang mở",
  DASHBOARD_WATER_ALERTS: "Ô tổng quan: cảnh báo nước",
  DASHBOARD_PENDING_TASKS: "Ô tổng quan: việc chờ xử lý",
};

/** Trạng thái hiệu lực của một lần cấp quyền (`GrantRow.state`). */
export const GRANT_STATE: Record<string, RoleStatusLabel> = {
  Effective: { text: "Đang hiệu lực", tone: "success" },
  NotYetEffective: { text: "Chưa tới ngày", tone: "warning" },
  Expired: { text: "Đã hết hạn", tone: "neutral" },
  Revoked: { text: "Đã thu hồi", tone: "neutral" },
};
