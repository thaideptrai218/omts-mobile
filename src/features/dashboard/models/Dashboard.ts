import type { FeatureKey } from "@/models/Navigation";
import type { Tone } from "@/models/UI";

/** Các vai trò theo SRS hiện tại của OTMS. */
export type RoleKey = "owner" | "zoneManager" | "staff" | "accountant" | "trader" | "admin" | "viewer";

export type Stat = {
  label: string;
  value: string;
  unit?: string;
  note?: string;
  tone?: Tone;
};

export type Task = {
  id: string;
  title: string;
  detail: string;
  tone: Tone;
  feature: FeatureKey;
};

export type Role = {
  key: RoleKey;
  label: string;
  person: string;
  /** Phạm vi dữ liệu người này được xem, ví dụ một vùng nuôi hay toàn HTX. */
  scope: string;
  stats: Stat[];
  actions: FeatureKey[];
  /** Chia chức năng thành nhóm có tiêu đề khi vai trò có nhiều chức năng (Chủ HTX). Không có thì dùng `actions`. */
  actionGroups?: {
    title: string;
    actions: FeatureKey[];
  }[];
  tasksTitle: string;
  tasks: Task[];
  note?: string;
};
