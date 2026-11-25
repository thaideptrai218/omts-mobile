import type { CreatePayrollRequest, PayrollScope } from "@/features/payroll/models/Payroll";
import { useState } from "react";
import { Button, useNavigate } from "zmp-ui";
import { Chips } from "@/components/Chips/Chips";
import DateField from "@/components/DateField/DateField";
import FormError from "@/components/FormError/FormError";
import { Loadable } from "@/components/Loadable/Loadable";
import { ManagePage } from "@/components/ManagePage/ManagePage";
import { SearchBox } from "@/components/SearchBox/SearchBox";
import { Section } from "@/components/Section/Section";
import PayrollGate from "@/features/payroll/components/PayrollGate/PayrollGate";
import { createPayroll, payableEmployees } from "@/features/payroll/services/payrollService";
import { daySpan, monthRange, periodText, periodTypeOf } from "@/features/payroll/utils/payText";
import NativePicker from "@/features/workforce/components/NativePicker/NativePicker";
import { useLoad } from "@/hooks/useLoad";
import { isApiError } from "@/services/errors";
import { errorText } from "@/utils/errorText";
import { todayIso } from "@/utils/format";
import "@/features/payroll/styles/payroll.scss";

type PeriodMode = "month" | "range";

const MAX_EMPLOYEES = 500;
const MAX_DAYS = 366;

/** Tháng trước của hôm nay, dạng "YYYY-MM": thường là tháng cần tính lương. */
function lastMonth() {
  const [y, m] = todayIso().split("-").map(Number);
  return m === 1 ? `${y - 1}-12` : `${y}-${String(m - 1).padStart(2, "0")}`;
}

export default function PayrollCreatePage() {
  return <PayrollGate mode="owner" title="Lập bảng lương"><CreateContent /></PayrollGate>;
}

/**
 * Lập bảng lương (LABOR-12, chỉ Chủ HTX): chọn kỳ (trọn một tháng, hoặc khoảng ngày
 * tối đa 366 ngày, không bắt đầu sau hôm nay) và người được tính. Server tính ngay theo giờ công đã chấm và tiền công mỗi giờ
 * đang áp dụng từng ngày (BR-LABOR-05, BR-LABOR-12); bảng lương ở trạng thái Tạm tính cho tới khi chốt.
 */
function CreateContent() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<PeriodMode>("month");
  const [month, setMonth] = useState(lastMonth);
  const [from, setFrom] = useState(todayIso);
  const [to, setTo] = useState(todayIso);
  const [scope, setScope] = useState<PayrollScope>("All");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [existingId, setExistingId] = useState<string | null>(null);
  const people = useLoad(async () => (scope === "Selected" ? (await payableEmployees(search, true)).items : []), [scope, search]);

  const periodOptions: [PeriodMode, string][] = [
    ["month", "Trọn một tháng"],
    ["range", "Khoảng ngày khác"],
  ];
  const period = mode === "month" ? (month ? monthRange(month) : { from: "", to: "" }) : { from, to };

  const fail = (text: string) => { setExistingId(null); setError(text); };

  const submit = async () => {
    if (mode === "month" && !month) { fail("Chọn tháng cần tính lương."); return; }
    if (!period.from || !period.to || period.from > period.to) { fail("Chọn từ ngày và đến ngày; đến ngày không được trước từ ngày."); return; }
    if (period.from > todayIso()) { fail("Kỳ lương không được bắt đầu sau hôm nay."); return; }
    if (daySpan(period.from, period.to) > MAX_DAYS) { fail(`Khoảng ngày tối đa ${MAX_DAYS} ngày.`); return; }
    if (scope === "Selected" && (selected.length === 0 || selected.length > MAX_EMPLOYEES)) { fail(`Chọn từ 1 đến ${MAX_EMPLOYEES} nhân viên.`); return; }
    const body: CreatePayrollRequest = {
      periodType: periodTypeOf(period.from, period.to),
      from: period.from,
      to: period.to,
      scope,
      employeeIds: scope === "Selected" ? selected : null,
    };
    setBusy(true);
    setError("");
    setExistingId(null);
    try {
      const sheet = await createPayroll(body);
      navigate(`/manage/payrolls/${sheet.id}`, { replace: true });
    } catch (err) {
      const details = isApiError(err) ? err.details : {};
      const other = typeof details.existingId === "string" ? details.existingId : null;
      // MSG-GEN-02 (mã cũ MSG03): đã có bảng lương cùng kỳ trả cho một trong các nhân viên này. MSG-GEN-01 "Period": kỳ trùng
      // một phần với bảng lương khác, không ai có giờ công, hoặc khoảng ngày không hợp lệ.
      if (isApiError(err, "MSG03") || isApiError(err, "MSG-GEN-02")) {
        setError("Đã có bảng lương cùng kỳ này cho một số nhân viên đã chọn. Mở bảng lương đó để xem hoặc tính lại.");
        setExistingId(other);
      } else if ((isApiError(err, "MSG01") || isApiError(err, "MSG-GEN-01")) && details.field === "Period") {
        setError(other ? "Khoảng ngày này trùng một phần với một bảng lương khác của cùng nhân viên. Chọn khoảng ngày không trùng, hoặc hủy bảng lương kia trước."
          : /no employee has hours/i.test(String(details.hint ?? "")) ? "Không nhân viên nào có giờ công đã chấm trong kỳ này nên chưa lập được bảng lương."
          : "Kỳ lương không hợp lệ: không bắt đầu sau hôm nay, tối đa 366 ngày; chọn theo tháng thì phải là trọn tháng.");
        setExistingId(other);
      } else {
        setError(errorText(err));
      }
    } finally {
      setBusy(false);
    }
  };

  const toggle = (id: string, on: boolean) => setSelected((list) => (on ? [...list, id] : list.filter((x) => x !== id)));

  return (
    <ManagePage title="Lập bảng lương" footer={<Button fullWidth size="large" loading={busy} disabled={busy} onClick={() => void submit()}>Lập bảng lương</Button>}>
      <p className="form__hint">Bảng lương được tính ngay theo giờ công đã chấm và tiền công mỗi giờ của từng ngày. Số liệu là tạm tính; sửa chấm công xong thì bấm “Tính lại”, kỳ đã kết thúc thì chốt.</p>
      <Section step={1} title="Kỳ lương">
        <div className="payroll-stack">
          <Chips options={periodOptions} value={mode} onChange={(v) => { setMode(v); setError(""); }} />
          {mode === "month" && (
            <div className="card form">
              <NativePicker label="Tháng (bắt buộc)" type="month" value={month} hint="Bấm vào ô để chọn tháng. Tính từ ngày 1 đến ngày cuối tháng." disabled={busy} onChange={setMonth} />
            </div>
          )}
          {mode === "range" && (
            <div className="card form">
              <DateField label="Từ ngày (bắt buộc)" value={from} onChange={setFrom} disabled={busy} />
              <DateField label="Đến ngày (bắt buộc)" value={to} onChange={setTo} disabled={busy} />
            </div>
          )}
          {period.from && period.to && <p className="form__hint">Tính lương cho {periodText(period.from, period.to)}.</p>}
        </div>
      </Section>
      <Section step={2} title="Nhân viên được tính lương">
        <div className="payroll-stack">
          <Chips options={[["All", "Mọi người có giờ công"], ["Selected", "Chọn nhân viên"]]} value={scope} onChange={(v) => { setScope(v); setError(""); }} />
          {scope === "All" ? (
            <p className="form__hint">Mọi nhân viên có giờ công đã chấm trong kỳ đều có phiếu lương.</p>
          ) : (
            <>
              <SearchBox label="Tìm nhân viên" placeholder="Tên hoặc mã nhân viên" onSearch={setSearch} />
              <p className="form__hint" role="status">Đã chọn {selected.length} người.</p>
              <Loadable data={people.data} error={people.error} reload={() => void people.reload()}>
                {(items) => items.length === 0 ? <p className="form__hint">Không có nhân viên phù hợp.</p> : (
                  <div className="payroll-choices">
                    {items.map((p) => {
                      const on = selected.includes(p.employeeId);
                      return (
                        <label key={p.employeeId} className={`payroll-choice${on ? " is-selected" : ""}`}>
                          <span className="payroll-choice__head">
                            <input type="checkbox" checked={on} disabled={busy} onChange={(e) => toggle(p.employeeId, e.target.checked)} />
                            <span className="payroll-choice__text">
                              <span className="payroll-choice__name">{p.name}</span>
                              {p.code && <span className="payroll-choice__meta">{p.code}</span>}
                            </span>
                          </span>
                        </label>
                      );
                    })}
                  </div>
                )}
              </Loadable>
            </>
          )}
        </div>
      </Section>
      <FormError text={error} />
      {existingId && (
        <Button fullWidth size="large" variant="secondary" className="more" onClick={() => navigate(`/manage/payrolls/${existingId}`)}>Mở bảng lương đã có</Button>
      )}
    </ManagePage>
  );
}
