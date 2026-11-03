import type { RaftRef, Ref } from "@/features/purchasing/models/Reference";

export type RaftMaterialCost = {
  raft: RaftRef;
  zone: Ref;
  materialCost: number;
  receipts: {
    receiptId: string;
    code: string | null;
    receiptDate: string;
    materialCost: number;
  }[];
};
