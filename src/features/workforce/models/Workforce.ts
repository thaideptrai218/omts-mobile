import type { AttendanceDay } from "@/features/workforce/models/Attendance";
import type { EmployeeRequest } from "@/features/workforce/models/EmployeeRequest";
import type { JobOption } from "@/features/workforce/models/Job";
import type { EmployeeOption, WorkRow } from "@/features/workforce/models/WorkAssignment";

/** LABOR-08 (`GET api/me/workforce`): mọi trường rỗng khi tài khoản chưa gắn với hồ sơ nhân viên. */
export type MyWork = {
  employeeId: string | null;
  name: string | null;
  assignments: WorkRow[];
  attendance: AttendanceDay[];
  requests: EmployeeRequest[];
};

/** SCR-LABOR-02: loại việc đang dùng và nhân viên đang làm việc trong vùng của người dùng, theo ngày đã chọn. */
export type WorkforceLookups = {
  jobs: JobOption[];
  employees: EmployeeOption[];
};
