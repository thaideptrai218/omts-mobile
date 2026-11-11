import type { MyPermissions } from "@/features/auth/models/Permissions";
import type { Role } from "@/features/dashboard/models/Dashboard";
import type { FeatureKey } from "@/models/Navigation";
import { useNavigate } from "zmp-ui";

import { AreaCard } from "@/components/AreaCard/AreaCard";
import { Empty } from "@/components/Empty/Empty";
import { Section } from "@/components/Section/Section";
import FeatureRows from "@/features/dashboard/components/FeatureRows/FeatureRows";
import { allVisibleFeatures, MAX_DIRECT_FEATURES, visibleGroups } from "@/features/dashboard/utils/roleMenu";
import { FEATURE_AREA } from "@/utils/areas";

/**
 * Danh sách trên trang chủ: nhiều chức năng thì hiện các thẻ khu vực, bấm vào mở; ít chức năng thì liệt kê thẳng.
 * `exclude` là chức năng đã có thẻ lớn phía trên, không lặp lại trong danh sách.
 */
function HomeMenu({ role, permissions, exclude }: { role: Role; permissions: MyPermissions; exclude?: FeatureKey }) {
  const navigate = useNavigate();
  const features = allVisibleFeatures(permissions, role);
  const listed = features.filter((key) => key !== exclude);
  const groups = visibleGroups(permissions, role);

  if (features.length === 0) {
    return <Empty icon="zi-lock" title="Chưa có chức năng nào" text="Tài khoản của bạn chưa được cấp quyền. Liên hệ Chủ HTX để được phân công." />;
  }
  if (listed.length === 0) return null;

  return (
    <Section title="Chức năng">
      {groups.length > 0 && features.length > MAX_DIRECT_FEATURES ? (
        <div className="area-cards">
          {groups.map((group) => (
            <AreaCard
              key={group.index}
              area={group.area ?? FEATURE_AREA[group.actions[0]]}
              title={group.title}
              hint={group.hint}
              onClick={() => navigate(`/menu/${group.index}`)}
            />
          ))}
        </div>
      ) : (
        <FeatureRows actions={listed} />
      )}
    </Section>
  );
}

export default HomeMenu;
