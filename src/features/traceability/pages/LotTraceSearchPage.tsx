import type { LotTraceSearchResult } from "@/features/traceability/models/LotTracing";
import { FormEvent, useEffect, useState } from "react";
import { Button, Input, useLocation, useNavigate } from "zmp-ui";

import { Badge } from "@/components/Badge/Badge";
import { Empty } from "@/components/Empty/Empty";
import FormError from "@/components/FormError/FormError";
import { ManagePage } from "@/components/ManagePage/ManagePage";
import { Row } from "@/components/Row/Row";
import { Rows } from "@/components/Rows/Rows";
import { errorText } from "@/utils/errorText";
import { date } from "@/utils/format";
import { MetaLines } from "@/features/purchasing/components/MetaLines/MetaLines";
import { searchLots } from "@/features/traceability/services/lotTracingService";
import { ORIGIN_STATE } from "@/features/traceability/utils/lotTraceText";

/**
 * Truy vết lô hàu (TRACE-02 bước 1), cho Quản lý vùng, Chủ HTX và Kế toán: tìm lô theo đầu mã lô hoặc theo mã hóa đơn bán
 * có lô đó, trong các vùng người dùng được xem. Mở được từ màn khác với `?lot=<mã lô>` để tìm ngay.
 */
function LotTraceSearchPage() {
  const navigate = useNavigate();
  const initialLot = new URLSearchParams(useLocation().search).get("lot") ?? "";
  const [lotCode, setLotCode] = useState(initialLot);
  const [invoiceCode, setInvoiceCode] = useState("");
  const [result, setResult] = useState<LotTraceSearchResult | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const search = async (lot: string, invoice: string) => {
    if (!lot.trim() && !invoice.trim()) {
      setError("Nhập mã lô hoặc mã hóa đơn để tìm.");
      return;
    }
    setError("");
    setBusy(true);
    try {
      setResult(await searchLots({ lotCode: lot, invoiceCode: invoice }));
    } catch (err) {
      setError(errorText(err));
    } finally {
      setBusy(false);
    }
  };

  const submit = (e: FormEvent) => {
    e.preventDefault();
    void search(lotCode, invoiceCode);
  };

  // Mở kèm mã lô thì tìm ngay một lần.
  useEffect(() => {
    if (initialLot) void search(initialLot, "");
  }, [initialLot]);

  return (
    <ManagePage title="Truy vết lô hàu">
      <form className="form card" onSubmit={submit}>
        <p className="form__intro">Xem lô hàu được thả giống từ đâu và đã bán cho ai. Nhập một trong hai mã.</p>
        <Input label="Mã lô" placeholder="Ví dụ: LO2611" value={lotCode} onChange={(e) => setLotCode(e.target.value)} maxLength={50} disabled={busy} />
        <Input label="Mã hóa đơn bán" placeholder="Ví dụ: HD000123" value={invoiceCode} onChange={(e) => setInvoiceCode(e.target.value)} maxLength={50} disabled={busy} />
        <FormError text={error} />
        <Button htmlType="submit" fullWidth size="large" loading={busy} disabled={busy}>
          Tìm lô
        </Button>
      </form>

      {result && (
        <div className="block">
          {result.lots.length === 0 ? (
            <Empty icon="zi-search" title="Không tìm thấy lô nào" text="Kiểm tra lại mã, hoặc lô thuộc vùng bạn không được xem." />
          ) : (
            <Rows>
              {result.lots.map((lot) => {
                const origin = ORIGIN_STATE[lot.originState];
                return (
                  <Row
                    key={lot.id}
                    title={`Lô ${lot.lotCode}`}
                    meta={
                      <MetaLines
                        items={[
                          ["Ngày thu", date(lot.harvestDate)],
                          ["Bè", `${lot.raftCode} · vùng ${lot.zoneCode}`],
                        ]}
                      />
                    }
                    badge={<Badge text={origin.text} tone={origin.tone} />}
                    onClick={() => navigate(`/manage/lot-trace/${lot.id}`)}
                  />
                );
              })}
            </Rows>
          )}
        </div>
      )}
    </ManagePage>
  );
}

export default LotTraceSearchPage;
