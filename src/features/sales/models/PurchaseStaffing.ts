import type { PurchaseStatus } from "@/features/sales/models/PurchaseRequest";

export type PurchaseStaffing = {
  cages: number;
  workDate: string;
  pickupDate: string;
  cagesPerEmployeePerDay: number;
  requiredEmployees: number;
  invitedEmployees: number;
  approvedEmployees: number;
  declinedEmployees: number;
  pendingEmployees: number;
  hasEnoughStaff: boolean;
  note: string | null;
};

export type PlanPurchaseStaffing = {
  cages: number;
  workDate: string;
  pickupDate: string;
  cagesPerEmployeePerDay: number;
  employeeIds: string[];
  note: string;
};

export type StaffingEmployeeOption = {
  id: string;
  name: string;
  available: boolean;
  unavailableReason: string | null;
};

export type PurchaseShiftInvitation = {
  id: string;
  employeeId: string;
  employeeName: string;
  approved: boolean | null;
  reason: string | null;
  respondedAt: string | null;
};

export type MyPurchaseShift = {
  id: string;
  purchaseRequestId: string;
  requestCode: string;
  productName: string;
  cages: number;
  workDate: string;
  pickupDate: string;
  requiredEmployees: number;
  approvedEmployees: number;
  approved: boolean | null;
  reason: string | null;
  note: string | null;
  requestStatus: PurchaseStatus;
  canRespond: boolean;
  rowVersion: string;
};

export type RespondPurchaseShift = {
  approved: boolean;
  reason: string;
};
