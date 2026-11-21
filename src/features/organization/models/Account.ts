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

/** Một cặp vùng–vai trò (FARM-05): có hiệu lực từ lúc cấp tới khi bị thu hồi; `state` là Effective hoặc Revoked. */
export type GrantRow = {
  id: string;
  zoneId: string | null;
  zoneName: string | null;
  allZones: boolean;
  roleId: string;
  /** Mã vai trò: ZONE_MANAGER hoặc ACCOUNTANT. */
  role: string;
  roleName: string | null;
  state: string | null;
  grantedAt: string;
  grantedByName: string | null;
  revokedAt: string | null;
  revokedByName: string | null;
  revokeReason: string | null;
};

/** Cấp một cặp vùng–vai trò; `zoneId` null là toàn HTX. Không có ngày hiệu lực: có hiệu lực ngay tới khi thu hồi. */
export type GrantDraft = {
  zoneId: string | null;
  roleId: string;
};

export type AccountStatusFilter = "active" | "locked" | "all";

export type AccountSearchParams = {
  search?: string;
  statusId?: number | null;
  page: number;
  pageSize?: number;
};
