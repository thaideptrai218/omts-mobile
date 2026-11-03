export type InputItemGroup = "Seed" | "RaftMaterial" | "Other";

/* Danh mục vật tư */
export type InputItem = {
  id: string;
  code: string | null;
  name: string | null;
  group: InputItemGroup;
  unit: string | null;
  description: string | null;
  isUsed: boolean;
  statusId: number;
  status: string | null;
  rowVersion: string | null;
};

export type SaveInputItem = {
  code: string;
  name: string;
  group: InputItemGroup;
  unit: string;
  description: string | null;
  rowVersion?: string | null;
};

export type InputItemSearchParams = {
  group?: InputItemGroup | null;
  statusId?: number | null;
};
