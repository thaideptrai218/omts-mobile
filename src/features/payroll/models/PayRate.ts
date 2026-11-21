/**
 * Yêu cầu của Bảng giá công (LABOR-11). Loại việc, giá và kết quả lưu (`JobType`, `PayRate`, `AddJobType`, `JobTypeSaved`)
 * dùng chung với `@/features/workforce/models/Job`.
 */

/** Tìm loại việc: theo tên, theo trạng thái (101 đang dùng, 102 ngừng dùng; null là cả hai). */
export type JobTypeListParams = {
  search: string;
  statusId: number | null;
  page: number;
  pageSize: number;
};

/** LABOR-11.0: giá mới từ một ngày; chọn đúng ngày của một giá đã có thì giá đó được thay (BR-LABOR-12). */
export type ChangeRateRequest = {
  hourlyRate: number;
  effectiveFrom: string;
  rowVersion: string;
};

/** LABOR-11.3: tên không trùng loại việc khác (không phân biệt chữ hoa, chữ thường). */
export type RenameJobTypeRequest = {
  name: string;
  rowVersion: string;
};

/** LABOR-11.2: ngừng dùng hoặc dùng lại. */
export type JobTypeStatusRequest = {
  rowVersion: string;
};
