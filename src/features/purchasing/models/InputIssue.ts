import type { InputItem, InputItemGroup } from "@/features/purchasing/models/InputItem";
import type { ZoneLookupItem } from "@/features/farming/models/Zone";
import type { Paged } from "@/models/Pagination";

/**
 * Phiếu xuất vật tư (`api/input-issues`): xuất dùng cho một bè (Use, mã XD…) hoặc xuất hủy (Disposal, mã XH…). Mobile chỉ
 * làm phiếu xuất dùng; xuất hủy, sửa phiếu và thẻ kho làm trên bản web.
 */
export type InputIssueKind = "Use" | "Disposal";

export type InputIssueStatusFilter = "All" | "Draft" | "Completed" | "Cancelled";

/** Một dòng hàng: `quantity` tính theo `unit` đã chọn, `baseQuantity` là số trừ khỏi kho theo đơn vị gốc. */
export type InputIssueLine = {
  id: string;
  lineNumber: number;
  itemId: string;
  itemCode: string;
  itemName: string;
  group: InputItemGroup;
  itemUnitId: string | null;
  unit: string;
  unitFactor: number;
  quantity: number;
  baseQuantity: number;
  baseUnit: string;
  seedLotLineId: string | null;
  seedLotCode: string | null;
  /** Giá vốn một đơn vị `unit`, chụp lúc hoàn thành phiếu. */
  unitCost: number;
  value: number;
  note: string | null;
};

/** Phần chung của phiếu trong danh sách và chi tiết. */
type InputIssueBase = {
  id: string;
  kind: InputIssueKind;
  code: string;
  statusId: number;
  status: string;
  issuedAt: string;
  zoneId: string | null;
  zoneCode: string | null;
  raftId: string | null;
  raftCode: string | null;
  issueTypeId: string | null;
  issueTypeName: string | null;
  receiverEmployeeId: string | null;
  receiverName: string | null;
  reason: string | null;
  notes: string | null;
  totalValue: number;
  createdAt: string;
  createdBy: string | null;
  rowVersion: string;
};

export type InputIssueListItem = InputIssueBase;

export type InputIssueView = InputIssueBase & {
  lines: InputIssueLine[];
  completedAt: string | null;
  cancelledAt: string | null;
  cancelReason: string | null;
};

/** `summary.totalValue`: tổng giá trị các phiếu Hoàn thành khớp bộ lọc, không chỉ trang này. */
export type InputIssuePage = Paged<InputIssueListItem> & {
  summary: { totalValue: number };
};

/** Lọc danh sách phiếu; kỳ tính theo ngày xuất (`issuedAt`). */
export type InputIssueSearchParams = {
  kind: InputIssueKind;
  search?: string | null;
  status?: InputIssueStatusFilter;
  from?: string | null;
  to?: string | null;
  page?: number;
  pageSize?: number;
};

/** Loại xuất ("Cấp giống", "Sửa bè"…); loại của hệ thống không sửa được. */
export type InputIssueType = {
  id: string;
  name: string;
  isSystem: boolean;
  rowVersion: string;
};

/** Nhân viên làm ở vùng, chọn làm người nhận vật tư. */
export type InputIssueReceiver = {
  id: string;
  fullName: string;
};

/** Một dòng gửi lên: đơn vị trống là đơn vị gốc; lô giống trống là lấy phần chưa gắn lô. */
export type InputIssueLineInput = {
  itemId: string;
  itemUnitId: string | null;
  quantity: number;
  seedLotLineId: string | null;
  note: string | null;
};

/**
 * Lập phiếu. Mã trống thì hệ thống tự cấp (XD…); thời gian trống là lúc lưu. Phiếu xuất dùng cần vùng và bè; hoàn thành
 * cần loại xuất. Mobile luôn gửi `complete` để phiếu thiếu hàng không để lại phiếu tạm (MSG-INPUT-01).
 */
export type SaveInputIssue = {
  kind: InputIssueKind;
  code: string | null;
  issuedAt: string | null;
  zoneId: string | null;
  raftId: string | null;
  issueTypeId: string | null;
  receiverEmployeeId: string | null;
  reason: string | null;
  notes: string | null;
  lines: InputIssueLineInput[];
  complete: boolean;
};

export type CompleteInputIssue = {
  rowVersion: string;
};

export type CancelInputIssue = {
  reason: string;
  rowVersion: string;
};

/** Một lô giống của vật tư giống, `onHand` theo đơn vị gốc. */
export type InputSeedLot = {
  seedLotLineId: string;
  code: string;
  receiptId: string;
  receiptCode: string;
  receivedAt: string;
  supplierName: string;
  supplierLotCode: string | null;
  receivedQuantity: number;
  onHand: number;
};

/** `suggestedLotId`: lô cũ nhất còn hàng, dòng xuất mặc định lấy lô này; null khi không lô nào còn. */
export type InputSeedLots = {
  lots: InputSeedLot[];
  unlottedQuantity: number;
  suggestedLotId: string | null;
  unit: string;
};

/* Form lập phiếu xuất dùng trên mobile */
export type InputUseFormLine = {
  key: number;
  itemId: string;
  itemUnitId: string | null;
  quantity: string;
  /** Rỗng là lấy phần chưa gắn lô; null khi chưa tải xong lô giống để chọn lô mặc định. */
  seedLotLineId: string | null;
};

export type InputUseFormChoices = {
  zones: ZoneLookupItem[];
  items: InputItem[];
  types: InputIssueType[];
};
