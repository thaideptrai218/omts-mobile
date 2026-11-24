import type { OriginState } from "@/models/OriginState";

/** Trạng thái trang truy xuất: có lô để hiện, hóa đơn chưa có lô nào công bố, hoặc hóa đơn đã hủy (chỉ còn thông tin HTX). */
export type ProvenanceStatus = "Ok" | "NoLots" | "Cancelled";

export type ProvenanceSeeding = {
  seedingDate: string;
  seedItemName: string;
};

/** Nguồn gốc của một lô đã công bố. Không có người mua, nhân viên, nhà cung cấp, giá hay khối lượng. */
export type ProvenanceOrigin = {
  harvestDate: string;
  raftCode: string;
  zoneName: string;
  /** Số ngày từ lần thả giống đầu tiên đến ngày thu hoạch; null khi không tìm được đợt thả giống. */
  daysOfFarming: number | null;
  seedings: ProvenanceSeeding[];
};

export type ProvenanceLot = {
  lotCode: string;
  /** Tên các sản phẩm bán từ lô trên hóa đơn này. */
  products: string[];
  originState: OriginState;
  /** Ngày thu hồi; null khi lô đang công bố. */
  withdrawalDate: string | null;
  /** Null khi lô đã bị thu hồi. */
  origin: ProvenanceOrigin | null;
};

export type ProvenanceCooperative = {
  fullName: string;
  shortName: string | null;
};

/** Trang truy xuất công khai mà mã QR mở ra (`GET api/public/provenance/{qrToken}`). */
export type ProvenancePage = {
  language: string;
  status: ProvenanceStatus;
  /** Thông báo của máy chủ khi không có lô để hiện; null khi có lô. */
  message: string | null;
  cooperative: ProvenanceCooperative;
  lots: ProvenanceLot[];
};
