import type { InputItemGroup } from "@/features/purchasing/models/InputItem";
import type { AccountRef, Ref, SupplierRef } from "@/features/purchasing/models/Reference";
import type { PaymentMethod } from "@/features/purchasing/models/SupplierPayment";
import type { Paged } from "@/models/Pagination";

/*
 * Phiếu nhập (PURCHASE-01 đến PURCHASE-06) theo `api/purchase-receipts` của backend (SRS 27/10). Một lần trả tiền không còn
 * gắn với phiếu: sổ công nợ tính tiền trả vào các phiếu, `paid` là phần đã tính vào phiếu này. Còn phải trả của phiếu hoàn tất
 * là `payable − returned − paid` (xem `receiptRemaining`).
 */

/** Một dòng danh sách phiếu nhập. `zone` có thể trống (vùng không bắt buộc). */
export type ReceiptRow = {
  id: string;
  code: string;
  receiptDate: string;
  supplier: SupplierRef;
  statusId: number;
  status: string;
  total: number;
  linesTotal: number;
  supplierCode: string;
  recordedByName: string;
  itemCount: number;
  returned: number;
  discount: number;
  payable: number;
  paid: number;
  zone: Ref | null;
  notes: string | null;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string | null;
  receivedAt: string;
  receivedByName: string | null;
  returnCodes: string[];
};

/** Tổng của các phiếu hoàn tất khớp bộ lọc, các lần trả hàng trong kỳ và số còn lại. */
export type ReceiptTotals = {
  count: number;
  completedCount: number;
  receiptsTotal: number;
  returnsTotal: number;
  netTotal: number;
};

export type ReceiptSearch = {
  page: Paged<ReceiptRow>;
  totals: ReceiptTotals;
  from: string;
  to: string;
  message: string | null;
  messageCode: string | null;
};

/** Bè của một dòng hàng, kèm vùng. */
export type LineRaftRef = {
  id: string;
  code: string;
  zoneId: string;
  zoneCode: string;
};

/**
 * Một dòng hàng. Số lượng, đơn giá, giảm giá tính theo đơn vị của dòng (`unit`); `baseQuantity`, `seeded`, `returnedQuantity`,
 * `returnable` tính theo đơn vị gốc (`baseUnit`), `unitFactor` là số đơn vị gốc trong một đơn vị của dòng.
 */
export type ReceiptLine = {
  id: string;
  lineNumber: number;
  itemId: string | null;
  itemCode: string | null;
  itemName: string | null;
  group: InputItemGroup | null;
  unit: string;
  quantity: number | null;
  unitPrice: number | null;
  lineAmount: number | null;
  supplierLotCode: string | null;
  raft: LineRaftRef | null;
  seedLotCode: string | null;
  seeded: number;
  returnedQuantity: number;
  returnable: number;
  discount: number;
  /** Giá một đơn vị đã trả sau mọi giảm giá: giá mặc định khi trả hàng. */
  netUnitPrice: number | null;
  itemUnitId: string | null;
  unitFactor: number;
  baseQuantity: number | null;
  baseUnit: string | null;
};

export type ReceiptReturn = {
  id: string;
  code: string;
  returnDate: string;
  reason: string;
  returnValue: number;
  statusId: number;
  status: string;
  cancelledAt: string | null;
  cancelReason: string | null;
  recordedBy: AccountRef;
  rowVersion: string;
  discount: number;
  netValue: number;
  returnedAt: string;
};

export type ReceiptView = {
  id: string;
  code: string;
  supplier: SupplierRef;
  receiptDate: string;
  total: number;
  returned: number;
  notes: string | null;
  statusId: number;
  status: string;
  recordedBy: AccountRef;
  completedAt: string | null;
  cancelledAt: string | null;
  cancelReason: string | null;
  lines: ReceiptLine[];
  returns: ReceiptReturn[];
  rowVersion: string;
  discount: number;
  payable: number;
  paid: number;
  zone: Ref | null;
  receivedAt: string;
  receivedBy: AccountRef | null;
};

/** Một lần trả tiền được sổ công nợ tính vào phiếu này; `applied` là phần rơi vào phiếu (`GET {id}/payments`). */
export type ReceiptPayment = {
  id: string;
  code: string;
  paymentDate: string;
  recordedBy: AccountRef;
  method: PaymentMethod;
  statusId: number;
  status: string;
  applied: number;
};

/**
 * Dòng hàng khi lưu. Lưu phiếu nháp thay mọi dòng, nên khi sửa phải gửi lại giảm giá và đơn vị của từng dòng (có thể đã đặt
 * trên web). `supplierLotCode` chỉ có nghĩa với dòng giống.
 */
export type SaveReceiptLine = {
  itemId: string | null;
  quantity: number | null;
  unitPrice: number | null;
  supplierLotCode?: string | null;
  discount?: number | null;
  itemUnitId?: string | null;
  lineId?: string | null;
};

/** Lập hoặc sửa phiếu. `complete` true thì kiểm tra đủ và hoàn tất luôn; `discount` là giảm giá cả phiếu (đồng). */
export type SaveReceipt = {
  supplierId: string | null;
  receiptDate: string | null;
  notes: string | null;
  lines: SaveReceiptLine[];
  complete: boolean;
  rowVersion?: string | null;
  discount: number;
};

export type PurchaseReceiptStatusFilter = "all" | "draft" | "completed" | "cancelled";

export type PurchaseReceiptSearchParams = {
  statusId?: number | null;
  supplierId?: string | null;
  page?: number;
  pageSize?: number;
};

/** Hủy phiếu cần lý do; các lần trả tiền không bị hủy theo phiếu. */
export type CancelReceiptRequest = {
  reason: string;
  rowVersion: string | null;
};

/** Lý do không hủy được (MSG-PURCHASE-09): lô giống đã thả (`Seeded`) hoặc phiếu đã có trả hàng (`Returned`). */
export type CancelBlock = {
  kind: string;
  code: string;
  message: string;
  messageCode: string;
};

/** Công nợ trước và sau khi hủy; `warning` là MSG-PURCHASE-07 khi hủy xong HTX thành trả trước. */
export type CancelPreview = {
  canCancel: boolean;
  blocked: CancelBlock | null;
  debtBefore: number;
  debtAfter: number;
  advanceAfter: number;
  warning: string | null;
  warningCode: string | null;
};

/** Một dòng trả hàng: số lượng theo đơn vị của dòng phiếu; không gửi `unitPrice` thì lấy giá đã trả (`netUnitPrice`). */
export type ReturnLineInput = {
  receiptLineId: string;
  quantity: number;
  unitPrice?: number | null;
};

/**
 * Trả hàng nhà cung cấp từ một phiếu (PURCHASE-02, `POST api/purchase-returns`), ghi ngay (`complete`). `ownerApproved` là câu trả
 * lời của Quản lý vùng cho câu hỏi MSG-PURCHASE-02 (Chủ HTX đã đồng ý chưa); Chủ HTX không cần. Bỏ trống `returnedAt` là bây giờ.
 */
export type SavePurchaseReturn = {
  receiptId: string;
  complete: true;
  reason: string;
  lines: ReturnLineInput[];
  ownerApproved: boolean;
  returnedAt: string | null;
};

/** Phiếu trả hàng vừa lưu; chỉ phần màn hình cần. */
export type PurchaseReturnSaved = {
  id: string;
  code: string;
};
