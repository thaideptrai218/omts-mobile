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
  rowVersion?: string;
};
