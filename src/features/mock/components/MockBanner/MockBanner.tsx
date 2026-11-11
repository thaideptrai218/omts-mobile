import "./MockBanner.scss";

/** Nhắc rõ đây là số liệu mẫu, để không ai nhầm với dữ liệu thật của HTX. */
export function MockBanner() {
  return (
    <p className="mock-banner" role="note">
      <strong>Dữ liệu mẫu, bản dev.</strong> Máy chủ chưa có chức năng này, thao tác chỉ giữ tới khi tải lại app.
    </p>
  );
}
