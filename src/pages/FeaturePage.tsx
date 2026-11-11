import type { FeatureKey } from "@/models/Navigation";
import { Button, useNavigate, useParams } from "zmp-ui";

import { Empty } from "@/components/Empty/Empty";
import { ManagePage } from "@/components/ManagePage/ManagePage";
import { FEATURES } from "@/constants/features";

/**
 * Trang của chức năng chưa có màn thật: backend OMTS.Api chưa có API cho chức năng này (danh sách ở
 * docs/owner-features.md). Chức năng đã có màn mở thẳng màn đó (`FEATURE_ROUTES`).
 */
function FeaturePage() {
  const { key } = useParams();
  const navigate = useNavigate();
  const feature = key && key in FEATURES ? FEATURES[key as FeatureKey] : null;

  return (
    <ManagePage
      title={feature?.title ?? "Không tìm thấy"}
      footer={
        <Button fullWidth size="large" onClick={() => navigate("/", { replace: true })}>
          Về trang chủ
        </Button>
      }
    >
      {feature ? (
        <Empty icon={feature.icon} title="Chức năng này sắp có" text={`${feature.description} Hiện chưa dùng được, màn hình sẽ mở khi hệ thống hoàn thành.`} />
      ) : (
        <Empty title="Không có chức năng này" text="Bấm Quay lại ở trên cùng và chọn một chức năng khác." />
      )}
    </ManagePage>
  );
}

export default FeaturePage;
