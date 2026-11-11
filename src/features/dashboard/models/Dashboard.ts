import type { AreaKey, FeatureKey } from "@/models/Navigation";
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
  actions: FeatureKey[];
  /** Chia chức năng thành nhóm có tiêu đề khi vai trò có nhiều chức năng (Chủ HTX). Không có thì dùng `actions`. */
  actionGroups?: {
    title: string;
    /** Một dòng ngắn trên thẻ khu vực. */
    hint?: string;
    /** Không ghi thì lấy khu vực của chức năng đầu tiên. */
    area?: AreaKey;
    actions: FeatureKey[];
  }[];
  note?: string;
};
