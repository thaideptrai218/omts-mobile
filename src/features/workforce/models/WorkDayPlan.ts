export type WorkDayPlanStatus = "PENDING_MANAGER" | "DECLINED" | "READY_TO_ASSIGN" | "AWAITING_STAFF" | "ASSIGNED" | "CLOSED";

export type WorkDayPlan = {
  id: string;
  workDate: string;
  raftId: string;
  raftCode: string;
  zoneId: string;
  zoneName: string;
  jobTypeId: string;
  jobName: string;
  responsibleAccountId: string;
  responsibleName: string;
  creatorName: string;
  status: WorkDayPlanStatus;
  responseReason: string | null;
  canRespond: boolean;
  canAssign: boolean;
  purchaseRequestId: string | null;
  requestCode: string | null;
  cages: number | null;
  requiredEmployees: number | null;
  invitedEmployees: number;
  approvedEmployees: number;
  assignedEmployees: number;
  note: string | null;
  rowVersion: string;
};

export type SaveWorkDayPlan = {
  raftId: string;
  jobTypeId: string;
  workDate: string;
  responsibleAccountId: string;
  clientOperationId: string;
  purchaseRequestId?: string;
  cages?: number;
  cagesPerEmployeePerDay?: number;
  pickupDate?: string;
  note: string;
  rowVersion?: string;
};

export type WorkPlanResponsible = { id: string; name: string; isSelf: boolean };
export type RespondWorkDayPlan = { approved: boolean; reason: string; rowVersion: string };
export type AssignWorkDayPlan = { employeeIds: string[]; rowVersion: string };
