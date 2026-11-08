import type { FeatureKey } from "@/models/Navigation";
import { useNavigate } from "zmp-ui";

import { FEATURE_ROUTES } from "@/constants/features";

/** Mở một chức năng: chức năng đã có màn thật mở màn đó, chức năng chưa có mở trang giải thích. */
export function useOpenFeature() {
  const navigate = useNavigate();
  return (key: FeatureKey) => navigate(FEATURE_ROUTES[key] ?? `/feature/${key}`);
}
