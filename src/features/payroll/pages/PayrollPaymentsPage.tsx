import type { PayrollPaymentSummary, WagePaymentKind } from "@/features/payroll/models/PayrollPayment";
import { useCallback, useState } from "react";
import { Button, useLocation, useNavigate, useSnackbar } from "zmp-ui";
import { Badge } from "@/components/Badge/Badge";
import { Chips } from "@/components/Chips/Chips";
import { ManagePage } from "@/components/ManagePage/ManagePage";
import PagedList from "@/components/PagedList/PagedList";
import { Row } from "@/components/Row/Row";
import PayEmployeeSheet from "@/features/payroll/components/PayEmployeeSheet/PayEmployeeSheet";
import PayrollGate from "@/features/payroll/components/PayrollGate/PayrollGate";
import { listPayrollPayments } from "@/features/payroll/services/payrollService";
import { KIND_TEXT, METHOD_TEXT, paymentStatus } from "@/features/payroll/utils/payText";
import { usePaged } from "@/hooks/usePaged";
import { dateTime, money } from "@/utils/format";

type KindFilter = "all" | WagePaymentKind;

const PAGE_SIZE = 20;

export default function PayrollPaymentsPage() {
  return <PayrollGate mode="owner" title="Trả lương"><PaymentsContent /></PayrollGate>;
}

/**
 * Các lần trả lương và tạm ứng (LABOR-14, chỉ Chủ HTX), mới nhất trước. Mở từ một bảng lương (`?payrollId=`) hoặc một nhân
 * viên (`?employeeId=`) thì chỉ hiện các lần trả đó. Chân trang: trả tiền cho một nhân viên ngoài bảng lương.
 */
function PaymentsContent() {
  const navigate = useNavigate();
  const location = useLocation();
  const { openSnackbar } = useSnackbar();
  const params = new URLSearchParams(location.search);
  const name = (location.state as { name?: string } | null)?.name;
  const [payrollId, setPayrollId] = useState(params.get("payrollId"));
  const [employeeId, setEmployeeId] = useState(params.get("employeeId"));
  const [kind, setKind] = useState<KindFilter>("all");
  const [summary, setSummary] = useState<PayrollPaymentSummary | null>(null);
  const [paying, setPaying] = useState(false);
  const fetchPage = useCallback(async (page: number) => {
    const result = await listPayrollPayments({ payrollId, employeeId, kind: kind === "all" ? null : kind, page, pageSize: PAGE_SIZE });
    if (page === 1) setSummary(result.summary);
    return result;
  }, [payrollId, employeeId, kind]);
  const list = usePaged(fetchPage);
  const filtered = payrollId || employeeId;

  return (
    <ManagePage title="Trả lương" footer={<Button fullWidth size="large" onClick={() => setPaying(true)}>Trả lương hoặc tạm ứng</Button>}>
      {filtered && (
        <div className="card form">
          <p>{payrollId ? "Chỉ hiện các lần trả của một bảng lương." : `Chỉ hiện các lần trả cho ${name ?? "một nhân viên"}.`}</p>
          <Button fullWidth variant="secondary" size="large" onClick={() => { setPayrollId(null); setEmployeeId(null); }}>Xem mọi lần trả</Button>
        </div>
      )}
      <div className="block">
        <Chips options={[["all", "Tất cả"], ["Wage", KIND_TEXT.Wage], ["Advance", KIND_TEXT.Advance]]} value={kind} onChange={setKind} />
        {summary && list.items !== null && (
          <div className="summary">
            <div className="summary__cell"><span className="summary__label">Tổng đã trả</span><span className="summary__value">{money(summary.amount)}</span></div>
            <div className="summary__cell"><span className="summary__label">Số lần trả</span><span className="summary__value">{list.total}</span></div>
          </div>
        )}
        <PagedList list={list} unit="lần trả" emptyIcon="zi-check-circle" emptyTitle="Chưa có lần trả nào">
          {(p) => {
            const ps = paymentStatus(p.status);
            const sheetName = p.kind === "Wage" ? (p.payrollName ?? p.payrollCode) : null;
            return (
              <Row
                key={p.id}
                title={p.employeeName}
                meta={[dateTime(p.paidAt), METHOD_TEXT[p.method] ?? p.method, sheetName, `Phiếu chi ${p.voucherCode}`].filter(Boolean).join(" · ")}
                badge={<>
                  {p.kind === "Advance" && <Badge text={KIND_TEXT.Advance} tone="neutral" />}
                  {ps && <Badge text={ps.text} tone={ps.tone} />}
                </>}
                value={money(p.amount)}
                onClick={p.payrollId ? () => navigate(`/manage/payrolls/${p.payrollId}`) : undefined}
              />
            );
          }}
        </PagedList>
      </div>
      <PayEmployeeSheet
        visible={paying}
        onClose={() => setPaying(false)}
        onPaid={() => {
          openSnackbar({ text: "Đã ghi trả tiền.", type: "success", duration: 4000 });
          list.reload();
        }}
      />
    </ManagePage>
  );
}
