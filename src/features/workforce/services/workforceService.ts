import type {
  AttendanceQr, AttendanceSettingsOverview, AttendanceSettingsSaved, CrewStartRequest, RecordAttendanceRequest, SaveAttendanceSettings, StaffAttendance,
} from "@/features/workforce/models/Attendance";
import type { EmployeeRequest, ReviewEmployeeRequest, SubmitEmployeeRequest } from "@/features/workforce/models/EmployeeRequest";
import type { AddJobType, JobType, JobTypeSaved } from "@/features/workforce/models/Job";
import type { Paged } from "@/models/Pagination";
import type { AssignWorkRequest, ChangeCrewJobRequest, EditAssignmentRequest, WorkRow } from "@/features/workforce/models/WorkAssignment";
import type { MyWork, WorkforceLookups } from "@/features/workforce/models/Workforce";
import { api } from "@/services/httpClient";

// Công việc của chính nhân viên (LABOR-07, LABOR-08, LABOR-10): chỉ đọc và đổi bản ghi của người đang đăng nhập.
export const myWork = (from: string, to: string) => api<MyWork>(`/api/me/workforce?from=${from}&to=${to}`);
export const attendanceQr = () => api<AttendanceQr>("/api/me/attendance-qr");
export const submitRequest = (body: SubmitEmployeeRequest) => api<EmployeeRequest>("/api/me/leave-requests", { method: "POST", body });
export const cancelRequest = (id: string) => api<EmployeeRequest>(`/api/me/leave-requests/${id}`, { method: "DELETE" });

// Bảng phân công và chấm công trong ngày (LABOR-02, LABOR-04): Quản lý vùng trong vùng của bè, Chủ HTX mọi vùng.
export const workLookups = (day?: string) => api<WorkforceLookups>("/api/workforce/lookups" + (day ? "?day=" + day : ""));
export const workList = (day: string) => api<WorkRow[]>(`/api/workforce/assignments?day=${day}`);
export const assignWork = (body: AssignWorkRequest) => api<WorkRow[]>("/api/workforce/assignments", { method: "POST", body });
export const editWork = (id: string, body: EditAssignmentRequest) => api<WorkRow>(`/api/workforce/assignments/${id}`, { method: "PUT", body });
export const removeWork = (id: string) => api<void>(`/api/workforce/assignments/${id}`, { method: "DELETE" });
export const changeCrew = (body: ChangeCrewJobRequest) => api<void>("/api/workforce/crew-job", { method: "POST", body });
export const checkIn = (id: string, body: RecordAttendanceRequest) => api<WorkRow>(`/api/workforce/assignments/${id}/check-in`, { method: "POST", body });
export const checkOut = (id: string, body: RecordAttendanceRequest) => api<WorkRow>(`/api/workforce/assignments/${id}/check-out`, { method: "POST", body });
export const crewStart = (body: CrewStartRequest) => api<WorkRow[]>("/api/workforce/crew-start", { method: "POST", body });
export const staffList = (day: string) => api<StaffAttendance[]>(`/api/workforce/staff-attendance?day=${day}`);
export const staffCheckIn = (employeeId: string, body: RecordAttendanceRequest) => api<StaffAttendance>(`/api/workforce/staff/${employeeId}/check-in`, { method: "POST", body });
export const staffCheckOut = (employeeId: string, body: RecordAttendanceRequest) => api<StaffAttendance>(`/api/workforce/staff/${employeeId}/check-out`, { method: "POST", body });

// Yêu cầu của nhân viên (SCR-LABOR-03, LABOR-05): Quản lý vùng chỉ xem, Chủ HTX duyệt.
export const listRequests = (statusId?: number) => api<EmployeeRequest[]>("/api/workforce/leave-requests" + (statusId ? "?statusId=" + statusId : ""));
export const reviewRequest = (id: string, body: ReviewEmployeeRequest) => api<EmployeeRequest>(`/api/workforce/leave-requests/${id}/review`, { method: "POST", body });

// Cài đặt chấm công (LABOR-15): chỉ Chủ HTX. Loại việc và tiền công (LABOR-11): Kế toán và Chủ HTX (quyền PAY_RULES).
export const attendanceSettings = () => api<AttendanceSettingsOverview>("/api/attendance-settings");
export const saveAttendanceSettings = (body: SaveAttendanceSettings) => api<AttendanceSettingsSaved>("/api/attendance-settings", { method: "POST", body });
export const jobTypes = () => api<Paged<JobType>>("/api/job-types?pageSize=100");
export const addJobType = (body: AddJobType) => api<JobTypeSaved>("/api/job-types", { method: "POST", body });
