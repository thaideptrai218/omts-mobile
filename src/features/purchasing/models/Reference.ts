export type Ref = {
  id: string;
  code: string | null;
  name: string | null;
};

export type SupplierRef = {
  id: string;
  name: string | null;
  phoneNumber: string | null;
  code?: string | null;
};

/** Tài khoản người dùng được nhắc tới (người ghi, người trả). */
export type AccountRef = {
  id: string;
  name: string;
};

/** Tài khoản ngân hàng của sổ quỹ dùng khi chuyển khoản. */
export type CashAccountRef = {
  id: string;
  providerName: string;
  accountNumber: string;
};

export type RaftRef = {
  id: string;
  code: string | null;
};

/* Danh mục để chọn trong form phiếu nhập */
export type ZoneLookup = {
  id: string;
  code: string | null;
  name: string | null;
  statusId: number;
};

/** Bè chọn được cho dòng hàng của phiếu nhập: bè đang dùng trong các vùng của người dùng (Chủ HTX: mọi bè). */
export type RaftLookup = {
  id: string;
  code: string;
  zoneCode: string;
  zoneId: string;
};
