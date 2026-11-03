import type { PurchaseStaffing } from "@/features/sales/models/PurchaseStaffing";

export type PurchaseStatus = "AWAITING_RESPONSE" | "AWAITING_STAFF" | "ACCEPTED" | "DECLINED" | "CANCELLED";

export type PurchaseFilter = PurchaseStatus | "ALL";

export type PurchaseRequest = {
  id: string;
  code: string;
  productId: string;
  productName: string;
  quantityUnit: "Cage";
  requestedCages: number;
  requestedPickupDate: string;
  note: string | null;
  status: PurchaseStatus;
  acceptedCages: number | null;
  acceptedPickupDate: string | null;
  allowPayLater: boolean;
  responseNote: string | null;
  respondedAt: string | null;
  cancelledAt: string | null;
  cancellationReason: string | null;
  createdAt: string;
  customerName: string;
  rowVersion: string;
  staffing: PurchaseStaffing | null;
};

export type PurchaseDraft = {
  productId: string;
  cages: string;
  pickupDate: string;
  note: string;
  clientOperationId: string;
};

export type RespondPurchaseRequest = {
  accept: boolean;
  acceptedCages: number | null;
  pickupDate: string | null;
  allowPayLater: boolean;
  note: string;
};
