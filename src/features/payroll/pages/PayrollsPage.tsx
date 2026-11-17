import type { PayrollSheetStatus, PayrollTotals } from "@/features/payroll/models/Payroll";
import { useCallback, useState } from "react";
import { Button, useNavigate } from "zmp-ui";
import { Badge } from "@/components/Badge/Badge";
import { Chips } from "@/components/Chips/Chips";
import { ManagePage } from "@/components/ManagePage/ManagePage";
import PagedList from "@/components/PagedList/PagedList";
import { Row } from "@/components/Row/Row";
import PayrollGate from "@/features/payroll/components/PayrollGate/PayrollGate";
import { listPayrolls } from "@/features/payroll/services/payrollService";
import { periodText, sheetStatus } from "@/features/payroll/utils/payText";
import { usePaged } from "@/hooks/usePaged";
import { money } from "@/utils/format";

type Filter = "active" | "Provisional" | "Finalized" | "Cancelled";

/** "Còn hiệu lực" là mọi trạng thái trừ Đã hủy, để số tổng không cộng cả bảng lương đã hủy. */
const STATUSES: Record<Filter, PayrollSheetStatus[]> = {
  active: ["Creating", "Provisional", "Finalized"],
  Provisional: ["Creating", "Provisional"],
  Finalized: ["Finalized"],
  Cancelled: ["Cancelled"],
};

const PAGE_SIZE = 15;

export default function PayrollsPage() {
  return <PayrollGate mode="owner" title="Bảng lương"><PayrollsContent /></PayrollGate>;
}

/**
 * Danh sách bảng lương (LABOR-12, chỉ Chủ HTX): kỳ mới nhất trước, lọc theo trạng thái, tổng lương, đã trả và còn phải trả của
 * cả tập đã lọc. Lập bảng lương mới ở chân trang.
 */
function PayrollsContent() {
  const navigate = useNavigate();
  const [filter, setFilter] = useState<Filter>("active");
  const [summary, setSummary] = useState<PayrollTotals | null>(null);
  const fetchPage = useCallback(async (page: number) => {
    const result = await listPayrolls({ status: STATUSES[filter], page, pageSize: PAGE_SIZE });
    if (page === 1) setSummary(result.summary);
    return result;
  }, [filter]);
  const list = usePaged(fetchPage);

  return (
    <ManagePage title="Bảng lương" footer={<Button fullWidth size="large" onClick={() => navigate("/manage/payrolls/new")}>Lập bảng lương</Button>}>
      <Button fullWidth variant="secondary" size="large" onClick={() => navigate("/manage/payroll-payments")}>Các lần trả lương và tạm ứng</Button>
      <div className="block">
        <Chips
          options={[["active", "Còn hiệu lực"], ["Provisional", "Tạm tính"], ["Finalized", "Đã chốt"], ["Cancelled", "Đã hủy"]]}
          value={filter}
          onChange={(v) => { setSummary(null); setFilter(v); }}
        />
        {summary && filter !== "Cancelled" && list.items !== null && (
          <div className="summary">
            <div className="summary__cell"><span className="summary__label">Tổng lương</span><span className="summary__value">{money(summary.total)}</span></div>
            <div className="summary__cell tone-success"><span className="summary__label">Đã trả</span><span className="summary__value">{money(summary.paid)}</span></div>
            <div className={`summary__cell${summary.outstanding > 0 ? " tone-warning" : ""}`}><span className="summary__label">Còn phải trả</span><span className="summary__value">{money(summary.outstanding)}</span></div>
          </div>
        )}
        <PagedList list={list} unit="bảng lương" emptyIcon="zi-file" emptyTitle="Chưa có bảng lương nào" emptyText={filter === "active" ? "Bấm “Lập bảng lương” để tính lương cho một kỳ." : "Thử chọn trạng thái khác."}>
          {(sheet) => {
            const st = sheetStatus(sheet.status);
            return (
              <Row
                key={sheet.id}
                title={sheet.name}
                meta={`${sheet.code} · ${periodText(sheet.from, sheet.to)}`}
                badge={<>
                  <Badge text={st.text} tone={st.tone} />
                  {sheet.status === "Finalized" && (sheet.outstanding > 0
                    ? <Badge text={`Còn phải trả ${money(sheet.outstanding)}`} tone="warning" />
                    : <Badge text="Đã trả đủ" tone="success" />)}
                </>}
                value={money(sheet.total)}
                onClick={() => navigate(`/manage/payrolls/${sheet.id}`)}
              />
            );
          }}
        </PagedList>
      </div>
    </ManagePage>
  );
}
