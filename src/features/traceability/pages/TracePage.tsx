import { useLocation } from "zmp-ui";

import { ManagePage } from "@/components/ManagePage/ManagePage";
import TraceLookup from "@/features/traceability/components/TraceLookup/TraceLookup";

/** Truy xuất nguồn gốc: mở từ nút quét QR hoặc từ hóa đơn (`/trace?origin=<mã>`, tra ngay), hoặc để dán đường link. */
function TracePage() {
  const token = new URLSearchParams(useLocation().search).get("origin") ?? undefined;
  return (
    <ManagePage title="Truy xuất nguồn gốc">
      <p className="form__intro">Quét mã QR trên bao bì để xem hàu được nuôi ở đâu, thu hoạch khi nào.</p>
      <div className="card">
        <TraceLookup key={token} initialToken={token} />
      </div>
    </ManagePage>
  );
}

export default TracePage;
