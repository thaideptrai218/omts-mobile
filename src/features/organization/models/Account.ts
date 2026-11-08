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

export type GrantDraft = {
  zoneId: string | null;
  roleId: string;
  effectiveFrom: string | null;
  effectiveTo: string | null;
};

export type AccountStatusFilter = "active" | "locked" | "all";

export type AccountSearchParams = {
  search?: string;
  statusId?: number | null;
  page: number;
  pageSize?: number;
};
