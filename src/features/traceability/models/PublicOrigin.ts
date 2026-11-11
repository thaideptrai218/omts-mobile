import type { OriginState } from "@/models/OriginState";

export type PublicOriginSeedLot = {
  itemName: string | null;
  supplierLotCode: string | null;
  supplierName: string;
  receivedOn: string;
};

export type PublicOriginWater = {
  measurementCount: number;
  averageSalinity: number | null;
  averageTemperature: number | null;
  averagePh: number | null;
};

/** Nguồn gốc của một lô đã công bố, từ con giống đến lúc bán. Không có người mua, nhân viên hay giá. */
export type PublicOriginDetail = {
  productNames: string[];
  zoneName: string;
  raftCode: string;
  cycleStartDate: string;
  seedLots: PublicOriginSeedLot[];
  firstSeedingDate: string | null;
  lastSeedingDate: string | null;
  laneCount: number;
  cultivationLogCount: number;
  water: PublicOriginWater;
  harvestDate: string;
  harvestedCages: number;
  harvestedKg: number;
  soldOn: string;
  soldKg: number;
  weighedCages: number;
};

export type PublicOriginLot = {
  lotCode: string;
  originState: OriginState;
  withdrawnAt: string | null;
  /** Null khi lô đã bị thu hồi. */
  detail: PublicOriginDetail | null;
};

/** Trang truy xuất công khai mà mã QR mở ra. */
export type PublicOrigin = {
  cooperativeName: string;
  lots: PublicOriginLot[];
};
