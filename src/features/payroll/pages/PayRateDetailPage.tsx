import type { JobType, JobTypeSaved } from "@/features/workforce/models/Job";
import { useState } from "react";
import { Button, Input, Sheet, useParams, useSnackbar } from "zmp-ui";
import { Actions } from "@/components/Actions/Actions";
import { Badge } from "@/components/Badge/Badge";
import DateField from "@/components/DateField/DateField";
import { Empty } from "@/components/Empty/Empty";
import { Facts } from "@/components/Facts/Facts";
import FormError from "@/components/FormError/FormError";
import { Loadable } from "@/components/Loadable/Loadable";
import { ManagePage } from "@/components/ManagePage/ManagePage";
import { NumberInput } from "@/components/NumberInput/NumberInput";
import { Row } from "@/components/Row/Row";
import { Rows } from "@/components/Rows/Rows";
import { Section } from "@/components/Section/Section";
import PayrollGate from "@/features/payroll/components/PayrollGate/PayrollGate";
import { changeRate, getJobType, renameJobType, setJobTypeInUse } from "@/features/payroll/services/payRateService";
import { JOB_IN_USE, jobStatus, nextRate, rateHistory, wholeAmount } from "@/features/payroll/utils/payText";
import { useBusinessPermission } from "@/hooks/useBusinessPermission";
import { useLoad } from "@/hooks/useLoad";
import { isApiError } from "@/services/errors";
import { errorText } from "@/utils/errorText";
import { date, money, parseNumber, todayIso } from "@/utils/format";
import "@/features/payroll/styles/payroll.scss";

type Mode = "rate" | "rename" | "status" | null;

export default function PayRateDetailPage() {
  return <PayrollGate mode="payRules" title="Loại việc"><DetailContent /></PayrollGate>;
}

/**
 * Một loại việc (LABOR-11, Kế toán và Chủ HTX): tiền công đang áp dụng và lịch sử giá. Đổi giá từ một ngày (LABOR-11.0, giá
 * cùng ngày được thay, BR-LABOR-12; ngày thuộc kỳ lương đã chốt bị từ chối MSG-LABOR-04), đổi tên (LABOR-11.3), ngừng dùng hoặc
 * dùng lại (LABOR-11.2). Mỗi thao tác hỏi lại trước khi gửi (MSG-LABOR-27, MSG-GEN-04) và kèm phiên bản bản ghi (MSG06).
 */
function DetailContent() {
  const { id = "" } = useParams();
  const { openSnackbar } = useSnackbar();
  const can = useBusinessPermission();
  const job = useLoad(() => getJobType(id), [id]);
  const [mode, setMode] = useState<Mode>(null);
  const [asking, setAsking] = useState(false);
  const [rate, setRate] = useState("");
  const [from, setFrom] = useState(todayIso);
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const data = job.data;
  const editable = can("PAY_RULES", "Edit");
  const inUse = data?.statusId === JOB_IN_USE;

  const open = (next: Exclude<Mode, null>) => {
    if (!data) return;
    setRate("");
    setFrom(todayIso());
    setName(data.name);
    setError("");
    setAsking(next === "status");
    setMode(next);
  };
  const close = () => { if (!busy) setMode(null); };

  // Kiểm tra tại chỗ, rồi hiện câu hỏi lại ngay trong sheet.
  const ask = () => {
    if (mode === "rate" && (wholeAmount(parseNumber(rate)) === null || !from)) { setError("Nhập tiền công mỗi giờ (số nguyên lớn hơn 0) và ngày áp dụng."); return; }
    if (mode === "rename" && !name.trim()) { setError("Nhập tên loại việc."); return; }
    setError("");
    setAsking(true);
  };

  const send = async (current: JobType) => {
    const hourly = wholeAmount(parseNumber(rate));
    let action: () => Promise<JobTypeSaved>;
    if (mode === "rate" && hourly !== null) action = () => changeRate(id, { hourlyRate: hourly, effectiveFrom: from, rowVersion: current.rowVersion });
    else if (mode === "rename") action = () => renameJobType(id, { name: name.trim(), rowVersion: current.rowVersion });
    else if (mode === "status") action = () => setJobTypeInUse(id, !inUse, { rowVersion: current.rowVersion });
    else return;
    setBusy(true);
    setError("");
    try {
      const saved = await action();
      job.setData(saved.jobType);
      setMode(null);
      openSnackbar({ text: mode === "rate" ? "Đã lưu tiền công." : mode === "rename" ? "Đã đổi tên loại việc." : inUse ? "Đã ngừng dùng loại việc." : "Đã dùng lại loại việc.", type: "success", duration: 4000 });
    } catch (err) {
      // MSG-GEN-02 (mã cũ MSG03): tên đã có (BR-LABOR-12). MSG06: người khác vừa sửa, tải bản mới rồi làm lại.
      setError(mode === "rename" && (isApiError(err, "MSG03") || isApiError(err, "MSG-GEN-02")) ? "Đã có loại việc trùng tên này." : errorText(err));
      setAsking(false);
      if (isApiError(err, "MSG06")) void job.reload();
    } finally {
      setBusy(false);
    }
  };

  const footer = data && editable && inUse ? <Button fullWidth size="large" onClick={() => open("rate")}>Đổi tiền công</Button> : undefined;

  return (
    <ManagePage title={data ? data.name : "Loại việc"} footer={footer}>
      <Loadable data={data} error={job.error} reload={() => void job.reload()}>
        {(j) => {
          const st = jobStatus(j.statusId);
          const upcoming = nextRate(j.otherRates);
          const history = rateHistory(j.currentRate, j.otherRates);
          const hourly = wholeAmount(parseNumber(rate));
          const sameDate = history.find((h) => h.rate.effectiveFrom === from);
          return (
            <>
              <Facts items={[
                ["Tên", j.name],
                ["Trạng thái", <Badge key="st" text={st.text} tone={st.tone} />],
                ["Tiền công hôm nay", j.currentRate ? `${money(j.currentRate.hourlyRate)} mỗi giờ` : "Chưa có giá áp dụng hôm nay"],
                ["Áp dụng từ", j.currentRate ? date(j.currentRate.effectiveFrom) : ""],
                ["Giá sắp áp dụng", upcoming ? `${money(upcoming.hourlyRate)} mỗi giờ, từ ${date(upcoming.effectiveFrom)}` : ""],
              ]} />
              {!inUse && <p className="form__hint">Loại việc đã ngừng dùng: không chọn được khi phân công hay lập hồ sơ nhân viên, và không đổi giá được. Giờ công đã có giữ nguyên.</p>}
              {editable && (
                <Actions>
                  <Button variant="secondary" size="large" onClick={() => open("rename")}>Đổi tên</Button>
                  <Button variant="secondary" size="large" type={inUse ? "danger" : "highlight"} onClick={() => open("status")}>{inUse ? "Ngừng dùng loại việc" : "Dùng lại loại việc"}</Button>
                </Actions>
              )}
              <Section title="Lịch sử tiền công">
                {history.length === 0 ? <Empty icon="zi-list-1" title="Chưa có giá nào" /> : (
                  <Rows>
                    {history.map(({ rate: r, label }) => (
                      <Row key={r.effectiveFrom} title={`Từ ${date(r.effectiveFrom)}`} badge={<Badge text={label.text} tone={label.tone} />} value={`${money(r.hourlyRate)}/giờ`} />
                    ))}
                  </Rows>
                )}
              </Section>

              <Sheet visible={mode === "rate" || mode === "rename"} onClose={close} autoHeight mask handler maskClosable={!busy} title={mode === "rename" ? "Đổi tên loại việc" : "Đổi tiền công"}>
                <div className="sheet-form form">
                  {mode === "rate" && (asking && hourly !== null ? (
                    <p className="payroll-question">
                      Từ ngày {date(from)}, tiền công mỗi giờ của “{j.name}” là {money(hourly)}
                      {sameDate ? ` (thay giá ${money(sameDate.rate.hourlyRate)} đã đặt cho ngày này)` : j.currentRate ? ` (giá hôm nay ${money(j.currentRate.hourlyRate)})` : ""}.
                      Giờ công từ ngày này tính theo giá mới. Bạn có chắc muốn lưu?
                    </p>
                  ) : (
                    <>
                      <p className="form__intro">Giá mới áp dụng cho giờ công từ ngày đã chọn; giờ công trước ngày đó giữ giá cũ. Chọn đúng ngày của một giá đã có thì giá đó được thay.</p>
                      <NumberInput label="Tiền công mỗi giờ, đồng (bắt buộc)" value={rate} onChange={setRate} disabled={busy} helperText="Ví dụ: 40.000" />
                      <DateField label="Áp dụng từ ngày (bắt buộc)" value={from} onChange={setFrom} disabled={busy} />
                    </>
                  ))}
                  {mode === "rename" && (asking ? (
                    <p className="payroll-question">Bạn có chắc muốn đổi tên “{j.name}” thành “{name.trim()}”? Giá và giờ công đã có giữ nguyên. Thao tác được ghi vào nhật ký hệ thống.</p>
                  ) : (
                    <Input label="Tên loại việc (bắt buộc)" value={name} maxLength={100} disabled={busy} onChange={(e) => setName(e.target.value)} />
                  ))}
                  <FormError text={error} />
                  <div className="sheet-actions">
                    {asking
                      ? <Button fullWidth size="large" loading={busy} disabled={busy} onClick={() => void send(j)}>{mode === "rename" ? "Có, đổi tên" : "Có, lưu tiền công"}</Button>
                      : <Button fullWidth size="large" disabled={busy} onClick={ask}>Tiếp tục</Button>}
                    <Button fullWidth size="large" variant="secondary" disabled={busy} onClick={asking ? () => { setAsking(false); setError(""); } : close}>
                      {asking ? "Sửa lại" : "Không, quay lại"}
                    </Button>
                  </div>
                </div>
              </Sheet>

              <Sheet visible={mode === "status"} onClose={close} autoHeight mask handler maskClosable={!busy} title={inUse ? "Ngừng dùng loại việc?" : "Dùng lại loại việc?"}>
                <div className="sheet-form form">
                  <p className="payroll-question">
                    {inUse
                      ? `Bạn có chắc muốn ngừng dùng “${j.name}”? Loại việc này sẽ không chọn được khi phân công và lập hồ sơ nhân viên; giờ công, phân công và giá đã có giữ nguyên.`
                      : `Bạn có chắc muốn dùng lại “${j.name}”? Loại việc này sẽ chọn được lại khi phân công và lập hồ sơ nhân viên.`}
                    {" "}Thao tác được ghi vào nhật ký hệ thống.
                  </p>
                  <FormError text={error} />
                  <div className="sheet-actions">
                    <Button fullWidth size="large" type={inUse ? "danger" : undefined} loading={busy} disabled={busy} onClick={() => void send(j)}>
                      {inUse ? "Ngừng dùng loại việc" : "Dùng lại loại việc"}
                    </Button>
                    <Button fullWidth size="large" variant="secondary" disabled={busy} onClick={close}>Không, quay lại</Button>
                  </div>
                </div>
              </Sheet>
            </>
          );
        }}
      </Loadable>
    </ManagePage>
  );
}
