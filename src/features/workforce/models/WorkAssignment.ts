export type EmployeeOption = {
  id: string;
  name: string;
  onLeave?: boolean;
};

export type WorkRow = {
  workDayPlanId?: string | null;
  responsibleAccountId?: string | null;
  id: string;
  employeeId: string;
  employeeName: string;
  zoneId: string;
  raftId: string | null;
  raftCode: string | null;
  jobTypeId: string | null;
  job: string;
  date: string;
  checkedInAt: string | null;
  checkedOutAt: string | null;
};

export type AssignWorkRequest = {
  workDayPlanId?: string;
  date: string;
  raftId: string;
  jobTypeId: string;
  employeeIds: string[];
  moveExisting: boolean;
};

export type ChangeCrewJobRequest = {
  raftId: string;
  jobTypeId: string;
  employeeIds: string[];
};
