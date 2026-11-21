/** Nhật ký nuôi của một chu kỳ (CYCLE-04), theo `CultivationLogDtos.cs` của backend. */

/** Ảnh của nhật ký, chỉ nhân viên xem (BR-FARM-09). `url` là link có hạn, đọc lại nhật ký để có link mới. */
export type CultivationLogPhoto = { key: string; sortOrder: number; url: string };

export type CultivationLogView = {
  id: string;
  cycleId: string;
  raftId: string;
  raftCode: string;
  visitDate: string;
  notes: string | null;
  photos: CultivationLogPhoto[];
  recordedByAccountId: string;
  recordedByName: string | null;
  recordedAt: string;
  /** Sửa hoặc xóa được: chu kỳ đang mở, người ghi hoặc Chủ HTX. */
  canCorrect: boolean;
  rowVersion: string;
};

export type CultivationLogSaved = { log: CultivationLogView; message: string; messageCode: string };

/** Phiếu nhật ký: ảnh cũ giữ lại theo `key`, ảnh mới chụp là Blob. */
export type CultivationLogDraft = {
  visitDate: string;
  notes: string;
  keepPhotos: CultivationLogPhoto[];
  newPhotos: Blob[];
};
