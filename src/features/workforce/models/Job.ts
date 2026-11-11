export type JobOption = {
  id: string;
  name: string;
};

/** Tiền công mỗi giờ (VND, số nguyên) từ một ngày. */
export type PayRate = {
  hourlyRate: number;
  effectiveFrom: string;
};

/**
 * Loại việc kèm tiền công (`JobTypeView`, LABOR-11). `statusId` 101 đang dùng, 102 ngừng dùng. `currentRate` là giá áp dụng
 * hôm nay, null khi mọi giá đều từ ngày sau; `otherRates` là các giá của ngày khác, mới nhất trước.
 */
export type JobType = {
  id: string;
  name: string;
  statusId: number;
  status: string;
  currentRate: PayRate | null;
  otherRates: PayRate[];
  rowVersion: string;
};

/** LABOR-11.1: loại việc mới cùng giá đầu tiên. Tên không trùng (không phân biệt hoa thường), giá là số nguyên lớn hơn 0. */
export type AddJobType = {
  name: string;
  hourlyRate: number;
  effectiveFrom: string;
};

/** Trả lời khi lưu loại việc: bản ghi mới và MSG-GEN-05. */
export type JobTypeSaved = {
  jobType: JobType;
  message: string;
  messageCode: string;
};
