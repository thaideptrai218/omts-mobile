import type { OcrOutcome, WaterDetailMode as Mode, WaterDetail, WaterValues } from "@/features/farming/models/WaterMeasurement";
import { useState } from "react";
import { Button, Input, Sheet, useLocation, useNavigate, useParams } from "zmp-ui";

import FormError from "@/components/FormError/FormError";
import { Actions } from "@/components/Actions/Actions";
import { Badge } from "@/components/Badge/Badge";
import { Facts } from "@/components/Facts/Facts";
import { Loadable } from "@/components/Loadable/Loadable";
import { ManagePage } from "@/components/ManagePage/ManagePage";
import { NumberInput } from "@/components/NumberInput/NumberInput";
import { ReasonSheet } from "@/components/ReasonSheet/ReasonSheet";
import { Row } from "@/components/Row/Row";
import { Rows } from "@/components/Rows/Rows";
import { Section } from "@/components/Section/Section";
import { useAction } from "@/hooks/useAction";
import { useLoad } from "@/hooks/useLoad";
import { errorText } from "@/utils/errorText";
import { MESSAGES } from "@/constants/messages";
import { confirmWater, correctWater, getWater, startEditingWater, stopEditingWater, voidWater } from "@/features/farming/services/farmService";
import { absoluteUrl } from "@/services/httpClient";
import { dateTime, fromLocalInput, num, parseNumber, toLocalInput } from "@/utils/format";
import { INPUT_SOURCE, violatedText, WATER_ALERT, waterStatusLabel } from "@/utils/labels";

/** Câu sau tên người đang sửa (MSG58). */
const EDITING_HINT = "Bạn vẫn có thể sửa; khi lưu, nếu số đo đã đổi app sẽ báo để bạn xem bản mới.";

/** Câu đầu sheet xác nhận sau khi đọc ảnh: số là do máy đọc nên người đo phải đối chiếu. */
function ocrNotice(ocr: OcrOutcome | undefined) {
  if (!ocr || ocr.status === "NotCalled") return "";
  if (ocr.status === "Failed") return "Chưa đọc được số từ ảnh. Xem ảnh hoặc máy đo rồi nhập số vào đây.";
  const missing = [!ocr.ph && "độ pH", !ocr.salinity && "độ mặn"].filter(Boolean);
  const uncertain = [ocr.ph?.uncertain && "độ pH", ocr.salinity?.uncertain && "độ mặn"].filter(Boolean);
  return [
    "Đây là số app đọc từ ảnh, hãy đối chiếu với máy đo trước khi xác nhận.",
    missing.length > 0 && `Chưa đọc được ${missing.join(" và ")}.`,
    uncertain.length > 0 && `Kiểm tra kỹ ${uncertain.join(" và ")}: app đọc chưa chắc chắn.`,
  ].filter(Boolean).join(" ");
}

/**
 * Chi tiết một lần đo nước. Vừa chụp máy đo thì mở ngay sheet xác nhận. Bản nháp thì xác nhận; bản đã xác nhận (mới nhất) thì sửa số đo (tạo phiên bản mới,
 * bắt ghi lý do) hoặc hủy. Lịch sử các phiên bản hiện bên dưới.
 */
function WaterDetailPage() {
  const { id = "" } = useParams();
  const navigate = useNavigate();
  const { data, error, reload, setData } = useLoad(() => getWater(id), [id]);
  const { busy, run } = useAction();
  const ocr = (useLocation().state as { ocr?: OcrOutcome } | null)?.ocr;
  const [mode, setMode] = useState<Mode>(ocr ? "confirm" : null);
  const [voidOpen, setVoidOpen] = useState(false);
  const [editNotice, setEditNotice] = useState("");

  const openCorrect = async () => {
    setEditNotice("");
    setMode("correct");
    try {
      const status = await startEditingWater(id);
      const other = status.otherEditors[0];
      if (other) setEditNotice(`${other.name ?? "Một người khác"} đang sửa số đo này từ ${dateTime(other.startedAt)}. ${EDITING_HINT}`);
    } catch {
      // Không báo được trạng thái đang sửa thì vẫn cho sửa; khi lưu, server vẫn chặn ghi đè (MSG06).
    }
  };

  const closeSheet = () => {
    if (mode === "correct") void stopEditingWater(id).catch(() => undefined);
    setMode(null);
  };

  const editable = data?.isLatestVersion && data.statusCode === "CONFIRMED";

  return (
    <ManagePage
      title="Số đo nước"
      footer={
        data?.statusCode === "DRAFT" ? (
          <Button fullWidth size="large" onClick={() => setMode("confirm")}>
            Xác nhận số đo
          </Button>
        ) : undefined
      }
    >
      <Loadable data={data} error={error} reload={() => void reload()}>
        {(m) => {
          const status = waterStatusLabel(m.statusCode);
          const alert = WATER_ALERT[m.alertState];
          const t = m.thresholdsUsed;
          return (
            <>
              {m.alertState === "Active" && (
                <p className="form-error" role="alert">
                  Vượt ngưỡng{m.violatedValues ? `: ${violatedText(m.violatedValues)}` : ""}. Kiểm tra lại nước ở vùng {m.zoneName}.
                </p>
              )}
              {m.photoUrl && <img className="record-photo" src={absoluteUrl(m.photoUrl) ?? undefined} alt="Ảnh máy đo" />}
              <Facts
                items={[
                  ["Vùng nuôi", m.zoneName],
                  ["Thời điểm đo", dateTime(m.measuredAt)],
                  ["Độ pH", num(m.ph)],
                  ["Độ mặn", m.salinity !== null ? num(m.salinity, "‰") : null],
                  ["Trạng thái", <Badge key="s" text={status.text} tone={status.tone} />],
                  ["So với ngưỡng", alert ? <Badge key="a" text={alert.text} tone={alert.tone} /> : null],
                  ["Ngưỡng áp dụng", t ? `pH ${num(t.phMin)} – ${num(t.phMax)} · Độ mặn ${num(t.salinityMin)} – ${num(t.salinityMax)} ‰` : null],
                  ["Cách nhập", INPUT_SOURCE[m.inputSource] ?? m.inputSource],
                  ["App đọc từ ảnh", m.inputSource === "Ocr" && (m.ocrDraft.ph !== null || m.ocrDraft.salinity !== null) ? `pH ${num(m.ocrDraft.ph)} · Độ mặn ${num(m.ocrDraft.salinity)} ‰` : null],
                  ["Điểm đo", m.measurementPoint],
                  ["Người đo", m.measuredBy?.name],
                  ["Người xác nhận", m.confirmedBy?.name ? `${m.confirmedBy.name}${m.confirmedAt ? `, ${dateTime(m.confirmedAt)}` : ""}` : null],
                  ["Lý do sửa", m.correctionReason],
                  ["Lý do hủy", m.voidReason],
                ]}
              />
              {editable && (
                <Actions>
                  <Button variant="secondary" size="large" onClick={() => void openCorrect()}>
                    Sửa số đo
                  </Button>
                  <Button variant="secondary" type="danger" size="large" onClick={() => setVoidOpen(true)}>
                    Hủy số đo
                  </Button>
                </Actions>
              )}
              {!m.isLatestVersion && <p className="screen__note">Đây là phiên bản cũ; số đo đã được sửa ở phiên bản mới hơn.</p>}

              {m.versions.length > 1 && (
                <Section title="Các phiên bản">
                  <Rows>
                    {m.versions.map((v) => (
                      <Row
                        key={v.id}
                        title={`Lần ${v.recordVersion}: pH ${num(v.ph)} · Độ mặn ${num(v.salinity)} ‰`}
                        meta={[dateTime(v.createdAt), v.correctionReason && `Lý do: ${v.correctionReason}`, v.voidReason && `Hủy: ${v.voidReason}`].filter(Boolean).join(" · ")}
                        badge={<Badge {...waterStatusLabel(v.statusCode)} />}
                        onClick={v.id !== m.id ? () => navigate(`/manage/water/${v.id}`, { replace: true }) : undefined}
                      />
                    ))}
                  </Rows>
                </Section>
              )}
            </>
          );
        }}
      </Loadable>

      {data && mode && (mode === "correct" || data.statusCode === "DRAFT") && (
        <ValuesSheet
          key={mode}
          mode={mode}
          measurement={data}
          notice={mode === "confirm" ? ocrNotice(ocr) : editNotice}
          onClose={closeSheet}
          onSave={async (values, reason) => {
            try {
              if (mode === "confirm") {
                const saved = await confirmWater(id, values);
                setData(saved);
              } else {
                const saved = await correctWater(id, values, reason, data.recordVersion);
                void stopEditingWater(id).catch(() => undefined);
                navigate(`/manage/water/${saved.id}`, { replace: true });
              }
              setMode(null);
              return "";
            } catch (err) {
              return errorText(err);
            }
          }}
        />
      )}

      <ReasonSheet
        visible={voidOpen}
        title="Hủy số đo"
        intro="Số đo bị hủy không còn tính vào biểu đồ và cảnh báo. Lịch sử vẫn được giữ."
        confirmText="Hủy số đo"
        required
        danger
        busy={busy}
        onClose={() => setVoidOpen(false)}
        onConfirm={async (reason) => {
          if (!data) return false;
          const saved = await run(() => voidWater(id, reason, data.recordVersion), "Đã hủy số đo.");
          if (saved) setData(saved);
          return !!saved;
        }}
      />
    </ManagePage>
  );
}

/** Sheet nhập lại giá trị: xác nhận bản nháp (có thể chỉnh số trước khi xác nhận) hoặc sửa số đo đã xác nhận. */
function ValuesSheet({
  mode,
  measurement,
  notice,
  onClose,
  onSave,
}: {
  mode: "confirm" | "correct";
  measurement: WaterDetail;
  notice: string;
  onClose: () => void;
  onSave: (values: WaterValues, reason: string) => Promise<string>;
}) {
  const text = (n: number | null) => (n === null ? "" : String(n).replace(".", ","));
  const [measuredAt, setMeasuredAt] = useState(toLocalInput(measurement.measuredAt));
  const [ph, setPh] = useState(text(measurement.ph));
  const [salinity, setSalinity] = useState(text(measurement.salinity));
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const save = async () => {
    if (mode === "correct" && !reason.trim()) {
      setError(MESSAGES.MSG01("Lý do"));
      return;
    }
    setBusy(true);
    setError(await onSave({ measuredAt: fromLocalInput(measuredAt), ph: parseNumber(ph), salinity: parseNumber(salinity) }, reason.trim()));
    setBusy(false);
  };

  return (
    <Sheet visible onClose={onClose} autoHeight mask handler swipeToClose title={mode === "confirm" ? "Xác nhận số đo" : "Sửa số đo"}>
      <div className="sheet-form form">
        {notice && <p className="form__intro">{notice}</p>}
        {mode === "confirm" && measurement.photoUrl && <img className="record-photo" src={absoluteUrl(measurement.photoUrl) ?? undefined} alt="Ảnh máy đo" />}
        <Input label="Thời điểm đo" type={"datetime-local" as never} value={measuredAt} onChange={(e) => setMeasuredAt(e.target.value)} disabled={busy} />
        <NumberInput decimal label="Độ pH" value={ph} onChange={setPh} disabled={busy} />
        <NumberInput decimal label="Độ mặn (‰)" value={salinity} onChange={setSalinity} disabled={busy} />
        {mode === "correct" && <Input.TextArea label="Lý do sửa (bắt buộc)" value={reason} onChange={(e) => setReason(e.target.value)} maxLength={500} showCount disabled={busy} />}
        <FormError text={error} />
        <Button fullWidth size="large" loading={busy} disabled={busy} onClick={() => void save()}>
          {mode === "confirm" ? "Xác nhận" : "Lưu số đo đã sửa"}
        </Button>
      </div>
    </Sheet>
  );
}

export default WaterDetailPage;
