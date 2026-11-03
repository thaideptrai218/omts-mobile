import type { ZoneRef } from "@/features/organization/models/OrganizationZone";

export type LinkedAccount = {
  id: string;
  username: string | null;
  displayName: string | null;
  status: string | null;
};

export type EmployeeListItem = {
  id: string;
  fullName: string | null;
  phoneNumber: string | null;
  workingZones: ZoneRef[];
  account: LinkedAccount | null;
  status: string | null;
};

export type BankAccount = {
  bankName: string | null;
  accountNumber: string | null;
  accountHolderName: string | null;
};

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

export type EmployeeSaved = {
  employee: EmployeeView;
  message: string | null;
};

/** Việc nên làm tiếp sau khi cho nghỉ hoặc nhận lại: "review-lock" (xem có khóa tài khoản), "review-access". */
export type EmploymentChanged = {
  employee: EmployeeView;
  followUp: {
    action: string;
    accountId: string;
  } | null;
};

export type EmployeeForm = {
  fullName: string;
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
