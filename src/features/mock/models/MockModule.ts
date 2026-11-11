import type { Tone } from "@/models/UI";

/** Vai trò được làm một thao tác mẫu. Chủ HTX làm được mọi việc của nội bộ, trừ việc riêng của thương lái. */
export type MockActor = "zoneManager" | "staff" | "accountant" | "trader";

export type MockField = {
  key: string;
  label: string;
  type: "text" | "textarea" | "number" | "date" | "select" | "photo";
  options?: string[];
  required?: boolean;
  /** Giá trị có sẵn khi mở form. */
  value?: string;
};

export type MockLink = {
  module: string;
  id: string;
};

export type MockRow = {
  title: string;
  meta?: string;
  value?: string;
  tone?: Tone;
  /** Mở bản ghi liên quan, ví dụ từ hóa đơn sang lô thu hoạch. */
  link?: MockLink;
};

export type MockSection = {
  title: string;
  rows: MockRow[];
};

export type MockHistory = {
  at: string;
  text: string;
};

export type MockRecord = {
  id: string;
  title: string;
  meta?: string;
  /** Số tiền, dùng để hiện ở cột phải và cộng ở ô tổng. */
  amount?: number;
  /** Số hiện ở cột phải khi không phải tiền, ví dụ "1.250 kg". */
  value?: string;
  status?: string;
  facts: [string, string][];
  sections?: MockSection[];
  photos?: string[];
  history?: MockHistory[];
};

export type MockAction = {
  label: string;
  /** Chỉ hiện khi bản ghi ở một trong các trạng thái này. Bỏ trống là mọi trạng thái. */
  from?: string[];
  /** Trạng thái sau khi làm. Bỏ trống là giữ nguyên. */
  to?: string;
  who?: MockActor[];
  danger?: boolean;
  /** Câu hỏi xác nhận khi không có form. */
  confirm?: string;
  fields?: MockField[];
  /** Ghi vào mục lịch sử của bản ghi. */
  done: string;
  /** Ghi giá trị form đè lên dòng thông tin cùng nhãn. */
  updatesFacts?: boolean;
};

export type MockCreate = {
  label: string;
  who?: MockActor[];
  fields: MockField[];
  /** Trường dùng làm tiêu đề dòng; các trường còn lại vào phần thông tin. */
  titleField: string;
  metaFields?: string[];
  amountField?: string;
  status?: string;
  idPrefix: string;
  done: string;
};

export type MockSummary = {
  label: string;
  kind: "count" | "sum";
  /** Chỉ tính các bản ghi ở những trạng thái này. Bỏ trống là tất cả. */
  statuses?: string[];
  tone?: Tone;
};

export type MockModule = {
  key: string;
  title: string;
  /** Mã use case trong SRS, để đối chiếu khi làm thật. */
  useCases: string;
  statuses?: Record<string, { label: string; tone: Tone }>;
  summary?: MockSummary[];
  create?: MockCreate;
  actions?: MockAction[];
  emptyText?: string;
  records: MockRecord[];
};
