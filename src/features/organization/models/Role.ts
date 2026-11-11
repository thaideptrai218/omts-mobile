export type RolePermission = {
  functionCode: string | null;
  actions: string[];
  dataScope: string;
};

export type RoleView = {
  id: string;
  name: string | null;
  description: string | null;
  status: string | null;
  permissions: RolePermission[];
  rowVersion: string | null;
};

export type FunctionCatalogItem = {
  code: string | null;
  name: string | null;
  cooperativeWide: boolean;
  supportedActions: string[];
};

export type RoleStatusLabel = {
  text: string;
  tone: "success" | "warning" | "neutral" | "danger";
};
