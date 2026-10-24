import { useNavigate } from "zmp-ui";

import type { FeatureKey } from "@/data/features";

/** Mở một chức năng: truy xuất là một tab riêng, các chức năng khác mở trang chi tiết. */
export function useOpenFeature() {
  const navigate = useNavigate();
  return (key: FeatureKey) => {
    if (key === "trace") {
      navigate("/trace");
      return;
    }
    navigate(`/feature/${key}`);
  };
}
