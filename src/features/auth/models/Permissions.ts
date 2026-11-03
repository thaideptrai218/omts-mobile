import type { SubjectType } from "@/features/auth/models/Session";

/** Một chức năng người dùng được dùng, kèm phạm vi vùng và các thao tác (View, Create, Edit…). */
export type FunctionAccess = {
  function: string;
  name: string;
  allZones: boolean;
  zoneIds: string[];
  actions: string[];
};

export type GrantView = {
  zoneId: string | null;
  zoneCode: string | null;
  zoneName: string | null;
  allZones: boolean;
  role: string;
  permissions: unknown[];
};

/** `GET api/me/permissions`: nguồn duy nhất để dựng menu trên mobile. */
export type MyPermissions = {
  accountId: string;
  subjectType: SubjectType;
  isCooperativeOwner: boolean;
  functions: FunctionAccess[];
  grants: GrantView[];
};
