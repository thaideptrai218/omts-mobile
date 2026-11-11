import type { LaneState } from "@/features/farming/models/Harvest";

/** Thả giống của một chu kỳ (CYCLE-02), theo `SeedingDtos.cs` của backend. */

/** Lô giống của một phiên: lần theo phiếu nhập và nhà cung cấp (BR-FARM-03), không có giá. */
export type SeedLotRef = {
  id: string;
  code: string;
  receiptId: string;
  receiptCode: string;
  receivedDate: string;
  itemId: string | null;
  itemCode: string | null;
  itemName: string | null;
  unit: string;
  supplierId: string;
  supplierName: string;
};

/** Một lô giống chọn được (CYCLE-02.0 bước 3). `id` là dòng phiếu nhập, gửi làm `seedLotId`. */
export type SeedLotOption = SeedLotRef & {
  quantityReceived: number;
  /** Chỉ để xem: thả giống không so với lượng còn của lô. */
  quantitySeeded: number;
  /** Phiếu nhập ghi cho chính bè này. */
  boughtForThisRaft: boolean;
};

export type SeedLotList = { raftId: string; lots: SeedLotOption[]; message: string | null; messageCode: string | null };

export type SeedingRecordView = {
  id: string;
  cycleId: string;
  raftId: string;
  raftCode: string;
  seedingDate: string;
  seedLot: SeedLotRef;
  quantity: number;
  laneNumbers: number[];
  recordedByAccountId: string;
  recordedByName: string | null;
  recordedAt: string;
  /** Sửa hoặc xóa được: chu kỳ đang mở, chưa luống nào vào lô thu hoạch, người ghi hoặc Chủ HTX. */
  canCorrect: boolean;
  rowVersion: string;
};

export type SeedingRecordSaved = {
  record: SeedingRecordView;
  /** Không còn luống nào chưa thả và chưa đánh dấu thả xong: hỏi luôn có đánh dấu không. */
  offerMarkComplete: boolean;
  cycleRowVersion: string;
  message: string;
  messageCode: string;
};

export type SeedingLaneView = { id: string; laneNumber: number; statusId: number; status: string; state: LaneState; canSeed: boolean };

export type SeedLotTotal = { seedLotId: string; code: string; itemName: string | null; unit: string; quantity: number };

/** Màn Thả giống (SCR-CYCLE-02). */
export type SeedingList = {
  cycleId: string;
  raftId: string;
  raftCode: string;
  seedingCompletedOn: string | null;
  /** Số luống đang dùng. */
  laneCount: number;
  seededCount: number;
  notSeededLanes: number[];
  canRecord: boolean;
  canMarkComplete: boolean;
  lanes: SeedingLaneView[];
  /** Ngày mới nhất trước. */
  records: SeedingRecordView[];
  lots: SeedLotTotal[];
  cycleRowVersion: string;
};

export type SeedingCompletionPreview = {
  cycleId: string;
  raftCode: string;
  laneCount: number;
  seededCount: number;
  notSeededLanes: number[];
  message: string;
  messageCode: string;
  cycleRowVersion: string;
};

/** Phiếu một phiên thả giống: chữ người dùng gõ, đổi sang số khi gửi. */
export type SeedingDraft = {
  seedingDate: string;
  seedLotId: string;
  laneNumbers: number[];
  quantity: string;
};
