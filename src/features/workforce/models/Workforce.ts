import type { AttendanceDay } from "@/features/workforce/models/Attendance";
import type { JobOption } from "@/features/workforce/models/Job";
import type { LeaveRow } from "@/features/workforce/models/LeaveRequest";
import type { EmployeeOption, WorkRow } from "@/features/workforce/models/WorkAssignment";

export type MyWork = {
  employeeId: string | null;
  name: string | null;
  assignments: WorkRow[];
  attendance: AttendanceDay[];
  requests: LeaveRow[];
};

export type WorkforceLookups = {
  jobs: JobOption[];
  employees: EmployeeOption[];
};
