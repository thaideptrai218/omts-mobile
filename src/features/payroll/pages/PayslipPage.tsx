import { useState } from "react";
import { Button, useNavigate, useParams, useSnackbar } from "zmp-ui";
import { Actions } from "@/components/Actions/Actions";
import { Badge } from "@/components/Badge/Badge";
import { Empty } from "@/components/Empty/Empty";
import { Facts } from "@/components/Facts/Facts";
import { Loadable } from "@/components/Loadable/Loadable";
import { ManagePage } from "@/components/ManagePage/ManagePage";
import { Row } from "@/components/Row/Row";
import { Rows } from "@/components/Rows/Rows";
import { Section } from "@/components/Section/Section";
import PayLinesSheet from "@/features/payroll/components/PayLinesSheet/PayLinesSheet";
import PayrollGate from "@/features/payroll/components/PayrollGate/PayrollGate";
import { getPayslip } from "@/features/payroll/services/payrollService";
import { hoursText, KIND_TEXT, METHOD_TEXT, paymentStatus, periodText, sheetStatus } from "@/features/payroll/utils/payText";
import { useLoad } from "@/hooks/useLoad";
import { date, dateTime, money } from "@/utils/format";
import "@/features/payroll/styles/payroll.scss";

export default function PayslipPage() {
  return <PayrollGate mode="owner" title="Phiếu lương"><PayslipContent /></PayrollGate>;
}

/**
 * Một phiếu lương (LABOR-12, LABOR-14, chỉ Chủ HTX): tiền công theo loại việc và mức giá, tạm ứng đã trừ, các lần trả và các
 * ngày công được tính (nhân viên thời vụ có đủ giờ vào và ra, BR-LABOR-05). Phiếu của bảng lương đã chốt còn nợ thì ghi trả.
 */
function PayslipContent() {
  const { slipId = "" } = useParams();
  const navigate = useNavigate();
  const { openSnackbar } = useSnackbar();
  const slip = useLoad(() => getPayslip(slipId), [slipId]);
  const [paying, setPaying] = useState(false);
  const data = slip.data;
  const canPay = !!data && data.status === "Finalized" && data.outstanding > 0;

  return (
    <ManagePage
      title={data ? `Phiếu lương ${data.code}` : "Phiếu lương"}
      footer={canPay ? <Button fullWidth size="large" onClick={() => setPaying(true)}>Ghi trả lương phiếu này</Button> : undefined}
    >
      <Loadable data={data} error={slip.error} reload={() => void slip.reload()}>
        {(p) => {
          const st = sheetStatus(p.status);
          return (
            <>
              <Facts items={[
                ["Nhân viên", p.employeeName],
                ["Bảng lương", p.payrollCode],
                ["Kỳ lương", periodText(p.from, p.to)],
                ["Trạng thái", <Badge key="st" text={st.text} tone={st.tone} />],
                ["Giờ công", hoursText(p.hours)],
                ["Lương theo giờ công", money(p.mainPay)],
                ["Thưởng", p.bonus > 0 ? money(p.bonus) : ""],
                ["Thu nhập", money(p.income)],
                ["Trừ tạm ứng", p.deduction > 0 ? money(p.deduction) : ""],
                ["Thực nhận", <span key="net" className="payroll-total">{money(p.net)}</span>],
                ["Đã trả", money(p.paid)],
                ["Còn phải trả", p.status === "Finalized" ? <span key="out" className={p.outstanding > 0 ? "text-danger" : undefined}>{money(p.outstanding)}</span> : ""],
              ]} />
              {p.status !== "Finalized" && <p className="form__hint">Bảng lương chưa chốt nên số liệu còn có thể thay đổi; chỉ trả lương sau khi chốt.</p>}
              <Actions>
                <Button variant="secondary" size="large" onClick={() => navigate(`/manage/payrolls/${p.payrollId}`)}>Mở bảng lương {p.payrollCode}</Button>
                <Button variant="secondary" size="large" onClick={() => navigate(`/manage/payroll-employees/${p.employeeId}`, { state: { name: p.employeeName } })}>
                  Các phiếu lương của {p.employeeName}
                </Button>
              </Actions>

              <Section title="Tiền công theo loại việc">
                {p.lines.length === 0 ? <Empty icon="zi-clock-1" title="Không có giờ công trong kỳ" /> : (
                  <Rows>
                    {p.lines.map((line, i) => (
                      <Row key={`${line.jobName}-${line.hourlyRate}-${i}`} title={line.jobName} meta={`${hoursText(line.hours)} × ${money(line.hourlyRate)}`} value={money(line.amount)} />
                    ))}
                  </Rows>
                )}
              </Section>

              <Section title="Các lần trả">
                {p.payments.length === 0 ? <Empty icon="zi-check-circle" title="Chưa trả lần nào" /> : (
                  <Rows>
                    {p.payments.map((pay) => {
                      const ps = paymentStatus(pay.status);
                      return (
                        <Row
                          key={pay.id}
                          title={money(pay.amount)}
                          meta={`${dateTime(pay.paidAt)} · ${METHOD_TEXT[pay.method] ?? pay.method} · ${KIND_TEXT[pay.kind] ?? pay.kind} · ${pay.voucherCode}`}
                          badge={ps ? <Badge text={ps.text} tone={ps.tone} /> : undefined}
                        />
                      );
                    })}
                  </Rows>
                )}
              </Section>

              <Section title={`Ngày công được tính (${p.attendance.length})`}>
                {p.attendance.length === 0 ? <Empty icon="zi-calendar" title="Không có ngày công" /> : (
                  <Rows>
                    {p.attendance.map((day, i) => <Row key={`${day.date}-${day.jobName}-${i}`} title={date(day.date)} meta={day.jobName} value={hoursText(day.hours)} />)}
                  </Rows>
                )}
              </Section>

              <PayLinesSheet
                visible={paying}
                payrollId={p.payrollId}
                slips={canPay ? [{ id: p.id, employeeName: p.employeeName, outstanding: p.outstanding }] : []}
                onClose={() => setPaying(false)}
                onPaid={() => {
                  openSnackbar({ text: "Đã ghi trả lương.", type: "success", duration: 4000 });
                  void slip.reload();
                }}
              />
            </>
          );
        }}
      </Loadable>
    </ManagePage>
  );
}
