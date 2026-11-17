import type { AuditEventFacets, AuditFilter, AuditPeriod } from "@/features/audit/models/AuditEvent";
import type { ZoneLookupItem } from "@/features/farming/models/Zone";
import { useCallback, useState } from "react";
import { Button, Input, Select, useNavigate } from "zmp-ui";

import DateField from "@/components/DateField/DateField";
import FormError from "@/components/FormError/FormError";
import { ManagePage } from "@/components/ManagePage/ManagePage";
import PagedList from "@/components/PagedList/PagedList";
import { Row } from "@/components/Row/Row";
import { Rows } from "@/components/Rows/Rows";
import { AUDIT_LIMITS, auditFacets, auditFilterError, EMPTY_AUDIT_FILTER, searchAudit } from "@/features/audit/services/auditService";
import { actionLabel, actorLabel, recordTypeLabel } from "@/features/audit/utils/auditText";
import { zoneLookup } from "@/features/farming/services/farmService";
import { useLoad } from "@/hooks/useLoad";
import { usePaged } from "@/hooks/usePaged";
import { date, dateTime } from "@/utils/format";

/**
 * Lịch sử thao tác (ACCOUNT-10), chỉ Chủ HTX (BR-ACCOUNT-13): ai đã làm gì, khi nào, mới nhất trước. Mặc định 30 ngày gần
 * nhất; lọc theo khoảng ngày, một người (tài khoản, nhân viên hoặc hệ thống), loại bản ghi, thao tác, vùng và mã bản ghi.
 * Chỉ đọc: thao tác không sửa hay xóa được.
 */
export default function AuditLogPage() {
  const navigate = useNavigate();
  const [filter, setFilter] = useState<AuditFilter>(EMPTY_AUDIT_FILTER);
  const [period, setPeriod] = useState<AuditPeriod | null>(null);
  const [editing, setEditing] = useState(false);
  const facets = useLoad(auditFacets, []);
  const zones = useLoad(() => zoneLookup(true), []);

  const fetchPage = useCallback(
    async (page: number) => {
      const result = await searchAudit(filter, page);
      setPeriod({ from: result.from, to: result.to });
      return result.page;
    },
    [filter],
  );
  const list = usePaged(fetchPage);

  const others = [filter.person, filter.action, filter.recordType, filter.zoneId, filter.recordCode.trim()].filter(Boolean).length;
  const periodText = period ? `${date(period.from)} – ${date(period.to)}` : "30 ngày gần nhất";

  return (
    <ManagePage title="Lịch sử thao tác">
      {editing ? (
        <FilterForm
          value={filter}
          facets={facets.data}
          zones={zones.data}
          onApply={(next) => {
            setFilter(next);
            setEditing(false);
          }}
          onClose={() => setEditing(false)}
        />
      ) : (
        <div className="date-range">
          <Rows>
            <Row title="Bộ lọc" meta={`${periodText}${others ? ` · thêm ${others} điều kiện` : ""}`} onClick={() => setEditing(true)} />
          </Rows>
        </div>
      )}
      <PagedList
        list={list}
        unit="thao tác"
        emptyIcon="zi-file"
        emptyTitle="Không có thao tác nào"
        emptyText="Không có thao tác nào khớp khoảng ngày và bộ lọc đã chọn. Hãy chọn lại."
      >
        {(e) => (
          <Row
            key={e.id}
            title={actionLabel(e.action)}
            meta={[`${recordTypeLabel(e.recordType)}${e.recordCode ? ` ${e.recordCode}` : ""}`, actorLabel(e.actor), dateTime(e.occurredAt)].join(" · ")}
            onClick={() => navigate(`/manage/audit-log/${e.id}`)}
          />
        )}
      </PagedList>
    </ManagePage>
  );
}

/** Bộ lọc: chỉ áp dụng khi bấm "Áp dụng". Thao tác chỉ liệt kê các thao tác của loại bản ghi đã chọn. */
function FilterForm({
  value,
  facets,
  zones,
  onApply,
  onClose,
}: {
  value: AuditFilter;
  facets: AuditEventFacets | null;
  zones: ZoneLookupItem[] | null;
  onApply: (filter: AuditFilter) => void;
  onClose: () => void;
}) {
  const [draft, setDraft] = useState<AuditFilter>(value);
  const [error, setError] = useState("");
  const set = (patch: Partial<AuditFilter>) => {
    setDraft((d) => ({ ...d, ...patch }));
    setError("");
  };

  const recordTypes = [...(facets?.recordTypes ?? [])].sort((a, b) => recordTypeLabel(a).localeCompare(recordTypeLabel(b), "vi"));
  const ofType = (facets?.actions ?? []).filter((a) => draft.recordType && a.startsWith(`${draft.recordType}.`));
  const actions = [...(ofType.length ? ofType : facets?.actions ?? [])].sort((a, b) => actionLabel(a).localeCompare(actionLabel(b), "vi"));

  const apply = () => {
    const problem = auditFilterError(draft);
    setError(problem);
    if (!problem) onApply(draft);
  };

  return (
    <div className="card form date-range">
      <DateField label="Từ ngày" value={draft.from} onChange={(from) => set({ from })} />
      <DateField label="Đến ngày" value={draft.to} onChange={(to) => set({ to })} />
      <p className="form__hint">Không chọn ngày thì xem 30 ngày gần nhất.</p>
      <Select label="Người thao tác" value={draft.person} onChange={(v) => set({ person: String(v ?? "") })} closeOnSelect>
        <Select.Option value="" title="Tất cả" />
        <Select.Option value="system" title="Hệ thống (tự động)" />
        {(facets?.people ?? []).map((p) => {
          const key = p.accountId ? `account:${p.accountId}` : `employee:${p.employeeId}`;
          return <Select.Option key={key} value={key} title={actorLabel(p)} />;
        })}
      </Select>
      <Select
        label="Loại bản ghi"
        value={draft.recordType}
        onChange={(v) => {
          const recordType = String(v ?? "");
          // Thao tác đã chọn không thuộc loại mới thì bỏ chọn.
          set({ recordType, action: draft.action && recordType && !draft.action.startsWith(`${recordType}.`) ? "" : draft.action });
        }}
        closeOnSelect
      >
        <Select.Option value="" title="Tất cả" />
        {recordTypes.map((t) => (
          <Select.Option key={t} value={t} title={recordTypeLabel(t)} />
        ))}
      </Select>
      <Select label="Thao tác" value={draft.action} onChange={(v) => set({ action: String(v ?? "") })} closeOnSelect>
        <Select.Option value="" title="Tất cả" />
        {actions.map((a) => (
          <Select.Option key={a} value={a} title={actionLabel(a)} />
        ))}
      </Select>
      {zones && zones.length > 0 && (
        <Select label="Vùng nuôi" value={draft.zoneId} onChange={(v) => set({ zoneId: String(v ?? "") })} closeOnSelect>
          <Select.Option value="" title="Tất cả" />
          {zones.map((z) => (
            <Select.Option key={z.id} value={z.id} title={z.name ?? z.code ?? ""} />
          ))}
        </Select>
      )}
      <Input
        label="Mã bản ghi (khớp phần đầu)"
        size="large"
        placeholder="Ví dụ: HD000123"
        value={draft.recordCode}
        onChange={(e) => set({ recordCode: e.target.value })}
        maxLength={AUDIT_LIMITS.filterLength}
      />
      <FormError text={error} />
      <div className="sheet-actions">
        <Button fullWidth size="large" onClick={apply}>
          Áp dụng
        </Button>
        <Button fullWidth size="large" variant="secondary" onClick={() => onApply(EMPTY_AUDIT_FILTER)}>
          Bỏ lọc
        </Button>
        <Button fullWidth size="large" variant="secondary" onClick={onClose}>
          Đóng
        </Button>
      </div>
    </div>
  );
}
