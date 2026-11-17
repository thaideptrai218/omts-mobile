/** Cài đặt lô hàu của HTX (HARVEST-03, SCR-HARVEST-02), theo `HarvestLotDtos.cs` của backend. Chỉ Chủ HTX. */
export type HarvestSettingsView = {
  /** Số kg trung bình mỗi lồng: lô ghi sau lấy số này để ước tính, lô đã ghi giữ số của nó. */
  averageKgPerCage: number;
  /** Số ngày tự đóng lô: áp dụng cho mọi lô đang bán từ lần kiểm tra hằng ngày tiếp theo. */
  daysBeforeAutoClose: number;
  /** Phiên bản bản ghi HTX: lưu hồ sơ HTX cũng làm đổi phiên bản này. */
  rowVersion: string;
};

export type UpdateHarvestSettings = {
  averageKgPerCage: number | null;
  daysBeforeAutoClose: number | null;
  rowVersion: string;
};

export type HarvestSettingsSaved = { settings: HarvestSettingsView; message: string; messageCode: string };

/** HARVEST-03 bước 4: lần kiểm tra tiếp theo sẽ đóng bao nhiêu lô đang bán với số ngày mới. */
export type AutoClosePreview = {
  days: number;
  lotCount: number;
  /** Số ngày mới ít hơn số ngày đang dùng. */
  lowered: boolean;
  /** MSG-HARVEST-03 khi giảm số ngày, ngoài ra null. */
  message: string | null;
  messageCode: string | null;
};

/** Hai ô của form, là chữ người dùng gõ. */
export type HarvestSettingsDraft = { averageKgPerCage: string; daysBeforeAutoClose: string };
