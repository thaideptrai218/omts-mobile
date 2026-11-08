export type Ref = {
  id: string;
  code: string | null;
  name: string | null;
};

export type SupplierRef = {
  id: string;
  name: string | null;
  phoneNumber: string | null;
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

export type RaftLookup = {
  id: string;
  code: string | null;
  statusId: number;
};
