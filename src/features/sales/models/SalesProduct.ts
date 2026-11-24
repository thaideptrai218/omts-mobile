export type SalesProduct = {
  id: string;
  code: string;
  name: string;
  description: string | null;
  inUse: boolean;
  availableForPurchase: boolean;
  rowVersion: string;
};

export type SaveSalesProduct = {
  code: string;
  name: string;
  description: string;
  inUse: boolean;
  /** Giá bán mỗi kg, số đồng lớn hơn 0. Bắt buộc khi tạo; khi sửa bỏ trống thì giữ giá hiện tại. */
  unitPrice?: number;
  rowVersion?: string;
};
