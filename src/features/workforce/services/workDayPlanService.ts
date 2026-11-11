import type { AssignWorkDayPlan, RespondWorkDayPlan, SaveWorkDayPlan, WorkDayPlan, WorkPlanResponsible } from "@/features/workforce/models/WorkDayPlan";
import type { StaffingEmployeeOption } from "@/features/sales/models/PurchaseStaffing";
import { api } from "@/services/httpClient";

export const workPlans = (from: string, to: string) => api<WorkDayPlan[]>(`/api/work-plans?from=${from}&to=${to}`);
export const getWorkPlan = (id: string) => api<WorkDayPlan>(`/api/work-plans/${id}`);
export const purchaseWorkPlan = (id: string) => api<WorkDayPlan | null>(`/api/work-plans/purchase/${id}`);
export const workPlanResponsibles = (raftId: string) => api<WorkPlanResponsible[]>(`/api/work-plans/responsibles?raftId=${raftId}`);
export const saveWorkPlan = (body: SaveWorkDayPlan, id?: string) => api<WorkDayPlan>(id ? `/api/work-plans/${id}` : "/api/work-plans", { method: id ? "PUT" : "POST", body });
export const respondWorkPlan = (id: string, body: RespondWorkDayPlan) => api<WorkDayPlan>(`/api/work-plans/${id}/response`, { method: "POST", body });
export const workPlanEmployees = (id: string) => api<StaffingEmployeeOption[]>(`/api/work-plans/${id}/employees`);
export const assignWorkPlan = (id: string, body: AssignWorkDayPlan) => api<WorkDayPlan>(`/api/work-plans/${id}/assignments`, { method: "POST", body });
