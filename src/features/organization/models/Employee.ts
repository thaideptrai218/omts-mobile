import type { ZoneRef } from "@/features/organization/models/OrganizationZone";

/** Loại nhân viên (BR-LABOR-01): lao động thời vụ hoặc nhân viên. */
export type EmployeeType = "SeasonalWorker" | "Staff";

export type JobTypeRef = {
  id: string;
  name: string;
  status: string;
};

export type EmployeeTypePeriod = {
  type: EmployeeType;
  effectiveFrom: string;
};

/** Tài khoản nhân viên gắn với hồ sơ; chỉ Chủ HTX đọc được. */
export type LinkedAccount = {
  id: string;
  username: string;
  displayName: string;
  status: string;
};

export type EmployeeListItem = {
  id: string;
  code: string | null;
  fullName: string;
  phoneNumber: string | null;
  employeeType: EmployeeType | null;
  jobTypes: JobTypeRef[];
  workingZones: ZoneRef[];
  account: LinkedAccount | null;
  status: string;
};

export type BankAccount = {
  bankName: string | null;
  accountNumber: string | null;
  accountHolderName: string | null;
};

/** Hồ sơ nhân viên. Các trường cá nhân (ngày sinh, địa chỉ, ngân hàng…) chỉ có khi `canMaintain`. */
export type EmployeeView = {
  id: string;
  code: string | null;
  fullName: string;
  phoneNumber: string | null;
  employeeType: EmployeeType | null;
  typeHistory: EmployeeTypePeriod[];
  jobTypes: JobTypeRef[];
  workingZones: ZoneRef[];
  status: string;
  /** Ngày làm việc cuối cùng; từ ngày hôm sau nhân viên là Đã nghỉ. */
  lastWorkingDay: string | null;
  canMaintain: boolean;
  hasStaffAccount: boolean;
  birthday: string | null;
  startDate: string | null;
  address: string | null;
  area: string | null;
  ward: string | null;
  otherInformation: string | null;
  notes: string | null;
  bankAccount: BankAccount | null;
  account: LinkedAccount | null;
  rowVersion: string;
};

/**
 * Thêm hoặc sửa nhân viên. Thêm thì bắt buộc loại nhân viên và ít nhất một vùng. Sửa thì `jobTypeIds` thay cả danh sách
 * loại việc, nên phải gửi lại loại việc đang có. `ownerApproved` là câu trả lời của Quản lý vùng cho MSG-LABOR-01 khi thêm.
 */
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
  employeeType: EmployeeType | null;
  jobTypeIds: string[];
  ownerApproved: boolean;
  rowVersion: string | null;
};

export type EmployeeSaved = {
  employee: EmployeeView;
  message: string | null;
};

export type EmploymentChanged = {
  employee: EmployeeView;
};

export type EmployeeForm = {
  fullName: string;
  employeeType: EmployeeType | null;
  phoneNumber: string;
  birthday: string | null;
  address: string;
  area: string;
  ward: string;
  otherInformation: string;
  notes: string;
  workingZoneIds: string[];
  bankName: string;
  accountNumber: string;
  accountHolderName: string;
};

export type EmployeeStatusFilter = "working" | "left" | "all";

export type EmployeeSearchParams = {
  search?: string;
  statusId?: number | null;
  page: number;
  pageSize?: number;
};
