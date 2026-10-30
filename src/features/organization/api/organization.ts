import type { Paged } from "@/shared/api/paged";
import { API_BASE_URL } from "@/shared/config/env";
import { api } from "@/shared/api/http";

/**
 * Tổ chức của HTX cho Chủ HTX: nhân viên (`api/employees`), tài khoản và phân quyền theo vùng (`api/accounts`),
 * vai trò (`api/roles`), hồ sơ HTX (`api/cooperative/profile`). Tạo tài khoản, đặt lại mật khẩu, sửa quyền của
 * vai trò và đổi logo làm trên bản web.
 */


export type ZoneRef = { id: string; code: string | null; name: string | null };

export type ZoneLookupItem = ZoneRef & { statusId: number; status: string | null };

export type LinkedAccount = { id: string; username: string | null; displayName: string | null; status: string | null };

export type EmployeeListItem = {
  id: string;
  fullName: string | null;
  phoneNumber: string | null;
  workingZones: ZoneRef[];
  account: LinkedAccount | null;
  status: string | null;
};

export type BankAccount = { bankName: string | null; accountNumber: string | null; accountHolderName: string | null };

export type EmployeeView = {
  id: string;
  fullName: string | null;
  phoneNumber: string | null;
  birthday: string | null;
  address: string | null;
  area: string | null;
  ward: string | null;
  otherInformation: string | null;
  notes: string | null;
  workingZones: ZoneRef[];
  bankAccount: BankAccount | null;
  account: LinkedAccount | null;
  status: string | null;
  employmentEndDate: string | null;
  rowVersion: string | null;
};

export type SaveEmployee = {
  fullName: string;
  phoneNumber: string | null;
  birthday: string | null;
  address: string | null;
  area: string | null;
  ward: string | null;
  otherInformation: string | null;
  notes: string | null;
  workingZoneIds: string[];
  bankAccount: BankAccount | null;
  accountId: string | null;
  rowVersion: string | null;
};

export type EmployeeSaved = { employee: EmployeeView; message: string | null };

/** Việc nên làm tiếp sau khi cho nghỉ hoặc nhận lại: "review-lock" (xem có khóa tài khoản), "review-access". */
export type EmploymentChanged = { employee: EmployeeView; followUp: { action: string; accountId: string } | null };

export type StaffAccount = {
  id: string;
  displayName: string | null;
  username: string | null;
  phoneNumber: string | null;
  phoneVerified: boolean;
  email: string | null;
  emailVerified: boolean;
  status: string | null;
  mustChangePassword: boolean;
  employeeId: string | null;
  rowVersion: string | null;
};

/** `state`: Effective, NotYetEffective, Expired, Revoked (tính theo ngày hôm nay ở server). */
export type GrantRow = {
  id: string;
  zoneId: string | null;
  zoneName: string | null;
  allZones: boolean;
  roleId: string;
  roleName: string | null;
  effectiveFrom: string;
  effectiveTo: string | null;
  state: string | null;
  revokedAt: string | null;
  revokeReason: string | null;
};

export type GrantDraft = { zoneId: string | null; roleId: string; effectiveFrom: string | null; effectiveTo: string | null };

export type RolePermission = { functionCode: string | null; actions: string[]; dataScope: string };

export type RoleView = {
  id: string;
  name: string | null;
  description: string | null;
  status: string | null;
  permissions: RolePermission[];
  rowVersion: string | null;
};

export type RoleImpact = { accountCount: number; zoneCount: number; allZonesGranted: boolean; accounts: string[] };

export type FunctionCatalogItem = { code: string | null; name: string | null; cooperativeWide: boolean; supportedActions: string[] };

export type CooperativeProfile = {
  id: string;
  fullName: string | null;
  taxCode: string | null;
  officeAddress: string | null;
  phoneNumber: string | null;
  email: string | null;
  website: string | null;
  legalRepresentative: string | null;
  businessLines: string[];
  logoUrl: string | null;
  status: string | null;
  rowVersion: string | null;
};

export type SaveCooperativeProfile = Omit<CooperativeProfile, "id" | "logoUrl" | "status">;

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
export function listEmployees(p: { search?: string; statusId?: number | null; page: number; pageSize?: number }) {
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
export function listAccounts(p: { search?: string; statusId?: number | null; page: number; pageSize?: number }) {
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
  return api<{ profile: CooperativeProfile; message: string | null }>("/api/cooperative/profile", { method: "PUT", body });
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
export const GRANT_STATE: Record<string, { text: string; tone: "success" | "warning" | "neutral" | "danger" }> = {
  Effective: { text: "Đang hiệu lực", tone: "success" },
  NotYetEffective: { text: "Chưa tới ngày", tone: "warning" },
  Expired: { text: "Đã hết hạn", tone: "neutral" },
  Revoked: { text: "Đã thu hồi", tone: "neutral" },
};
