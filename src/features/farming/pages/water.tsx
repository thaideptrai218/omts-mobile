import { newOperationId } from "@/shared/lib/operation-id";
import { useEffect, useState } from "react";
import { Button, Icon, Input, Sheet, useLocation, useNavigate } from "zmp-ui";

import FormError from "@/shared/ui/form-error";
import { Badge, Chips, Empty, Loadable, ManagePage, NumberInput, Row, Rows } from "@/shared/ui/ui";
import { useLoad } from "@/shared/hooks/use-load";
import { errorText, MESSAGES } from "@/shared/lib/messages";
import { listWater, recordWater, WaterFilter, WaterListItem, zoneLookup, zoneThresholds } from "@/features/farming/api/farm";
import { dateTime, fromLocalInput, num, parseNumber, toLocalInput } from "@/shared/lib/format";
import { violatedText, WATER_ALERT, waterStatusLabel } from "@/shared/lib/labels";

const FILTERS: [WaterFilter, string][] = [
  ["All", "Tất cả"],
  ["Draft", "Nháp"],
  ["Confirmed", "Đã xác nhận"],
  ["Voided", "Đã hủy"],
];

/**
 * Chỉ số nước theo vùng (`/manage/water?zone=<id>`): ngưỡng của vùng, các lần đo mới nhất trước, số đo vượt ngưỡng
 * nổi bật. Nhập tay một lần đo mới ở nút dưới cùng. Đọc số từ ảnh máy đo (OCR) chưa làm trên mobile.
 */
function WaterPage() {
  const navigate = useNavigate();
  const initialZone = new URLSearchParams(useLocation().search).get("zone");
  const zones = useLoad(() => zoneLookup(), []);
  const [zoneId, setZoneId] = useState(initialZone ?? "");
  const [filter, setFilter] = useState<WaterFilter>("All");
  const [page, setPage] = useState(1);
  const [items, setItems] = useState<WaterListItem[]>([]);
  const [recordOpen, setRecordOpen] = useState(false);

  useEffect(() => {
    if (!zoneId && zones.data?.length) setZoneId(zones.data[0].id);
  }, [zoneId, zones.data]);

  const thresholds = useLoad(() => (zoneId ? zoneThresholds(zoneId) : Promise.resolve(null)), [zoneId]);
  const list = useLoad(() => (zoneId ? listWater(zoneId, filter, page) : Promise.resolve(null)), [zoneId, filter, page]);

  // Trang 1 thay danh sách, các trang sau nối thêm vào cuối.
  useEffect(() => {
    if (!list.data) return;
    setItems((current) => (list.data!.page === 1 ? list.data!.items : [...current, ...list.data!.items]));
  }, [list.data]);

  const changeZone = (id: string) => {
    setPage(1);
    setZoneId(id);
  };
  const changeFilter = (f: WaterFilter) => {
    setPage(1);
    setFilter(f);
  };

  const t = thresholds.data?.thresholds;

  return (
    <ManagePage
      title="Chỉ số nước"
      footer={
        <Button fullWidth size="large" prefixIcon={<Icon icon="zi-plus" />} disabled={!zoneId} onClick={() => setRecordOpen(true)}>
          Nhập số đo
        </Button>
      }
    >
      <Loadable data={zones.data} error={zones.error} reload={() => void zones.reload()}>
        {(list) =>
          list.length === 0 ? (
            <Empty icon="zi-location" title="Chưa có vùng nuôi nào" />
          ) : (
            <Chips options={list.map((z) => [z.id, z.name ?? z.code ?? ""] as [string, string])} value={zoneId} onChange={changeZone} />
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

      {zoneId && <Chips options={FILTERS} value={filter} onChange={changeFilter} />}

      {zoneId && (
        <Loadable data={list.data && items} error={list.error} reload={() => void list.reload()}>
          {(rows) =>
            rows.length === 0 ? (
              <Empty icon="zi-poll" title="Chưa có số đo nào" text="Bấm “Nhập số đo” để ghi lần đo đầu tiên của vùng này." />
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

/**
 * Nhập tay một lần đo. "Lưu và xác nhận" ghi số đo chính thức (vượt ngưỡng thì gửi cảnh báo ngay);
 * "Lưu nháp" để người khác kiểm tra rồi xác nhận sau. Mã thao tác giữ nguyên cho tới khi lưu xong để bấm lại
 * sau lỗi mạng không tạo bản ghi trùng.
 */
function RecordSheet({ visible, zoneId, onClose, onSaved }: { visible: boolean; zoneId: string; onClose: () => void; onSaved: (id: string) => void }) {
  const [measuredAt, setMeasuredAt] = useState(toLocalInput());
  const [ph, setPh] = useState("");
  const [salinity, setSalinity] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [operationId, setOperationId] = useState(newOperationId);

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

  return (
    <Sheet visible={visible} onClose={onClose} autoHeight mask handler swipeToClose title="Nhập số đo nước">
      <div className="sheet-form form">
        <Input label="Thời điểm đo" type={"datetime-local" as never} value={measuredAt} onChange={(e) => setMeasuredAt(e.target.value)} disabled={busy} />
        <div className="two-col">
          <NumberInput decimal label="Độ pH" value={ph} onChange={setPh} disabled={busy} />
          <NumberInput decimal label="Độ mặn (‰)" value={salinity} onChange={setSalinity} disabled={busy} />
        </div>
        <FormError text={error} />
        <div className="two-col">
          <Button variant="secondary" size="large" disabled={busy} onClick={() => void save(false)}>
            Lưu nháp
          </Button>
          <Button size="large" loading={busy} disabled={busy} onClick={() => void save(true)}>
            Lưu và xác nhận
          </Button>
        </div>
      </div>
    </Sheet>
  );
}

export default WaterPage;
