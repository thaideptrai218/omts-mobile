import { useCallback, useEffect, useState } from "react";
import { Button, Input, Sheet, useNavigate } from "zmp-ui";
import { Badge } from "@/components/Badge/Badge";
import { Chips } from "@/components/Chips/Chips";
import DateField from "@/components/DateField/DateField";
import FormError from "@/components/FormError/FormError";
import { ManagePage } from "@/components/ManagePage/ManagePage";
import { NumberInput } from "@/components/NumberInput/NumberInput";
import PagedList from "@/components/PagedList/PagedList";
import { Row } from "@/components/Row/Row";
import { SearchBox } from "@/components/SearchBox/SearchBox";
import PayrollGate from "@/features/payroll/components/PayrollGate/PayrollGate";
import { searchJobTypes } from "@/features/payroll/services/payRateService";
import { JOB_DISCONTINUED, JOB_IN_USE, jobStatus, nextRate, wholeAmount } from "@/features/payroll/utils/payText";
import { addJobType } from "@/features/workforce/services/workforceService";
import { useBusinessPermission } from "@/hooks/useBusinessPermission";
import { usePaged } from "@/hooks/usePaged";
import { isApiError } from "@/services/errors";
import { errorText } from "@/utils/errorText";
import { date, money, parseNumber, todayIso } from "@/utils/format";
import "@/features/payroll/styles/payroll.scss";

type StatusFilter = "inUse" | "discontinued" | "all";

const STATUS_ID: Record<StatusFilter, number | null> = { inUse: JOB_IN_USE, discontinued: JOB_DISCONTINUED, all: null };
const PAGE_SIZE = 20;

export default function PayRatesPage() {
  return <PayrollGate mode="payRules" title="Bảng giá công"><PayRatesContent /></PayrollGate>;
}

/**
 * Bảng giá công (LABOR-11, Kế toán và Chủ HTX): loại việc với tiền công mỗi giờ đang áp dụng hôm nay và giá sắp áp dụng. Tìm
 * theo tên, lọc theo trạng thái; thêm loại việc mới cùng giá đầu tiên (LABOR-11.1).
 */
function PayRatesContent() {
  const navigate = useNavigate();
  const can = useBusinessPermission();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<StatusFilter>("inUse");
  const [adding, setAdding] = useState(false);
  const fetchPage = useCallback(
    (page: number) => searchJobTypes({ search, statusId: STATUS_ID[status], page, pageSize: PAGE_SIZE }),
    [search, status],
  );
  const list = usePaged(fetchPage);

  return (
    <ManagePage
      title="Bảng giá công"
      footer={can("PAY_RULES", "Create") ? <Button fullWidth size="large" onClick={() => setAdding(true)}>Thêm loại việc</Button> : undefined}
    >
      <p className="form__hint">Tiền công tính theo giờ cho từng loại việc. Đổi giá từ một ngày thì giờ công từ ngày đó tính theo giá mới, giờ công trước đó giữ giá cũ.</p>
      <div className="block">
        <SearchBox label="Tìm loại việc" placeholder="Tên loại việc" onSearch={setSearch} />
        <Chips options={[["inUse", "Đang dùng"], ["discontinued", "Ngừng dùng"], ["all", "Tất cả"]]} value={status} onChange={setStatus} />
        <PagedList list={list} unit="loại việc" emptyIcon="zi-list-1" emptyTitle="Không có loại việc nào" emptyText="Thử đổi bộ lọc hoặc từ khóa tìm kiếm.">
          {(job) => {
            const upcoming = nextRate(job.otherRates);
            const st = jobStatus(job.statusId);
            return (
              <Row
                key={job.id}
                title={job.name}
                meta={job.currentRate ? `Từ ${date(job.currentRate.effectiveFrom)}` : upcoming ? `Chưa có giá hôm nay; từ ${date(upcoming.effectiveFrom)} là ${money(upcoming.hourlyRate)} mỗi giờ` : "Chưa có giá"}
                badge={<>
                  {job.statusId !== JOB_IN_USE && <Badge text={st.text} tone={st.tone} />}
                  {upcoming && job.currentRate && <Badge text={`Từ ${date(upcoming.effectiveFrom)}: ${money(upcoming.hourlyRate)}`} tone="warning" />}
                </>}
                value={job.currentRate ? `${money(job.currentRate.hourlyRate)}/giờ` : undefined}
                onClick={() => navigate(`/manage/pay-rates/${job.id}`)}
              />
            );
          }}
        </PagedList>
      </div>
      <AddJobTypeSheet visible={adding} onClose={() => setAdding(false)} onAdded={(id) => navigate(`/manage/pay-rates/${id}`)} />
    </ManagePage>
  );
}

/** LABOR-11.1: loại việc mới với giá đầu tiên. Tên không trùng (không phân biệt hoa thường), giá là số nguyên lớn hơn 0. */
function AddJobTypeSheet({ visible, onClose, onAdded }: { visible: boolean; onClose: () => void; onAdded: (id: string) => void }) {
  const [name, setName] = useState("");
  const [rate, setRate] = useState("");
  const [from, setFrom] = useState(todayIso);
  const [asking, setAsking] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!visible) return;
    setName("");
    setRate("");
    setFrom(todayIso());
    setAsking(false);
    setError("");
  }, [visible]);

  const hourly = wholeAmount(parseNumber(rate));
  const close = () => { if (!busy) onClose(); };
  // Kiểm tra tại chỗ rồi hỏi lại (MSG-LABOR-27) trước khi gửi.
  const ask = () => {
    if (!name.trim() || hourly === null || !from) {
      setError("Nhập tên loại việc, tiền công mỗi giờ (số nguyên lớn hơn 0) và ngày áp dụng.");
      return;
    }
    setError("");
    setAsking(true);
  };
  const save = async () => {
    if (hourly === null) return;
    setBusy(true);
    setError("");
    try {
      const saved = await addJobType({ name: name.trim(), hourlyRate: hourly, effectiveFrom: from });
      onClose();
      onAdded(saved.jobType.id);
    } catch (err) {
      // MSG-GEN-02 (mã cũ MSG03): tên đã có, không phân biệt chữ hoa, chữ thường (BR-LABOR-12).
      setError(isApiError(err, "MSG03") || isApiError(err, "MSG-GEN-02") ? "Đã có loại việc trùng tên này." : errorText(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Sheet visible={visible} onClose={close} autoHeight mask handler maskClosable={!busy} title="Thêm loại việc">
      <div className="sheet-form form">
        {asking ? (
          <p className="payroll-question">Thêm loại việc “{name.trim()}” với tiền công {money(hourly)} mỗi giờ, áp dụng từ ngày {date(from)}?</p>
        ) : (
          <>
            <Input label="Tên loại việc (bắt buộc)" value={name} maxLength={100} disabled={busy} onChange={(e) => setName(e.target.value)} />
            <NumberInput label="Tiền công mỗi giờ, đồng (bắt buộc)" value={rate} onChange={setRate} disabled={busy} helperText="Ví dụ: 40.000" />
            <DateField label="Áp dụng từ ngày (bắt buộc)" value={from} onChange={setFrom} disabled={busy} />
          </>
        )}
        <FormError text={error} />
        <div className="sheet-actions">
          {asking
            ? <Button fullWidth size="large" loading={busy} disabled={busy} onClick={() => void save()}>Có, thêm loại việc</Button>
            : <Button fullWidth size="large" disabled={busy} onClick={ask}>Tiếp tục</Button>}
          <Button fullWidth size="large" variant="secondary" disabled={busy} onClick={asking ? () => { setAsking(false); setError(""); } : close}>
            {asking ? "Sửa lại" : "Không, quay lại"}
          </Button>
        </div>
      </div>
    </Sheet>
  );
}
