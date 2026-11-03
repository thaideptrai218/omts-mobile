import type { SubjectType } from "@/features/auth/models/Session";

export type ProfileGrantView = {
  role: string;
  zoneId: string | null;
  zoneName: string | null;
  allZones: boolean;
};

export type ProfileView = {
  accountId: string;
  username: string;
  displayName: string;
  subjectType: SubjectType;
  email: string | null;
  emailVerified: boolean;
  phoneNumber: string | null;
  phoneVerified: boolean;
  grants: ProfileGrantView[];
  rowVersion: string;
};

export type ProfileSaved = {
  profile: ProfileView;
  message: string;
};
