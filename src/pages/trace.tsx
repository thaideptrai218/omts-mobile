import { Page } from "zmp-ui";

import ScreenTitle from "@/components/screen-title";
import TraceLookup from "@/components/trace-lookup";

function TracePage() {
  return (
    <Page className="screen screen--with-nav screen--plain" hideScrollbar>
      <ScreenTitle title="Truy xuất nguồn gốc" subtitle="Quét mã QR hoặc nhập mã lô in trên bao bì." />
      <div className="screen__body">
        <div className="block block--raised">
          <TraceLookup />
        </div>
      </div>
    </Page>
  );
}

export default TracePage;
