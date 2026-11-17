import type { Stat, Task } from "@/features/dashboard/models/Dashboard";

/**
 * Số liệu và việc cần làm trên Tổng quan của Chủ HTX, gom từ các API đã có (vùng nuôi, tổng quan nước, phiếu nhập,
 * công nợ nhà cung cấp, yêu cầu thương lái). Phần nào lỗi thì bỏ qua phần đó, không làm hỏng cả trang.
 * Sản lượng, doanh thu, công nợ thương lái chưa có API nên chưa hiện (docs/owner-features.md).
 */
export type OwnerSummary = {
  stats: Stat[];
  tasks: Task[];
};

export type ReceiptSearch = {
  page: {
    total: number;
  };
};
