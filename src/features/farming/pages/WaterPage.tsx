import type { WaterDateRange, WaterFilter, WaterListItem, WaterPhotoAttempt, WaterView } from "@/features/farming/models/WaterMeasurement";
import { newOperationId } from "@/utils/operationId";
import { useEffect, useState } from "react";
import { Button, Icon, Input, Select, Sheet, useLocation, useNavigate, useSnackbar } from "zmp-ui";

import { ConfirmSheet } from "@/components/ConfirmSheet/ConfirmSheet";
import DateField from "@/components/DateField/DateField";
import FormError from "@/components/FormError/FormError";
import { WaterChart } from "@/features/farming/components/WaterChart/WaterChart";
import { Badge } from "@/components/Badge/Badge";
import { Chips } from "@/components/Chips/Chips";
import { Empty } from "@/components/Empty/Empty";
import { Loadable } from "@/components/Loadable/Loadable";
import { ManagePage } from "@/components/ManagePage/ManagePage";
import { NumberInput } from "@/components/NumberInput/NumberInput";
import { Row } from "@/components/Row/Row";
import { Rows } from "@/components/Rows/Rows";
import { useLoad } from "@/hooks/useLoad";
import { errorText } from "@/utils/errorText";
import { MESSAGES } from "@/constants/messages";
import { listWater, recognizeWater, recordWater, zoneLookup, zoneThresholds } from "@/features/farming/services/farmService";
import { isNetworkError } from "@/services/errors";
import { choosePhoto } from "@/services/zaloService";
import { date, dateTime, fromLocalInput, num, parseNumber, toLocalInput } from "@/utils/format";
import { violatedText, WATER_ALERT, waterStatusLabel } from "@/utils/labels";

import "@/features/farming/pages/WaterPage.scss";

const FILTERS: [WaterFilter, string][] = [
  ["All", "Tất cả"],
  ["Draft", "Nháp"],
  ["Confirmed", "Đã xác nhận"],
  ["Voided", "Đã hủy"],
];

const VIEWS: [WaterView, string][] = [
  ["list", "Số đo"],
  ["chart", "Biểu đồ"],
];

/**
 * Chỉ số nước theo vùng (`/manage/water?zone=<id>`): ngưỡng của vùng, các lần đo mới nhất trước, số đo vượt ngưỡng
 * nổi bật. Lần đo mới: chụp máy đo để app đọc số rồi người đo kiểm tra và xác nhận, hoặc nhập tay.
 */
function WaterPage() {
  const navigate = useNavigate();
  const { openSnackbar } = useSnackbar();
  const initialZone = new URLSearchParams(useLocation().search).get("zone");
  const zones = useLoad(() => zoneLookup(), []);
  const [zoneId, setZoneId] = useState(initialZone ?? "");
  const [filter, setFilter] = useState<WaterFilter>("All");
  const [range, setRange] = useState<WaterDateRange | null>(null);
  const [page, setPage] = useState(1);
  const [items, setItems] = useState<WaterListItem[]>([]);
  const [view, setView] = useState<WaterView>("list");
  const [recordOpen, setRecordOpen] = useState(false);
  const [reading, setReading] = useState(false);
  const [attempt, setAttempt] = useState<WaterPhotoAttempt | null>(null);

  useEffect(() => {
    if (!zoneId && zones.data?.length) setZoneId(zones.data[0].id);
  }, [zoneId, zones.data]);

  const thresholds = useLoad(() => (zoneId ? zoneThresholds(zoneId) : Promise.resolve(null)), [zoneId]);
  const list = useLoad(() => (zoneId ? listWater(zoneId, filter, page, range) : Promise.resolve(null)), [zoneId, filter, page, range]);

  // Trang 1 thay danh sách, các trang sau nối thêm vào cuối.
  useEffect(() => {
    if (!list.data) return;
    setItems((current) => (list.data!.page === 1 ? list.data!.items : [...current, ...list.data!.items]));
  }, [list.data]);

  const send = async (next: WaterPhotoAttempt) => {
    setAttempt(null);
    setReading(true);
    try {
      const { measurement, ocr } = await recognizeWater(next.zoneId, next.photo, next.operationId);
      navigate(`/manage/water/${measurement.id}`, { state: { ocr } });
    } catch (err) {
      if (isNetworkError(err)) setAttempt(next);
      openSnackbar({ text: errorText(err), type: "error", duration: 6000 });
    } finally {
      setReading(false);
    }
  };

  const takePhoto = async () => {
    try {
      const photo = await choosePhoto();
      if (photo) await send({ zoneId, photo, operationId: newOperationId() });
    } catch (err) {
      openSnackbar({ text: err instanceof Error ? err.message : errorText(err), type: "error", duration: 6000 });
    }
  };

  const changeZone = (id: string) => {
    setAttempt(null);
    setPage(1);
    setZoneId(id);
  };
  const changeFilter = (f: WaterFilter) => {
    setPage(1);
    setFilter(f);
  };

  const changeRange = (next: WaterDateRange | null) => {
    setPage(1);
    setRange(next);
  };

  const t = thresholds.data?.thresholds;
  const currentZone = zones.data?.find((z) => z.id === zoneId);

  return (
    <ManagePage
      title="Chỉ số nước"
      footer={
        <div className="sheet-actions">
          <Button fullWidth size="large" prefixIcon={<Icon icon="zi-camera" />} disabled={!zoneId || reading} loading={reading} onClick={() => void (attempt ? send(attempt) : takePhoto())}>
            {reading ? "Đang đọc ảnh" : attempt ? "Gửi lại ảnh" : "Chụp máy đo"}
          </Button>
          <Button fullWidth variant="secondary" size="large" disabled={!zoneId || reading} onClick={() => setRecordOpen(true)}>
            Nhập tay
          </Button>
        </div>
      }
    >
      <Loadable data={zones.data} error={zones.error} reload={() => void zones.reload()}>
        {(list) =>
          list.length === 0 ? (
            <Empty icon="zi-location" title="Chưa có vùng nuôi nào" />
          ) : (
            <div className="form water-field">
              <Select label="Vùng nuôi" value={zoneId} onChange={(v) => changeZone(String(v))} closeOnSelect>
                {list.map((z) => (
                  <Select.Option key={z.id} value={z.id} title={z.name ?? z.code ?? ""} />
                ))}
              </Select>
            </div>
          )
        }
      </Loadable>

      {t && (
        <div className="summary">
          <div className="summary__cell">
            <span className="summary__label">Ngưỡng pH</span>
            <span className="summary__value">{t.phMin === null && t.phMax === null ? "Chưa đặt" : `${num(t.phMin)} – ${num(t.phMax)}`}</span>
          </div>
          <div className="summary__cell">
            <span className="summary__label">Ngưỡng độ mặn</span>
            <span className="summary__value">{t.salinityMin === null && t.salinityMax === null ? "Chưa đặt" : `${num(t.salinityMin)} – ${num(t.salinityMax)} ‰`}</span>
          </div>
        </div>
      )}

      {zoneId && <Chips options={VIEWS} value={view} onChange={setView} />}

      {zoneId && view === "chart" && <WaterChart zoneId={zoneId} />}

      {zoneId && view === "list" && (
        <div className="form water-field">
          <Select label="Trạng thái số đo" value={filter} onChange={(v) => changeFilter(String(v) as WaterFilter)} closeOnSelect>
            {FILTERS.map(([key, label]) => (
              <Select.Option key={key} value={key} title={label} />
            ))}
          </Select>
        </div>
      )}

      {zoneId && view === "list" && <DateRangeFilter value={range} onChange={changeRange} />}

      {zoneId && view === "list" && (
        <Loadable data={list.data && items} error={list.error} reload={() => void list.reload()}>
          {(rows) =>
            rows.length === 0 ? (
              range ? (
                <Empty icon="zi-poll" title="Không có số đo nào trong khoảng ngày này" />
              ) : (
                <Empty icon="zi-poll" title="Không có số đo nào trong 3 tháng gần nhất" text="Chọn khoảng ngày để xem số đo cũ hơn, hoặc chụp máy đo, nhập tay để ghi lần đo mới." />
              )
            ) : (
              <>
                <Rows>
                  {rows.map((m) => {
                    const status = waterStatusLabel(m.statusCode);
                    const alert = WATER_ALERT[m.alertState];
                    return (
                      <Row
                        key={m.id}
                        title={`pH ${num(m.ph)} · Độ mặn ${num(m.salinity)} ‰`}
                        meta={`${dateTime(m.measuredAt)}${m.measuredBy?.name ? ` · ${m.measuredBy.name}` : ""}`}
                        badge={
                          <>
                            {m.statusCode !== "CONFIRMED" && <Badge text={status.text} tone={status.tone} />}
                            {m.alertState === "Active" && alert && <Badge text={`${alert.text}${m.violatedValues ? `: ${violatedText(m.violatedValues)}` : ""}`} tone="danger" />}
                          </>
                        }
                        onClick={() => navigate(`/manage/water/${m.id}`)}
                      />
                    );
                  })}
                </Rows>
                {list.data && rows.length < list.data.total && (
                  <Button className="more" fullWidth variant="secondary" size="large" onClick={() => setPage((p) => p + 1)}>
                    Xem thêm
                  </Button>
                )}
              </>
            )
          }
        </Loadable>
      )}

      {zoneId && (
        <RecordSheet
          visible={recordOpen}
          zoneId={zoneId}
          zoneName={currentZone?.name ?? currentZone?.code ?? ""}
          onClose={() => setRecordOpen(false)}
          onSaved={(id) => {
            setRecordOpen(false);
            navigate(`/manage/water/${id}`);
          }}
        />
      )}
    </ManagePage>
  );
}

/** Lọc số đo theo khoảng ngày. Chưa chọn thì là 3 tháng gần nhất, theo mặc định của backend. */
function DateRangeFilter({ value, onChange }: { value: WaterDateRange | null; onChange: (next: WaterDateRange | null) => void }) {
  const [open, setOpen] = useState(false);
  const [from, setFrom] = useState<string | null>(null);
  const [to, setTo] = useState<string | null>(null);
  const [error, setError] = useState("");

  const start = () => {
    setFrom(value?.from ?? null);
    setTo(value?.to ?? null);
    setError("");
    setOpen(true);
  };

  const apply = () => {
    if (!from || !to) {
      setError("Vui lòng chọn đủ từ ngày và đến ngày.");
      return;
    }
    if (from > to) {
      setError("Từ ngày không được sau đến ngày.");
      return;
    }
    onChange({ from, to });
    setOpen(false);
  };

  if (!open) {
    return (
      <div className="date-range">
        <Rows>
          <Row title="Khoảng ngày" meta={value ? `${date(value.from)} – ${date(value.to)}` : "3 tháng gần nhất"} onClick={start} />
        </Rows>
      </div>
    );
  }

  return (
    <div className="card form date-range">
      <DateField label="Từ ngày" value={from} onChange={setFrom} />
      <DateField label="Đến ngày" value={to} onChange={setTo} />
      <FormError text={error} />
      <div className="sheet-actions">
        <Button fullWidth size="large" onClick={apply}>
          Áp dụng
        </Button>
        <Button
          fullWidth
          variant="secondary"
          size="large"
          onClick={() => {
            onChange(null);
            setOpen(false);
          }}
        >
          Bỏ lọc
        </Button>
      </div>
    </div>
  );
}

/**
 * Nhập tay một lần đo. "Lưu và xác nhận" ghi số đo chính thức (vượt ngưỡng thì gửi cảnh báo ngay);
 * "Lưu nháp" để người khác kiểm tra rồi xác nhận sau. Mã thao tác giữ nguyên cho tới khi lưu xong để bấm lại
 * sau lỗi mạng không tạo bản ghi trùng.
 */
function RecordSheet({ visible, zoneId, zoneName, onClose, onSaved }: { visible: boolean; zoneId: string; zoneName: string; onClose: () => void; onSaved: (id: string) => void }) {
  const [measuredAt, setMeasuredAt] = useState(toLocalInput());
  const [ph, setPh] = useState("");
  const [salinity, setSalinity] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [operationId, setOperationId] = useState(newOperationId);
  const [confirmOpen, setConfirmOpen] = useState(false);

  useEffect(() => {
    if (visible) setMeasuredAt(toLocalInput());
  }, [visible]);

  const save = async (confirm: boolean) => {
    const values = { measuredAt: fromLocalInput(measuredAt), ph: parseNumber(ph), salinity: parseNumber(salinity) };
    if (values.ph === null && values.salinity === null) {
      setError(MESSAGES.MSG01("Độ pH hoặc độ mặn"));
      return;
    }
    setBusy(true);
    setError("");
    try {
      const saved = await recordWater(zoneId, values, confirm, operationId);
      setOperationId(newOperationId());
      setPh("");
      setSalinity("");
      onSaved(saved.id);
    } catch (err) {
      setError(errorText(err));
    } finally {
      setBusy(false);
    }
  };

  // Thiếu cả hai số thì để `save` báo lỗi như cũ, không mở hộp xác nhận rỗng.
  const askConfirm = () => {
    if (parseNumber(ph) === null && parseNumber(salinity) === null) {
      void save(true);
      return;
    }
    setError("");
    setConfirmOpen(true);
  };

  // Lỗi từ server hiện ở sheet nhập số, nên đóng hộp xác nhận khi `save` xong.
  const confirmSave = async () => {
    await save(true);
    setConfirmOpen(false);
  };

  const shown = (text: string, unit?: string) => {
    const value = parseNumber(text);
    return value === null ? "Không nhập" : num(value, unit);
  };

  return (
    <>
      {/* Hai sheet đổi chỗ cho nhau, không chồng lên nhau; số đã nhập vẫn giữ khi quay lại. */}
      <Sheet visible={visible && !confirmOpen} onClose={onClose} autoHeight mask handler swipeToClose title="Nhập số đo nước">
        <div className="sheet-form form">
          <Input label="Thời điểm đo" type={"datetime-local" as never} value={measuredAt} onChange={(e) => setMeasuredAt(e.target.value)} disabled={busy} />
          <p className="form__hint">Nhập ít nhất một trong hai số: độ pH hoặc độ mặn.</p>
          <NumberInput decimal label="Độ pH" value={ph} onChange={setPh} disabled={busy} />
          <NumberInput decimal label="Độ mặn (‰)" value={salinity} onChange={setSalinity} disabled={busy} />
          <FormError text={error} />
          <div className="sheet-actions">
            <Button fullWidth size="large" disabled={busy} onClick={askConfirm}>
              Lưu và xác nhận
            </Button>
            <Button fullWidth variant="secondary" size="large" loading={busy} disabled={busy} onClick={() => void save(false)}>
              Lưu nháp
            </Button>
          </div>
        </div>
      </Sheet>
      <ConfirmSheet
        visible={visible && confirmOpen}
        title="Xác nhận số đo nước"
        message={
          <>
            <p>Số đo sau sẽ được ghi chính thức{zoneName ? ` cho vùng ${zoneName}` : ""}:</p>
            <p>Thời điểm đo: {measuredAt ? dateTime(fromLocalInput(measuredAt)) : "—"}</p>
            <p>Độ pH: {shown(ph)}</p>
            <p>Độ mặn: {shown(salinity, "‰")}</p>
            <p>Nếu số đo vượt ngưỡng, app sẽ gửi cảnh báo ngay.</p>
          </>
        }
        confirmText="Lưu và xác nhận"
        busy={busy}
        onClose={() => setConfirmOpen(false)}
        onConfirm={() => void confirmSave()}
      />
    </>
  );
}

export default WaterPage;
