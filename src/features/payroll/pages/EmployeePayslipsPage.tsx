import type { EmployeeSlipSummary } from "@/features/payroll/models/Payslip";
import { useCallback, useState } from "react";
import { Button, useLocation, useNavigate, useParams } from "zmp-ui";
import { Badge } from "@/components/Badge/Badge";
import { ManagePage } from "@/components/ManagePage/ManagePage";
import PagedList from "@/components/PagedList/PagedList";
import { Row } from "@/components/Row/Row";
import PayrollGate from "@/features/payroll/components/PayrollGate/PayrollGate";
import { employeePayslips } from "@/features/payroll/services/payrollService";
import { periodText, sheetStatus } from "@/features/payroll/utils/payText";
import { usePaged } from "@/hooks/usePaged";
import { money } from "@/utils/format";

const PAGE_SIZE = 20;

export default function EmployeePayslipsPage() {
  return <PayrollGate mode="owner" title="Phiếu lương"><EmployeePayslipsContent /></PayrollGate>;
}

/**
 * Các phiếu lương của một nhân viên (LABOR-14, chỉ Chủ HTX), kỳ mới nhất trước, bỏ bảng lương đã hủy: còn nợ trên các phiếu đã
 * chốt và tiền tạm ứng chưa trừ. Tên nhân viên đi theo đường dẫn từ màn trước, vì API danh sách không trả tên.
 */
function EmployeePayslipsContent() {
  const { employeeId = "" } = useParams();
  const navigate = useNavigate();
  const name = (useLocation().state as { name?: string } | null)?.name;
  const [summary, setSummary] = useState<EmployeeSlipSummary | null>(null);
  const fetchPage = useCallback(async (page: number) => {
    const result = await employeePayslips(employeeId, { page, pageSize: PAGE_SIZE });
    if (page === 1) setSummary(result.summary);
    return result;
  }, [employeeId]);
  const list = usePaged(fetchPage);

  return (
    <ManagePage title={name ? `Phiếu lương của ${name}` : "Phiếu lương của nhân viên"}>
      {summary && (
        <div className="summary">
          <div className={`summary__cell${summary.outstanding > 0 ? " tone-warning" : ""}`}><span className="summary__label">Còn phải trả</span><span className="summary__value">{money(summary.outstanding)}</span></div>
          <div className="summary__cell"><span className="summary__label">Tạm ứng chưa trừ</span><span className="summary__value">{money(summary.advanceBalance)}</span></div>
        </div>
      )}
      <Button fullWidth variant="secondary" size="large" onClick={() => navigate(`/manage/payroll-payments?employeeId=${employeeId}`, { state: { name } })}>Các lần trả lương và tạm ứng</Button>
      <div className="block">
        <PagedList list={list} unit="phiếu lương" emptyIcon="zi-file" emptyTitle="Chưa có phiếu lương nào">
          {(slip) => {
            const st = sheetStatus(slip.status);
            return (
              <Row
                key={slip.id}
                title={slip.payrollName}
                meta={`${slip.code} · ${periodText(slip.from, slip.to)}`}
                badge={<>
                  <Badge text={st.text} tone={st.tone} />
                  {slip.status === "Finalized" && (slip.outstanding > 0
                    ? <Badge text={`Còn phải trả ${money(slip.outstanding)}`} tone="warning" />
                    : <Badge text="Đã trả đủ" tone="success" />)}
                </>}
                value={money(slip.net)}
                onClick={() => navigate(`/manage/payroll-slips/${slip.id}`)}
              />
            );
          }}
        </PagedList>
      </div>
    </ManagePage>
  );
}
