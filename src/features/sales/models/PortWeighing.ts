import type { Paged } from "@/models/Pagination";

/** Các lồng của một lô trong lần cân, theo thứ tự cân. */
export type PortWeighingLot = {
  harvestLotId: string;
  lotCode: string;
  kg: number;
  cageKgs: number[];
};

/** Lần cân ở cảng: quản lý vùng ghi số cân từng lồng, thương lái chốt, hóa đơn lập từ lần cân đã chốt. */
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

export type MyPortWeighingList = {
  page: Paged<PortWeighing>;
  message: string | null;
  messageCode: string | null;
};

/** Một lô trên phiếu cân đang nhập: kg từng lồng gõ dạng chữ. */
export type WeighingLotDraft = {
  harvestLotId: string;
  lotCode: string;
  cageKgs: string[];
};

/** Một lô gửi lên server: kg từng lồng. */
export type PortWeighingLotEntry = {
  harvestLotId: string;
  cageKgs: number[];
};
