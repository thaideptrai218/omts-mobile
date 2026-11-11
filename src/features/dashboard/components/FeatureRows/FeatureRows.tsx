import type { FeatureKey } from "@/models/Navigation";

import { MenuRows } from "@/components/MenuRows/MenuRows";
import { FEATURE_HINTS, FEATURES } from "@/constants/features";
import { useOpenFeature } from "@/hooks/useOpenFeature";
import { FEATURE_AREA } from "@/utils/areas";

/** Danh sách chức năng dạng dòng lớn: tên, một dòng ngắn, bấm là mở. Câu giải thích đầy đủ nằm ở trang của chức năng. */
function FeatureRows({ actions }: { actions: FeatureKey[] }) {
  const openFeature = useOpenFeature();
  return (
    <MenuRows
      items={actions.map((key) => ({
        key,
        title: FEATURES[key].title,
        hint: FEATURE_HINTS[key],
        icon: FEATURES[key].icon,
        area: FEATURE_AREA[key],
        onClick: () => openFeature(key),
      }))}
    />
  );
}

export default FeatureRows;
