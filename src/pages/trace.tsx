import { Header, Page, useLocation } from "zmp-ui";

import TraceLookup from "@/components/trace-lookup";

/** Truy xuất nguồn gốc: mở từ nút quét QR (`/trace?lot=TN-2410-07`, tra ngay) hoặc để nhập mã lô. */
function TracePage() {
  const lot = new URLSearchParams(useLocation().search).get("lot") ?? undefined;
  return (
    <Page className="screen screen--detail" hideScrollbar>
      <Header title="Truy xuất nguồn gốc" className="detail-header" />
      <div className="screen__body">
        <p className="form__intro">Quét mã QR hoặc nhập mã lô in trên bao bì.</p>
        <div className="card">
          <TraceLookup key={lot} initialCode={lot} />
        </div>
      </div>
    </Page>
  );
}

export default TracePage;
