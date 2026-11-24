/** Các lồng của một lô trong lần cân, theo thứ tự cân. */
export type PortWeighingLot = {
  harvestLotId: string;
  lotCode: string;
  kg: number;
  cageKgs: number[];
};

/** Lần cân cũ ở cảng (backend đã gỡ, chốt 24/11/2026, OMTS-227): chỉ còn màn lập hóa đơn cũ đọc kiểu này. */
export type PortWeighing = {
  id: string;
  purchaseRequestId: string;
  purchaseRequestCode: string;
  /** Hồ sơ khách của đơn: hóa đơn lập từ lần cân ghi tên khách này. */
  customerId: string;
  customerName: string;
  productId: string;
  productName: string;
  acceptedCages: number;
  weighedAt: string;
  lots: PortWeighingLot[];
  cageCount: number;
  totalKg: number;
  /** Lúc thương lái chốt; null khi còn sửa được. */
  confirmedAt: string | null;
  invoiceId: string | null;
  invoiceCode: string | null;
  rowVersion: string;
};
