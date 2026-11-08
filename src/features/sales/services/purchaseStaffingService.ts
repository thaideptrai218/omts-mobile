import type { PurchaseRequest } from "@/features/sales/models/PurchaseRequest";
import type { MyPurchaseShift, PlanPurchaseStaffing, PurchaseShiftInvitation, PurchaseStaffing, RespondPurchaseShift, StaffingEmployeeOption } from "@/features/sales/models/PurchaseStaffing";
import { api } from "@/services/httpClient";

export const staffingEmployees = (day: string) =>
  api<StaffingEmployeeOption[]>(`/api/purchase-requests/staffing-employees?day=${day}`);
export const purchaseShiftInvitations = (id: string) =>
  api<PurchaseShiftInvitation[]>(`/api/purchase-requests/${id}/staffing`);
export const planPurchaseStaffing = (row: PurchaseRequest, body: PlanPurchaseStaffing) =>
  api<PurchaseStaffing>(`/api/purchase-requests/${row.id}/staffing`, { method: "POST", body: { ...body, rowVersion: row.rowVersion } });
export const myPurchaseShifts = (from: string, to: string) =>
  api<MyPurchaseShift[]>(`/api/me/purchase-shifts?from=${from}&to=${to}`);
export const respondPurchaseShift = (row: MyPurchaseShift, body: RespondPurchaseShift) =>
  api<MyPurchaseShift>(`/api/me/purchase-shifts/${row.id}/response`, { method: "POST", body: { ...body, rowVersion: row.rowVersion } });
