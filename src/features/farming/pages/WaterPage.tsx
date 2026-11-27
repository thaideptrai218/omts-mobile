import type { WaterCrop, WaterDateRange, WaterDraft, WaterFilter, WaterListItem, WaterPhotoAttempt, WaterView } from "@/features/farming/models/WaterMeasurement";
import type { PhotoSource } from "@/models/Zalo";
import { useEffect, useRef, useState } from "react";
import { Button, Icon, Select, useLocation, useNavigate, useSnackbar } from "zmp-ui";

import { Badge } from "@/components/Badge/Badge";
import { Chips } from "@/components/Chips/Chips";
import DateField from "@/components/DateField/DateField";
import { Empty } from "@/components/Empty/Empty";
import FormError from "@/components/FormError/FormError";
import { Loadable } from "@/components/Loadable/Loadable";
import { ManagePage } from "@/components/ManagePage/ManagePage";
import { Row } from "@/components/Row/Row";
import { Rows } from "@/components/Rows/Rows";
import { Section } from "@/components/Section/Section";
import { useLoad } from "@/hooks/useLoad";
import { isNetworkError } from "@/services/errors";
import { choosePhoto } from "@/services/zaloService";
import { errorText } from "@/utils/errorText";
import { date, dateTime, num } from "@/utils/format";
import { violatedText, WATER_ALERT, waterStatusLabel } from "@/utils/labels";
import { evidencePhoto } from "@/utils/imageFile";
import { newOperationId } from "@/utils/operationId";
import { DisplayFrame } from "@/features/farming/components/DisplayFrame/DisplayFrame";
import { WaterChart } from "@/features/farming/components/WaterChart/WaterChart";
import { WaterValuesForm } from "@/features/farming/components/WaterValuesForm/WaterValuesForm";
import { listWater, recognizeWater, recordWater, waterOverview, zoneLookup, zoneThresholds } from "@/features/farming/services/farmService";
import { ocrNotice, outsideText, rangeText } from "@/features/farming/utils/waterText";

import "@/features/farming/pages/WaterPage.scss";

const FILTERS: [WaterFilter, string][] = [
  ["All", "Tất cả"],
  ["Active", "Đang hiệu lực"],
  ["Voided", "Đã hủy"],
];

const VIEWS: [WaterView, string][] = [
  ["list", "Số đo"],
  ["chart", "Biểu đồ"],
];

/** Tiêu đề khối ghi số đo theo từng bước sau khi chụp. */
const CAPTURE_TITLES = {
  frame: "Bước 1. Chọn màn hình số",
  reading: "Bước 2. Đọc số trên ảnh",
  retry: "Bước 2. Gửi lại ảnh",
  values: "Bước 3. Kiểm tra và lưu số đo",
} as const;

/**
 * Chỉ số nước theo vùng (`/manage/water?zone=<id>`), WATER-01 và WATER-03. Đầu trang là ô chọn vùng nuôi; Chủ HTX và Quản lý
 * vùng thấy thêm lần đo mới nhất và cảnh báo (tổng quan WATER-03) ngay trong tên vùng và dưới ô chọn. Lần đo mới: chụp máy đo
 * (ảnh bắt buộc), kéo khung vào màn hình số, app đọc số gợi ý, người đo chọn bè, kiểm tra và sửa số rồi lưu; đọc ảnh không
 * được thì nhập tay cả ba số. Các bước sau khi chụp hiện thành một khối ngay trong trang, dưới ngưỡng của vùng, không mở sheet
 * đè lên màn: sheet có ô nhập dễ bị bàn phím đẩy lệch và lỡ tay vuốt đóng mất số đang nhập.
 */
function WaterPage() {
  const navigate = useNavigate();
  const { openSnackbar } = useSnackbar();
  const initialZone = new URLSearchParams(useLocation().search).get("zone");
  const zones = useLoad(() => zoneLookup(), []);
  // Tổng quan chỉ Chủ HTX và Quản lý vùng đọc được; người khác nhận 403 thì bỏ qua, không báo lỗi.
  const overview = useLoad(() => waterOverview(true).catch(() => null), []);
  const [zoneId, setZoneId] = useState(initialZone ?? "");
  const [filter, setFilter] = useState<WaterFilter>("All");
  const [range, setRange] = useState<WaterDateRange | null>(null);
  const [page, setPage] = useState(1);
  const [items, setItems] = useState<WaterListItem[]>([]);
  // Tổng số đo của bộ lọc, giữ lại trong lúc tải trang sau để nút "Xem thêm" không biến mất.
  const [total, setTotal] = useState(0);
  const [view, setView] = useState<WaterView>("list");
  const [reading, setReading] = useState(false);
  const [attempt, setAttempt] = useState<WaterPhotoAttempt | null>(null);
  // Ảnh vừa chụp, đang chờ người đo kéo khung vào màn hình số.
  const [framing, setFraming] = useState<Blob | null>(null);
  const [draft, setDraft] = useState<WaterDraft | null>(null);
  // Một mã cho một lần ghi: gửi lại sau lỗi mạng không ghi trùng.
  const [operationId, setOperationId] = useState(newOperationId);
  const captureRef = useRef<HTMLDivElement>(null);

  // Người đo tự chọn vùng; chỉ có một vùng thì chọn sẵn vùng đó.
  useEffect(() => {
    if (!zoneId && zones.data?.length === 1) setZoneId(zones.data[0].id);
  }, [zoneId, zones.data]);

  // Bước hiện tại của lần đo đang ghi, null khi chưa chụp.
  const step = draft ? "values" : attempt ? "retry" : reading ? "reading" : framing ? "frame" : null;

  // Mỗi khi sang bước mới, cuộn tới khối ghi số đo để người đo thấy ngay, không phải tự tìm bên dưới.
  useEffect(() => {
    if (step) captureRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [step]);

  const thresholds = useLoad(() => (zoneId ? zoneThresholds(zoneId) : Promise.resolve(null)), [zoneId]);
  const list = useLoad(() => (zoneId ? listWater(zoneId, filter, page, range) : Promise.resolve(null)), [zoneId, filter, page, range]);

  // Trang 1 thay danh sách, các trang sau nối thêm vào cuối.
  useEffect(() => {
    if (!list.data) return;
    setItems((current) => (list.data!.page === 1 ? list.data!.items : [...current, ...list.data!.items]));
    setTotal(list.data.total);
  }, [list.data]);
  // Đang tải hoặc tải lỗi một trang sau trang 1: các dòng đã hiện vẫn giữ nguyên, chỉ nút "Xem thêm" đổi trạng thái.
  const loadingMore = page > 1 && !list.data && !list.error;
  const moreError = page > 1 && !list.data ? list.error : "";

  const send = async (next: WaterPhotoAttempt) => {
    setAttempt(null);
    setReading(true);
    try {
      const recognition = await recognizeWater(next.zoneId, next.photo, next.crop);
      setOperationId(newOperationId());
      setDraft({ zoneId: next.zoneId, recognition });
    } catch (err) {
      if (isNetworkError(err)) setAttempt(next);
      openSnackbar({ text: errorText(err), type: "error", duration: 6000 });
    } finally {
      setReading(false);
    }
  };

  // Chạm một lần mở thẳng camera sau; "Chọn ảnh có sẵn" mở thư viện. Ảnh gốc giữ làm bằng chứng, chỉ thu nhỏ khi quá 10 MB.
  const takePhoto = async (source: PhotoSource = "camera") => {
    try {
      const photo = await choosePhoto([source]);
      if (photo) setFraming(await evidencePhoto(photo));
    } catch (err) {
      openSnackbar({ text: err instanceof Error ? err.message : errorText(err), type: "error", duration: 6000 });
    }
  };

  const readFramed = (crop: WaterCrop | null) => {
    const photo = framing;
    setFraming(null);
    if (photo) void send({ zoneId, photo, crop });
  };

  // Bỏ lần đo đang ghi (ảnh, khung, số đang nhập), trang về như trước khi chụp.
  const cancelCapture = () => {
    setFraming(null);
    setAttempt(null);
    setDraft(null);
  };

  const changeZone = (id: string) => {
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
  const ocr = draft?.recognition.ocr;
  // Lần đo mới nhất và cảnh báo của vùng đang chọn; chỉ Chủ HTX và Quản lý vùng có.
  const status = overview.data?.find((z) => z.zoneId === zoneId);
  const alertZones = new Set(overview.data?.filter((z) => z.hasWaterAlert).map((z) => z.zoneId));

  return (
    <ManagePage
      title="Chỉ số nước"
      footer={
        step ? undefined : (
          <div className="sheet-actions">
            <Button fullWidth size="large" prefixIcon={<Icon icon="zi-camera" />} disabled={!zoneId} onClick={() => void takePhoto()}>
              Chụp máy đo để ghi số đo
            </Button>
            <Button fullWidth variant="tertiary" disabled={!zoneId} onClick={() => void takePhoto("album")}>
              Chọn ảnh có sẵn
            </Button>
          </div>
        )
      }
    >
      <Loadable data={zones.data} error={zones.error} reload={() => void zones.reload()}>
        {(list) =>
          list.length === 0 ? (
            <Empty icon="zi-location" title="Chưa có vùng nuôi nào" />
          ) : (
            <div className="form water-field">
              <Select
                label="Vùng nuôi"
                placeholder="Chọn vùng nuôi"
                value={zoneId || undefined}
                onChange={(v) => changeZone(String(v))}
                closeOnSelect
                disabled={!!step}
                helperText={step ? "Đang ghi số đo cho vùng này. Lưu hoặc hủy lần đo để đổi vùng." : undefined}
              >
                {list.map((z) => {
                  const name = z.name ?? z.code ?? "";
                  return <Select.Option key={z.id} value={z.id} title={alertZones.has(z.id) ? `${name} · Vượt ngưỡng` : name} />;
                })}
              </Select>
            </div>
          )
        }
      </Loadable>

      {zones.data && zones.data.length > 0 && !zoneId && (
        <Empty icon="zi-location" title="Chọn vùng nuôi" text="Chọn vùng ở ô phía trên để xem số đo và chụp máy đo ghi lần đo mới." />
      )}

      {status && (
        <div className="water-field">
          <Rows>
            <Row
              title="Lần đo gần nhất"
              meta={status.latestMeasuredAt ? dateTime(status.latestMeasuredAt) : "Chưa có lần đo nào"}
              badge={status.hasWaterAlert ? <Badge text={status.valuesOutside.map(outsideText).join("; ") || "Vượt ngưỡng"} tone="danger" /> : undefined}
            />
          </Rows>
        </div>
      )}

      {t && (
        <div className="summary water-thresholds">
          <div className="summary__cell">
            <span className="summary__label">Ngưỡng pH</span>
            <span className="summary__value">{rangeText(t.phMin, t.phMax)}</span>
          </div>
          <div className="summary__cell">
            <span className="summary__label">Ngưỡng độ mặn</span>
            <span className="summary__value">{rangeText(t.salinityMin, t.salinityMax, "‰")}</span>
          </div>
          <div className="summary__cell">
            <span className="summary__label">Ngưỡng nhiệt độ</span>
            <span className="summary__value">{rangeText(t.temperatureMin, t.temperatureMax, "°C")}</span>
          </div>
        </div>
      )}

      {step && (
        <div className="water-capture" ref={captureRef}>
          <Section title={CAPTURE_TITLES[step]}>
            <div className="card">
              {step === "frame" && framing && <DisplayFrame photo={framing} onRead={readFramed} onRetake={() => void takePhoto()} onCancel={cancelCapture} />}

              {step === "reading" && (
                <div className="form" role="status">
                  <p className="form__intro">App đang đọc số trên ảnh máy đo, vui lòng chờ trong giây lát.</p>
                  <Button fullWidth size="large" loading disabled>
                    Đang đọc ảnh
                  </Button>
                </div>
              )}

              {step === "retry" && attempt && (
                <div className="form">
                  <p className="form__intro">Chưa gửi được ảnh lên máy chủ. Ảnh vẫn còn trên máy, kiểm tra kết nối mạng rồi gửi lại.</p>
                  <div className="sheet-actions">
                    <Button fullWidth size="large" onClick={() => void send(attempt)}>
                      Gửi lại ảnh
                    </Button>
                    <Button fullWidth variant="tertiary" size="large" onClick={cancelCapture}>
                      Hủy lần đo này
                    </Button>
                  </div>
                </div>
              )}

              {step === "values" && draft && ocr && (
                <WaterValuesForm
                  key={draft.recognition.photoKey}
                  zoneId={draft.zoneId}
                  initial={{
                    measuredAt: ocr.measuredAt?.value ?? draft.recognition.measuredAt,
                    ph: ocr.ph?.value,
                    salinity: ocr.salinity?.value,
                    temperature: ocr.temperature?.value,
                  }}
                  notice={ocrNotice(ocr)}
                  thresholds={t}
                  saveText="Lưu số đo"
                  cancelText="Hủy lần đo này"
                  onCancel={cancelCapture}
                  onSave={async (values) => {
                    const saved = await recordWater(draft.zoneId, { ...values, photoKey: draft.recognition.photoKey, clientOperationId: operationId });
                    setDraft(null);
                    openSnackbar({ text: saved.alertState === "Active" ? "Đã lưu số đo. Số đo vượt ngưỡng, app đã gửi cảnh báo." : "Đã lưu số đo.", type: "success", duration: 5000 });
                    navigate(`/manage/water/${saved.id}`);
                  }}
                />
              )}
            </div>
          </Section>
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
        // Khung chờ chỉ hiện khi tải trang 1; trang sau thì danh sách đã tải vẫn giữ nguyên.
        <Loadable data={page === 1 ? list.data && items : items} error={list.error} reload={() => void list.reload()}>
          {(rows) =>
            rows.length === 0 ? (
              range ? (
                <Empty icon="zi-poll" title="Không có số đo nào trong khoảng ngày này" />
              ) : (
                <Empty icon="zi-poll" title="Không có số đo nào trong 3 tháng gần nhất" text="Chọn khoảng ngày để xem số đo cũ hơn, hoặc chụp máy đo để ghi lần đo mới." />
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
                        title={`Bè ${m.raftCode} · pH ${num(m.ph)} · mặn ${num(m.salinity, "‰")} · ${num(m.temperature, "°C")}`}
                        meta={`${dateTime(m.measuredAt)}${m.measuredBy?.name ? ` · ${m.measuredBy.name}` : ""}${m.voidReason ? ` · Hủy: ${m.voidReason}` : ""}`}
                        badge={
                          <>
                            {m.statusCode !== "ACTIVE" && <Badge text={status.text} tone={status.tone} />}
                            {m.alertState === "Active" && alert && <Badge text={`${alert.text}${m.violatedValues ? `: ${violatedText(m.violatedValues)}` : ""}`} tone="danger" />}
                          </>
                        }
                        onClick={() => navigate(`/manage/water/${m.id}`)}
                      />
                    );
                  })}
                </Rows>
                {moreError && (
                  <div className="more">
                    <FormError text={moreError} />
                  </div>
                )}
                {rows.length < total && (
                  <Button
                    className="more"
                    fullWidth
                    variant="secondary"
                    size="large"
                    loading={loadingMore}
                    disabled={loadingMore}
                    onClick={() => (moreError ? void list.reload() : setPage((p) => p + 1))}
                  >
                    {loadingMore ? "Đang tải thêm" : moreError ? "Thử tải thêm" : "Xem thêm"}
                  </Button>
                )}
              </>
            )
          }
        </Loadable>
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
        {/* Đóng khung chọn ngày, giữ nguyên khoảng ngày đang lọc. */}
        <Button fullWidth variant="secondary" size="large" onClick={() => setOpen(false)}>
          Quay lại
        </Button>
      </div>
    </div>
  );
}

export default WaterPage;
