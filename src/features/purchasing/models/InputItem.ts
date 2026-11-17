/** Loại vật tư của backend (`InputItemGroup`): con giống, vật tư, khác. Loại cố định khi vật tư đã được dùng. */
export type InputItemGroup = "Seed" | "Material" | "Other";

/** Một đơn vị của vật tư: `factor` là số đơn vị gốc trong đơn vị này; đơn vị gốc có `factor` 1. */
export type InputItemUnit = {
  id: string;
  unitId: string;
  name: string;
  factor: number;
  code: string;
  isBase: boolean;
  isUsed: boolean;
};

/* Danh mục vật tư (`api/farming-input-items`) */
export type InputItem = {
  id: string;
  code: string;
  name: string;
  group: InputItemGroup;
  itemGroupId: string | null;
  itemGroupName: string | null;
  /** Tên đơn vị gốc. */
  unit: string;
  units: InputItemUnit[];
  description: string | null;
  notes: string | null;
  photoUrl: string | null;
  minQuantity: number | null;
  maxQuantity: number | null;
  costPrice: number | null;
  lastPurchasePrice: number | null;
  /** Tồn kho theo đơn vị gốc. */
  onHand: number;
  stockValue: number;
  isUsed: boolean;
  statusId: number;
  status: string;
  createdAt: string;
  createdBy: string | null;
  rowVersion: string;
};

/**
 * Lưu vật tư. Backend thay mọi trường: trường không gửi bị xóa, trừ `code` (rỗng thì giữ mã cũ hoặc tự đặt mã mới) và
 * danh sách đơn vị. Vì vậy khi sửa, các trường mobile không có ô nhập (nhóm, ghi chú, định mức, giá vốn) phải gửi lại giá trị cũ.
 */
export type SaveInputItem = {
  code: string | null;
  name: string;
  group: InputItemGroup;
  unit: string;
  description: string | null;
  notes: string | null;
  itemGroupId: string | null;
  minQuantity: number | null;
  maxQuantity: number | null;
  costPrice: number | null;
  rowVersion?: string | null;
};

export type InputItemSearchParams = {
  group?: InputItemGroup | null;
  statusId?: number | null;
};
