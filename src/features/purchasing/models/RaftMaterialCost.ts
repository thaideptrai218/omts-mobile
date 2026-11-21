import type { RaftRef, Ref } from "@/features/purchasing/models/Reference";

/** Một lần dùng vật tư trên bè, tính theo giá mua gần nhất của vật tư tới ngày đó; chưa từng mua thì 0 đ (`unpriced`). */
export type RaftUsageCostLine = {
  usageId: string;
  date: string;
  repairReason: string;
  itemId: string;
  itemCode: string;
  itemName: string;
  unit: string;
  quantity: number;
  unitPrice: number;
  amount: number;
  unpriced: boolean;
};

/** Chi phí vật tư của một bè trong kỳ: tổng các lần dùng vật tư (BR-FARM-05). */
export type RaftMaterialCostRow = {
  raft: RaftRef;
  zone: Ref;
  materialCost: number;
  unpricedCount: number;
  usages: RaftUsageCostLine[];
};

/** Chi phí vật tư theo bè (`api/purchase-receipts/raft-material-costs`), tính từ vật tư đã dùng, không từ phiếu nhập. */
export type RaftMaterialCostResult = {
  from: string;
  to: string;
  materialCost: number;
  rafts: RaftMaterialCostRow[];
  message: string | null;
  messageCode: string | null;
};
