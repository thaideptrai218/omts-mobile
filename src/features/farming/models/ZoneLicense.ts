import type { ZoneRef } from "@/features/farming/models/Zone";

/**
 * Vùng nuôi, bè, giấy tờ pháp lý và chỉ số nước (OMTS.Api: `api/zones`, `api/rafts`, `api/zone-licenses`,
 * `api/water-thresholds`, `api/water-measurements`). Tên trường theo JSON server trả.
 */
export type LicenseState = "Valid" | "ExpiringSoon" | "Expired" | "NotYetEffective" | "Superseded" | "Missing";

// Giấy tờ pháp lý
export type ZoneLicenseRow = {
  documentType: string | null;
  documentTypeName: string | null;
  state: LicenseState;
  documentId: string | null;
  documentNumber: string | null;
  effectiveDate: string | null;
  expiryDate: string | null;
  isReplaced: boolean;
};

export type ZoneLicenseView = {
  id: string;
  documentType: string | null;
  documentTypeName: string | null;
  documentNumber: string | null;
  effectiveDate: string | null;
  expiryDate: string | null;
  issuingAuthority: string | null;
  holder: string | null;
  legalScope: string | null;
  asOf: string;
  state: LicenseState;
  zones: ZoneRef[];
  replacesDocumentId: string | null;
  replacedByDocumentId: string | null;
  fileUrl: string | null;
};

export type ZoneLicenses = {
  zoneId: string;
  asOf: string;
  licenses: ZoneLicenseRow[];
};
