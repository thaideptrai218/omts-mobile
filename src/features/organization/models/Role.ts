export type RolePermission = {
  functionCode: string | null;
  actions: string[];
};

/** Vai trò cố định (ZONE_MANAGER, ACCOUNTANT), chỉ xem; phạm vi quyền theo vùng được cấp, trừ chức năng toàn HTX. */
export type RoleView = {
  id: string;
  code: string;
  name: string | null;
  description: string | null;
  permissions: RolePermission[];
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
