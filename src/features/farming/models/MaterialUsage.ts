import type { CycleListItem } from "@/features/farming/models/Cycle";

/**
 * Vật tư sử dụng của một bè (CYCLE-03, SCR-CYCLE-03), theo `MaterialUsageDtos.cs` của backend. Một lần sửa bè
 * (ngày và lý do) có nhiều dòng, mỗi vật tư một bản ghi. Bản ghi không có giá (BR-FARM-05).
 */
export type MaterialUsageView = {
  id: string;
  raftId: string;
  raftCode: string;
  /** Chu kỳ đang mở của bè vào ngày dùng, server tính khi đọc; null là ngày đó bè không có chu kỳ. */
  cycleId: string | null;
  usageDate: string;
  repairReason: string;
  itemId: string;
  itemCode: string;
  itemName: string;
  unit: string;
  quantity: number;
  recordedByAccountId: string;
  recordedByName: string | null;
  recordedAt: string;
  /** Sửa được lúc này: bè và vùng đang dùng, người xem có quyền sửa và chưa có chu kỳ đã đóng khóa bản ghi (CYCLE-03.1). */
  canEdit: boolean;
  rowVersion: string;
};

/** Một lần sửa bè trên màn: các bản ghi cùng ngày và cùng lý do. */
export type MaterialUsageRepair = {
  usageDate: string;
  repairReason: string;
  records: MaterialUsageView[];
};

/** Vật tư của một chu kỳ, hoặc của những ngày bè không có chu kỳ (`cycle` null). */
export type MaterialUsageGroup = {
  cycle: CycleListItem | null;
  /** Chu kỳ đã đóng nên các bản ghi không sửa được nữa (BR-CYCLE-04). */
  locked: boolean;
  /** Lần sửa gần nhất trước. */
  repairs: MaterialUsageRepair[];
};

export type MaterialUsageList = {
  raftId: string;
  raftCode: string;
  /** Hiện nút ghi: bè và vùng đang dùng, người xem được ghi (CYCLE-03.0 bước 2). */
  canRecord: boolean;
  /** Chu kỳ mới nhất trước, nhóm ngoài chu kỳ ở cuối. Chu kỳ không dùng vật tư thì không có nhóm. */
  groups: MaterialUsageGroup[];
};

export type MaterialUsageRecorded = { records: MaterialUsageView[]; message: string; messageCode: string };

export type MaterialUsageSaved = { record: MaterialUsageView; message: string; messageCode: string };

/** Một dòng của lần sửa bè gửi lên server. */
export type MaterialUsageLine = { itemId: string; quantity: number | null };

/** CYCLE-03.0: ghi một lần sửa bè. */
export type RecordMaterialUsage = { usageDate: string; repairReason: string; items: MaterialUsageLine[] };

/** CYCLE-03.1: bản ghi như mong muốn kèm lý do sửa. Bè khác đang dùng thì bản ghi chuyển sang bè đó (BR-CYCLE-03). */
export type EditMaterialUsage = {
  raftId: string;
  usageDate: string;
  itemId: string;
  quantity: number | null;
  repairReason: string;
  reason: string;
  rowVersion: string;
};

/** Vật tư chọn được (`GET api/farming-input-items?group=Material`), chỉ lấy các trường màn hình dùng. */
export type MaterialItem = {
  id: string;
  code: string;
  name: string;
  unit: string;
  statusId: number;
  status: string;
};

/** Một dòng của form ghi vật tư: số lượng là chữ người dùng gõ. */
export type MaterialUsageLineDraft = { key: number; itemId: string; quantity: string };

export type MaterialUsageDraft = { usageDate: string; repairReason: string; lines: MaterialUsageLineDraft[] };

export type MaterialUsageEditDraft = { raftId: string; usageDate: string; itemId: string; quantity: string; repairReason: string };

/** Bè chọn được khi sửa: bè đang dùng trong cùng vùng. */
export type MaterialUsageRaftChoice = { id: string; code: string };

/** Các lựa chọn của form sửa: vật tư (kèm vật tư hiện tại dù đã ngừng dùng) và bè. */
export type MaterialUsageEditChoices = { items: MaterialItem[]; rafts: MaterialUsageRaftChoice[] };
