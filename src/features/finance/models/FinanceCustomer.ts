/**
 * Một dòng của `GET api/customers` dùng để chọn thương lái trước khi thu hoặc trả lại tiền. Chỉ khai báo các trường màn
 * chọn cần; `currentDebt` null khi người dùng không có quyền xem công nợ (BR-FARM-07), nhỏ hơn 0 là HTX nợ lại.
 */
export type FinanceCustomer = {
  id: string;
  code: string;
  name: string;
  phoneNumber: string | null;
  currentDebt: number | null;
  debtDays: number | null;
};

/** Chọn thương lái để thu tiền, hoặc để trả lại tiền (chỉ những người HTX đang nợ lại). */
export type CustomerPickerMode = "receive" | "payBack";

export type FinanceCustomerSearch = {
  search: string;
  mode: CustomerPickerMode;
  /** Có quyền xem công nợ: sắp theo công nợ và lọc được người HTX đang nợ lại. */
  seesDebt: boolean;
  page: number;
  pageSize: number;
};
