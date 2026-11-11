import type { FeatureKey } from "@/models/Navigation";
import { useNavigate } from "zmp-ui";

import { FEATURE_ROUTES, MOCK_FEATURES } from "@/constants/features";

/** Mở một chức năng: có màn thật thì mở màn đó; chưa có thì bản dev mở màn dữ liệu mẫu, bản production mở trang giải thích. */
export function useOpenFeature() {
  const navigate = useNavigate();
  return (key: FeatureKey) => navigate(FEATURE_ROUTES[key] ?? (import.meta.env.DEV && MOCK_FEATURES.includes(key) ? `/mock/${key}` : `/feature/${key}`));
}
