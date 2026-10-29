import { useState } from "react";
import { Button, Input, Sheet, useNavigate, useParams } from "zmp-ui";

import FormError from "@/components/form-error";
import { Actions, Badge, Facts, Loadable, ManagePage, NumberInput, ReasonSheet, Row, Rows, Section } from "@/components/manage/ui";
import { useAction } from "@/hooks/use-action";
import { useLoad } from "@/hooks/use-load";
import { errorText, MESSAGES } from "@/services/acs/messages";
import { confirmWater, correctWater, getWater, startEditingWater, stopEditingWater, voidWater, WaterDetail, WaterValues } from "@/services/farm";
import { dateTime, fromLocalInput, num, parseNumber, toLocalInput } from "@/services/format";
import { INPUT_SOURCE, violatedText, WATER_ALERT, waterStatusLabel } from "@/services/labels";

type Mode = "confirm" | "correct" | null;

/** Câu sau tên người đang sửa (MSG58). */
const EDITING_HINT = "Bạn vẫn có thể sửa; khi lưu, nếu số đo đã đổi app sẽ báo để bạn xem bản mới.";

/**
 * Chi tiết một lần đo nước. Bản nháp thì xác nhận; bản đã xác nhận (mới nhất) thì sửa số đo (tạo phiên bản mới,
 * bắt ghi lý do) hoặc hủy. Lịch sử các phiên bản hiện bên dưới.
 */
function WaterDetailPage() {
  const { id = "" } = useParams();
  const navigate = useNavigate();
  const { data, error, reload, setData } = useLoad(() => getWater(id), [id]);
  const { busy, run } = useAction();
  const [mode, setMode] = useState<Mode>(null);
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
    <ManagePage title="Số đo nước">
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
                  ["Điểm đo", m.measurementPoint],
                  ["Người đo", m.measuredBy?.name],
                  ["Người xác nhận", m.confirmedBy?.name ? `${m.confirmedBy.name}${m.confirmedAt ? `, ${dateTime(m.confirmedAt)}` : ""}` : null],
                  ["Lý do sửa", m.correctionReason],
                  ["Lý do hủy", m.voidReason],
                ]}
              />
              {m.statusCode === "DRAFT" && (
                <Actions>
                  <Button size="large" onClick={() => setMode("confirm")}>
                    Xác nhận số đo
                  </Button>
                </Actions>
              )}
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

      {data && mode && (
        <ValuesSheet
          key={mode}
          mode={mode}
          measurement={data}
          notice={editNotice}
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
        <Input label="Thời điểm đo" type={"datetime-local" as never} value={measuredAt} onChange={(e) => setMeasuredAt(e.target.value)} disabled={busy} />
        <div className="two-col">
          <NumberInput decimal label="Độ pH" value={ph} onChange={setPh} disabled={busy} />
          <NumberInput decimal label="Độ mặn (‰)" value={salinity} onChange={setSalinity} disabled={busy} />
        </div>
        {mode === "correct" && <Input.TextArea label="Lý do sửa" value={reason} onChange={(e) => setReason(e.target.value)} maxLength={500} showCount disabled={busy} />}
        <FormError text={error} />
        <Button fullWidth size="large" loading={busy} disabled={busy} onClick={() => void save()}>
          {mode === "confirm" ? "Xác nhận" : "Lưu số đo đã sửa"}
        </Button>
      </div>
    </Sheet>
  );
}

export default WaterDetailPage;
