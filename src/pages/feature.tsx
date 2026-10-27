import { Header, Icon, Page, useParams } from "zmp-ui";

import { FEATURES, FeatureKey } from "@/data/features";

/** Trang chi tiết của một chức năng. Hiện mới có khung giao diện, chưa nối dữ liệu. */
function FeaturePage() {
  const { key } = useParams();
  const feature = key && key in FEATURES ? FEATURES[key as FeatureKey] : null;

  return (
    <Page className="screen screen--detail" hideScrollbar>
      <Header title={feature?.title ?? "Không tìm thấy"} className="detail-header" />
      <div className="screen__body">
        {feature ? (
          <div className="empty">
            <span className="empty__badge">
              <Icon icon={feature.icon} size={32} />
            </span>
            <p className="empty__title">{feature.title}</p>
            <p className="empty__text">{feature.description}</p>
            <p className="empty__hint">Màn hình này đang được xây dựng.</p>
          </div>
        ) : (
          <div className="empty">
            <p className="empty__title">Không có chức năng này</p>
            <p className="empty__text">Bấm nút quay lại ở góc trên bên trái và chọn một chức năng khác.</p>
          </div>
        )}
      </div>
    </Page>
  );
}

export default FeaturePage;
