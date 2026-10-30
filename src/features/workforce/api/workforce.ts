import { api } from "@/shared/api/http";

export type EmployeeOption = { id: string; name: string; onLeave?: boolean };
export type JobOption = { id: string; name: string };
export type WorkRow = {
  id: string; employeeId: string; employeeName: string; zoneId: string; raftId: string | null;
  raftCode: string | null; jobTypeId: string | null; job: string; date: string;
  checkedInAt: string | null; checkedOutAt: string | null;
};
export type AttendanceDay = {
  date: string; checkedInAt: string | null; checkedOutAt: string | null; complete: boolean;
  jobs: { jobTypeId: string; job: string; hours: number }[];
  periods: { job: string; raft: string | null; startsAt: string; endsAt: string; minutes: number }[];
};
export type LeaveRow = { id: string; employeeName: string; from: string; to: string; reason: string; approved: boolean | null; response: string | null; rowVersion: string; cancelledAt?: string | null };
export type MyWork = { employeeId: string | null; name: string | null; assignments: WorkRow[]; attendance: AttendanceDay[]; requests: LeaveRow[] };
export type AttendanceSetting = { effectiveFrom: string; breakFrom: string | null; breakTo: string | null; roundingMinutes: number };
export const myWork = (from: string, to: string) => api<MyWork>(`/api/me/workforce?from=${from}&to=${to}`);
export const workLookups = (day?: string) => api<{ jobs: JobOption[]; employees: EmployeeOption[] }>("/api/workforce/lookups" + (day ? "?day=" + day : ""));
export const workList = (day: string) => api<WorkRow[]>(`/api/workforce/assignments?day=${day}`);
export const assignWork = (body: { date: string; raftId: string; jobTypeId: string; employeeIds: string[]; moveExisting: boolean }) => api<WorkRow[]>("/api/workforce/assignments", { method: "POST", body });
export const cancelWork = (id: string) => api<void>(`/api/workforce/assignments/${id}`, { method: "DELETE" });
export const markWork = (id: string, checkOut: boolean, qrCode?: string) => api<WorkRow>(`/api/workforce/assignments/${id}/${checkOut ? "check-out" : "check-in"}`, { method: "POST", body: { qrCode } });
export const changeCrew = (body: { raftId: string; jobTypeId: string; employeeIds: string[] }) => api<void>("/api/workforce/crew-job", { method: "POST", body });
export const attendanceQr = () => api<{ code: string; expiresAt: string }>("/api/me/attendance-qr", { method: "POST" });
export const requestLeave = (body: { from: string; to: string; reason: string; clientOperationId: string }) => api<LeaveRow>("/api/me/leave-requests", { method: "POST", body });
export const listLeave = () => api<LeaveRow[]>("/api/workforce/leave-requests");
export const cancelLeave = (id: string) => api<LeaveRow>(`/api/me/leave-requests/${id}`, { method: "DELETE" });
export const reviewLeave = (id: string, approved: boolean, response: string, rowVersion: string) => api<LeaveRow>(`/api/workforce/leave-requests/${id}/review`, { method: "POST", body: { approved, response, rowVersion } });
export const attendanceSettings = () => api<AttendanceSetting[]>("/api/workforce/attendance-settings");
export const saveAttendanceSettings = (body: AttendanceSetting) => api<AttendanceSetting>("/api/workforce/attendance-settings", { method: "POST", body });
export const createJob = (name: string) => api<JobOption>("/api/workforce/job-types", { method: "POST", body: { name } });
