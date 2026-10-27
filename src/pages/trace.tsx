import { Page } from "zmp-ui";

import PageHeader from "@/components/page-header";
import TraceLookup from "@/components/trace-lookup";

function TracePage() {
  return (
    <Page className="screen screen--with-nav" hideScrollbar>
      <PageHeader title="Truy xuất nguồn gốc" subtitle="Quét mã QR hoặc nhập mã lô in trên bao bì." />
      <div className="screen__body">
        <div className="card">
          <TraceLookup />
        </div>
      </div>
    </Page>
  );
}

export default TracePage;
