import type { AuditEventDetail } from "@/features/audit/models/AuditEvent";
import { useState } from "react";
import { Button, useNavigate, useParams } from "zmp-ui";

import { Facts } from "@/components/Facts/Facts";
import FormError from "@/components/FormError/FormError";
import { Loadable } from "@/components/Loadable/Loadable";
import { ManagePage } from "@/components/ManagePage/ManagePage";
import { Section } from "@/components/Section/Section";
import { getAuditEvent, openAuditRecord } from "@/features/audit/services/auditService";
import { actionLabel, actorLabel, changesOf, fieldLabel, fieldValueText, recordPath, recordTypeLabel } from "@/features/audit/utils/auditText";
import { useLoad } from "@/hooks/useLoad";
import { isApiError } from "@/services/errors";
import { errorText } from "@/utils/errorText";
import { dateTime } from "@/utils/format";
import "@/features/audit/pages/AuditEventPage.scss";

/** MSG-ACCOUNT-22 (ACCOUNT-10.1.E1), viết lại bằng tiếng Việt: bản ghi đã bị xóa, thao tác vẫn còn trong lịch sử. */
const RECORD_GONE = "Bản ghi này không còn nữa. Thao tác vẫn được giữ trong lịch sử.";

/**
 * Một thao tác trong lịch sử (ACCOUNT-10 bước 5): ai làm, lúc nào, trên bản ghi nào, lý do, và giá trị trước, sau khi đổi.
 * Khi sửa, server chỉ lưu các trường đã đổi. "Mở bản ghi" mở bản ghi như hiện tại nếu app có màn cho loại đó (ACCOUNT-10.1).
 */
export default function AuditEventPage() {
  const { id = "" } = useParams();
  const navigate = useNavigate();
  const event = useLoad(() => getAuditEvent(id), [id]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const openRecord = async (e: AuditEventDetail) => {
    setBusy(true);
    setError("");
    try {
      const record = await openAuditRecord(e.id);
      const path = recordPath(record.recordType, record.recordId, e.action);
      if (path) navigate(path);
    } catch (err) {
      setError(isApiError(err, "MSG-ACCOUNT-22") ? RECORD_GONE : errorText(err));
    } finally {
      setBusy(false);
    }
  };

  const e = event.data;
  const path = e?.recordId ? recordPath(e.recordType, e.recordId, e.action) : null;

  return (
    <ManagePage
      title="Chi tiết thao tác"
      footer={
        e && path ? (
          <Button fullWidth size="large" loading={busy} disabled={busy} onClick={() => void openRecord(e)}>
            Mở bản ghi
          </Button>
        ) : undefined
      }
    >
      <FormError text={error} />
      <Loadable data={e} error={event.error} reload={() => void event.reload()}>
        {(value) => (
          <>
            <Facts
              items={[
                ["Thao tác", actionLabel(value.action)],
                ["Thời điểm", dateTime(value.occurredAt)],
                ["Người thao tác", actorLabel(value.actor)],
                ["Bản ghi", `${recordTypeLabel(value.recordType)}${value.recordCode ? ` ${value.recordCode}` : ""}`],
                ["Lý do", value.reason],
              ]}
            />
            <Changes event={value} />
          </>
        )}
      </Loadable>
    </ManagePage>
  );
}

/** Giá trị khi tạo, trước khi xóa, hoặc trước và sau khi sửa. */
function Changes({ event }: { event: AuditEventDetail }) {
  const changes = changesOf(event.before, event.after);
  if (!changes.length) {
    return (
      <Section title="Giá trị">
        <p className="form__hint">Thao tác này không lưu giá trị trước và sau.</p>
      </Section>
    );
  }
  const mode = event.before === null ? "after" : event.after === null ? "before" : "both";
  const title = mode === "after" ? "Giá trị khi tạo" : mode === "before" ? "Giá trị trước khi đổi" : "Giá trị trước và sau";
  return (
    <Section title={title}>
      <dl className="info info--flat card">
        {changes.map((c) => (
          <div key={c.field}>
            <dt>{fieldLabel(c.field)}</dt>
            <dd>
              {mode === "both" ? (
                <>
                  <span className="audit-change__line">
                    <span className="audit-change__tag">Trước: </span>
                    {fieldValueText(c.field, c.before)}
                  </span>
                  <span className="audit-change__line">
                    <span className="audit-change__tag">Sau: </span>
                    {fieldValueText(c.field, c.after)}
                  </span>
                </>
              ) : (
                fieldValueText(c.field, mode === "after" ? c.after : c.before)
              )}
            </dd>
          </div>
        ))}
      </dl>
    </Section>
  );
}
