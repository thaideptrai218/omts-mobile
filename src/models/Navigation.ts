import type { FEATURES } from "@/constants/features";
import type { IconName } from "@/models/UI";
import type { ReactElement } from "react";

/** Một chức năng có thể mở từ dashboard. Màn đã nối API khai báo đường dẫn trong `FEATURE_ROUTES`. */
export type Feature = {
  title: string;
  icon: IconName;
  description: string;
};

export type FeatureKey = keyof typeof FEATURES;

/** Khu vực chức năng, mỗi khu vực một màu và một hình: vùng nuôi, mua hàng, bán hàng, nhân công, tổ chức, sắp có. */
export type AreaKey = "farm" | "buy" | "sell" | "people" | "org" | "stone";

/**
 * Điều kiện để một chức năng xuất hiện trên dashboard, đối chiếu với `GET api/me/permissions`:
 * - `functions`: có quyền trên ít nhất một mã chức năng trong danh mục `PermissionFunctions` của backend;
 * - `owner`: chức năng riêng của Chủ HTX (không có trong danh mục vì Chủ HTX luôn có mọi quyền);
 * - `trader`: chức năng của thương lái;
 * - `everyone`: ai cũng thấy.
 * Đây chỉ là bộ lọc hiển thị; backend vẫn là nơi kiểm tra quyền cuối cùng (MSG02 khi bị từ chối).
 */
export type Access = {
  functions?: string[];
  owner?: boolean;
  trader?: boolean;
  employee?: boolean;
  everyone?: boolean;
};

export type ManageRoute = {
  path: string;
  element: ReactElement;
};
