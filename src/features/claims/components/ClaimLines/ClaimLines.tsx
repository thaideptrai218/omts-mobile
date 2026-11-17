import type { QualityClaimInvoiceLine } from "@/features/claims/models/QualityClaim";

import { money, num } from "@/utils/format";

/** Các dòng hàng của hóa đơn: sản phẩm, lô thu hoạch, kg; đơn giá và thành tiền chỉ có ở bản của nhân viên. */
export function ClaimLines({ lines }: { lines: QualityClaimInvoiceLine[] }) {
  if (lines.length === 0) return null;
  return (
    <div className="card">
      {lines.map((line, i) => (
        <div key={`${line.lotCode}-${i}`} className="claim-line">
          <p className="claim-line__title">
            {line.productName} · lô {line.lotCode}
          </p>
          <p className="claim-line__meta">
            {num(line.kg, "kg")}
            {line.unitPrice !== null && line.amount !== null ? ` × ${money(line.unitPrice)} = ${money(line.amount)}` : ""}
          </p>
        </div>
      ))}
    </div>
  );
}
