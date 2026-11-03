export type AttendanceDay = {
  date: string;
  checkedInAt: string | null;
  checkedOutAt: string | null;
  complete: boolean;
  jobs: {
    jobTypeId: string;
    job: string;
    hours: number;
  }[];
  periods: {
    job: string;
    raft: string | null;
    startsAt: string;
    endsAt: string;
    minutes: number;
  }[];
};

export type AttendanceSetting = {
  effectiveFrom: string;
  breakFrom: string | null;
  breakTo: string | null;
  roundingMinutes: number;
};

export type AttendanceQr = {
  code: string;
  expiresAt: string;
};
