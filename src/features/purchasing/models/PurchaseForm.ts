import type { InputItem } from "@/features/purchasing/models/InputItem";
import type { ReceiptView } from "@/features/purchasing/models/PurchaseReceipt";
import type { ZoneLookup } from "@/features/purchasing/models/Reference";
import type { SupplierListItem } from "@/features/purchasing/models/Supplier";

export type PurchaseFormLine = {
  key: number;
  itemId: string;
  quantity: string;
  unitPrice: string;
};

export type PurchaseFormChoices = {
  suppliers: SupplierListItem[];
  zones: ZoneLookup[];
  items: InputItem[];
  receipt: ReceiptView | null;
};
