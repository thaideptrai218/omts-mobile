export type LeaveRow = {
  id: string;
  employeeName: string;
  from: string;
  to: string;
  reason: string;
  approved: boolean | null;
  response: string | null;
  rowVersion: string;
  cancelledAt?: string | null;
};

export type RequestLeave = {
  from: string;
  to: string;
  reason: string;
  clientOperationId: string;
};
