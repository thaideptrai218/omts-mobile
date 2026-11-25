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
