import type { PayrollReloadMode, PayrollSheetDetail } from "@/features/payroll/models/Payroll";
import { useState } from "react";
import { Button, Sheet, useNavigate, useParams, useSnackbar } from "zmp-ui";
import { Actions } from "@/components/Actions/Actions";
import { Badge } from "@/components/Badge/Badge";
import { ConfirmSheet } from "@/components/ConfirmSheet/ConfirmSheet";
import { Empty } from "@/components/Empty/Empty";
import { Facts } from "@/components/Facts/Facts";
import FormError from "@/components/FormError/FormError";
import { Loadable } from "@/components/Loadable/Loadable";
import { ManagePage } from "@/components/ManagePage/ManagePage";
import { Row } from "@/components/Row/Row";
import { Rows } from "@/components/Rows/Rows";
import { Section } from "@/components/Section/Section";
import PayLinesSheet from "@/features/payroll/components/PayLinesSheet/PayLinesSheet";
import PayrollGate from "@/features/payroll/components/PayrollGate/PayrollGate";
import { cancelPayroll, finalizePayroll, getPayroll, reloadPayroll } from "@/features/payroll/services/payrollService";
import { hoursText, monthText, PERIOD_TYPE_TEXT, periodText, SCOPE_TEXT, sheetStatus } from "@/features/payroll/utils/payText";
import NativePicker from "@/features/workforce/components/NativePicker/NativePicker";
import { useLoad } from "@/hooks/useLoad";
import { isApiError } from "@/services/errors";
import { errorText } from "@/utils/errorText";
import { dateTime, money } from "@/utils/format";
import "@/features/payroll/styles/payroll.scss";

type Ask = "reload" | "finalize" | "cancel" | "pay" | null;

export default function PayrollDetailPage() {
  return <PayrollGate mode="owner" title="Bảng lương"><DetailContent /></PayrollGate>;
}

/**
 * Chi tiết bảng lương (LABOR-12, LABOR-13, LABOR-14, chỉ Chủ HTX): phiếu lương từng người, tính lại khi còn tạm tính, chốt
 * (khóa chấm công của kỳ, trừ tạm ứng, BR-LABOR-13, BR-LABOR-11), hủy khi chưa chốt, và ghi trả lương khi đã chốt.
 */
function DetailContent() {
  const { id = "" } = useParams();
  const navigate = useNavigate();
  const { openSnackbar } = useSnackbar();
  const sheet = useLoad(() => getPayroll(id), [id]);
  const [ask, setAsk] = useState<Ask>(null);
  const [expenseMonth, setExpenseMonth] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const open = (next: Ask) => {
    setError("");
    if (next === "finalize" && sheet.data) setExpenseMonth(sheet.data.to.slice(0, 7));
    setAsk(next);
  };
  const close = () => { if (busy) return; setAsk(null); setError(""); };

  const run = async (action: () => Promise<PayrollSheetDetail>, done: string) => {
    setBusy(true);
    setError("");
    try {
      sheet.setData(await action());
      setAsk(null);
      openSnackbar({ text: done, type: "success", duration: 4000 });
    } catch (err) {
      setError(errorText(err));
      // MSG06: bảng lương vừa được lưu ở nơi khác; tải bản mới để người dùng xem lại.
      if (isApiError(err, "MSG06")) void sheet.reload();
    } finally {
      setBusy(false);
    }
  };

  const reload = (mode: PayrollReloadMode) => void run(() => reloadPayroll(id, { mode }), "Đã tính lại bảng lương.");
  const finalize = () => {
    if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(expenseMonth)) { setError("Chọn tháng ghi chi phí lương."); return; }
    void run(() => finalizePayroll(id, { expenseMonth }), "Đã chốt bảng lương.");
  };

  const data = sheet.data;
  const isOpen = data?.status === "Creating" || data?.status === "Provisional";
  const unpaid = data?.status === "Finalized" ? data.slips.filter((s) => s.outstanding > 0) : [];
  const footer = !data ? undefined
    : data.status === "Provisional" ? <Button fullWidth size="large" onClick={() => open("finalize")}>Chốt bảng lương</Button>
    : unpaid.length > 0 ? <Button fullWidth size="large" onClick={() => open("pay")}>Ghi trả lương</Button>
    : undefined;

  return (
    <ManagePage title={data ? data.name : "Bảng lương"} footer={footer}>
      <Loadable data={data} error={sheet.error} reload={() => void sheet.reload()}>
        {(s) => {
          const st = sheetStatus(s.status);
          return (
            <>
              <Facts items={[
                ["Mã", s.code],
                ["Trạng thái", <Badge key="st" text={st.text} tone={st.tone} />],
                ["Kỳ lương", `${periodText(s.from, s.to)} (${PERIOD_TYPE_TEXT[s.periodType] ?? s.periodType})`],
                ["Nhân viên", `${s.employeeCount} người · ${SCOPE_TEXT[s.scope] ?? s.scope}`],
                ["Tổng lương", <span key="total" className="payroll-total">{money(s.total)}</span>],
                ["Đã trả", money(s.paid)],
                ["Còn phải trả", <span key="out" className={s.outstanding > 0 ? "text-danger" : undefined}>{money(s.outstanding)}</span>],
                ["Tháng ghi chi phí", monthText(s.expenseMonth)],
                ["Người lập", s.createdByName ?? s.createdBy],
                ["Lập lúc", dateTime(s.createdAt)],
                ["Ghi chú", s.note],
              ]} />
              <p className="form__hint">
                {isOpen ? "Bảng lương tạm tính theo chấm công hiện tại. Sửa chấm công xong thì bấm “Tính lại”; chốt khi kỳ lương đã kết thúc."
                  : s.status === "Finalized" ? "Đã chốt: chấm công và tiền công trong kỳ bị khóa, tiền tạm ứng đã được trừ vào phiếu lương."
                  : "Bảng lương đã hủy, không còn được tính. Kỳ này có thể lập bảng lương mới."}
              </p>
              {(isOpen || s.status === "Finalized") && (
                <Actions>
                  {isOpen && <Button variant="secondary" size="large" onClick={() => open("reload")}>Tính lại</Button>}
                  {s.status === "Finalized" && (
                    <Button variant="secondary" size="large" onClick={() => navigate(`/manage/payroll-payments?payrollId=${s.id}`)}>Xem các lần trả</Button>
                  )}
                  {isOpen && <Button variant="secondary" size="large" type="danger" onClick={() => open("cancel")}>Hủy bảng lương</Button>}
                </Actions>
              )}
              <Section title={`Phiếu lương (${s.slips.length})`}>
                {s.slips.length === 0 ? <Empty icon="zi-user" title="Bảng lương chưa có phiếu nào" /> : (
                  <Rows>
                    {s.slips.map((slip) => (
                      <Row
                        key={slip.id}
                        title={slip.employeeName}
                        meta={[slip.employeeCode, hoursText(slip.hours) + (slip.hourlyRateNote ? ` × ${slip.hourlyRateNote} đ` : "")].filter(Boolean).join(" · ")}
                        badge={<>
                          {slip.deduction > 0 && <Badge text={`Trừ tạm ứng ${money(slip.deduction)}`} tone="neutral" />}
                          {s.status === "Finalized" && (slip.outstanding > 0
                            ? <Badge text={`Còn phải trả ${money(slip.outstanding)}`} tone="warning" />
                            : <Badge text="Đã trả đủ" tone="success" />)}
                        </>}
                        value={money(slip.net)}
                        onClick={() => navigate(`/manage/payroll-slips/${slip.id}`)}
                      />
                    ))}
                  </Rows>
                )}
              </Section>

              <Sheet visible={ask === "reload"} onClose={close} autoHeight mask handler maskClosable={!busy} title="Tính lại bảng lương">
                <div className="sheet-form form">
                  <p className="form__intro">Tính lại theo chấm công và tiền công mới nhất của kỳ {periodText(s.from, s.to)}.</p>
                  <FormError text={error} />
                  <div className="sheet-actions">
                    <Button fullWidth size="large" loading={busy} disabled={busy} onClick={() => reload("All")}>Tính lại cả danh sách nhân viên</Button>
                    <p className="form__hint">Thêm người mới có giờ công trong kỳ, bỏ người không còn giờ công.</p>
                    <Button fullWidth size="large" variant="secondary" disabled={busy} onClick={() => reload("WorkingDaysOnly")}>Chỉ tính lại giờ công</Button>
                    <p className="form__hint">Giữ nguyên những người đang có trong bảng lương.</p>
                    <Button fullWidth size="large" variant="secondary" disabled={busy} onClick={close}>Không, quay lại</Button>
                  </div>
                </div>
              </Sheet>

              <Sheet visible={ask === "finalize"} onClose={close} autoHeight mask handler maskClosable={!busy} title="Chốt bảng lương?">
                <div className="sheet-form form">
                  <div className="payroll-question">
                    Sau khi chốt: bảng lương được tính lại lần cuối; chấm công và tiền công trong kỳ {periodText(s.from, s.to)} bị khóa, không sửa được;
                    tiền tạm ứng chưa trừ của nhân viên được trừ vào lương; bảng lương không hủy được nữa.
                  </div>
                  <NativePicker label="Tháng ghi chi phí lương (bắt buộc)" type="month" value={expenseMonth} hint="Tháng tiền lương được tính vào chi phí." disabled={busy} onChange={setExpenseMonth} />
                  <FormError text={error} />
                  <div className="sheet-actions">
                    <Button fullWidth size="large" loading={busy} disabled={busy} onClick={finalize}>Chốt bảng lương</Button>
                    <Button fullWidth size="large" variant="secondary" disabled={busy} onClick={close}>Không, quay lại</Button>
                  </div>
                </div>
              </Sheet>

              <ConfirmSheet
                visible={ask === "cancel"}
                title="Hủy bảng lương?"
                message={<>
                  <p>Bảng lương {s.code} sẽ không còn được tính; kỳ này có thể lập bảng lương mới. Không hoàn tác được.</p>
                  <FormError text={error} />
                </>}
                confirmText="Hủy bảng lương"
                danger
                busy={busy}
                onClose={close}
                onConfirm={() => void run(() => cancelPayroll(id), "Đã hủy bảng lương.")}
              />

              <PayLinesSheet
                visible={ask === "pay"}
                payrollId={s.id}
                slips={unpaid}
                onClose={() => setAsk(null)}
                onPaid={(people) => {
                  openSnackbar({ text: `Đã ghi trả lương cho ${people} người.`, type: "success", duration: 4000 });
                  void sheet.reload();
                }}
              />
            </>
          );
        }}
      </Loadable>
    </ManagePage>
  );
}
