import type { ZoneRef } from "@/features/farming/models/Zone";

// Bè
export type Lane = {
  id?: string;
  laneNumber: number;
  length: number | null;
  markerA: string | null;
  markerB: string | null;
};

export type RaftListItem = {
  id: string;
  zoneId: string;
  code: string | null;
  latitude: number | null;
  longitude: number | null;
  size: string | null;
  laneCount: number;
  statusId: number;
  status: string | null;
};

export type RaftView = {
  id: string;
  zone: ZoneRef;
  code: string | null;
  latitude: number | null;
  longitude: number | null;
  location: string | null;
  size: string | null;
  conditionNotes: string | null;
  photoUrl: string | null;
  statusId: number;
  status: string | null;
  layoutVersion: number;
  lanes: Lane[];
  layoutDrawing: unknown;
  layoutVersions: {
    versionNumber: number;
    laneCount: number;
    validFrom: string;
    validTo: string | null;
  }[];
  materialCost: number | null;
  rowVersion: string | null;
};

export type SaveRaft = {
  code: string;
  latitude: number | null;
  longitude: number | null;
  location: string | null;
  size: string | null;
  conditionNotes: string | null;
  lanes: Lane[];
  layoutDrawing?: unknown;
  rowVersion?: string | null;
};
