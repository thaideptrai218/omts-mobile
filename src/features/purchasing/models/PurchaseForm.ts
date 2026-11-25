import type { InputItem } from "@/features/purchasing/models/InputItem";
import type { ReceiptView } from "@/features/purchasing/models/PurchaseReceipt";
import type { SupplierListItem } from "@/features/purchasing/models/Supplier";

/**
 * Một dòng hàng trên form. Ô nhập là chuỗi; `discount`, `itemUnitId`, `supplierLotCode` giữ giá trị của dòng nháp
 * (có thể đặt trên web) để gửi lại, vì lưu phiếu nháp thay mọi dòng.
 */
export type PurchaseFormLine = {
  key: number;
  itemId: string;
  quantity: string;
  unitPrice: string;
  discount: number;
  itemUnitId: string | null;
  supplierLotCode: string | null;
};

export type PurchaseFormChoices = {
  suppliers: SupplierListItem[];
  items: InputItem[];
  receipt: ReceiptView | null;
};
