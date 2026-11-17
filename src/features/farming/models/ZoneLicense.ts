import type { ZoneRef } from "@/features/farming/models/Zone";

/**
 * Vùng nuôi, bè, giấy tờ pháp lý và chỉ số nước (OMTS.Api: `api/zones`, `api/rafts`, `api/zone-licenses`,
 * `api/water-thresholds`, `api/water-measurements`). Tên trường theo JSON server trả.
 */
export type LicenseState = "Valid" | "ExpiringSoon" | "Expired" | "NotYetEffective" | "Replaced";

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
  rowVersion: string | null;
};

export type SaveLicense = {
  documentType: string;
  documentNumber: string;
  effectiveDate: string | null;
  /** Bắt buộc, sau ngày hiệu lực (FARM-03). */
  expiryDate: string | null;
  issuingAuthority: string | null;
  holder: string | null;
  legalScope: string | null;
  /** Một giấy tờ thuộc đúng một vùng; khi sửa hoặc thay giấy tờ thì không đổi vùng. */
  zoneId: string;
  rowVersion?: string | null;
};

export type ZoneLicenses = {
  zoneId: string;
  asOf: string;
  licenses: ZoneLicenseRow[];
};
