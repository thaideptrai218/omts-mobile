import type { LicenseState } from "@/features/farming/models/ZoneLicense";

export type ZoneRef = {
  id: string;
  code: string | null;
  name: string | null;
};

export type ZoneListItem = {
  id: string;
  code: string | null;
  name: string | null;
  location: string | null;
  area: number | null;
  statusId: number;
  status: string | null;
  inUseRaftCount: number;
  licenseState: LicenseState;
};

export type ZoneView = ZoneListItem & {
  latitude: number | null;
  longitude: number | null;
  waterMeasurementPoint: string | null;
  rowVersion: string | null;
};

export type ZoneLookupItem = {
  id: string;
  code: string | null;
  name: string | null;
  statusId: number;
  status: string | null;
};

export type SaveZone = {
  code: string;
  name: string;
  location: string | null;
  latitude: number | null;
  longitude: number | null;
  area: number | null;
  waterMeasurementPoint: string | null;
  rowVersion?: string | null;
};

export type ZoneStatusFilter = "inUse" | "discontinued" | "all";

export type ZoneSearchParams = {
  search?: string;
  statusId?: number;
  page?: number;
  pageSize?: number;
};
