import type { AuditEventDetail, AuditEventFacets, AuditEventRecord, AuditEventSearchResult, AuditFilter } from "@/features/audit/models/AuditEvent";
import { api } from "@/services/httpClient";

/** Giới hạn của backend (`AuditEventSearchService.cs`): số dòng mỗi trang, khoảng ngày tối đa 5 năm, chữ lọc tối đa 100 ký tự. */
export const AUDIT_LIMITS = { pageSize: 20, maxYears: 5, filterLength: 100 } as const;

export const EMPTY_AUDIT_FILTER: AuditFilter = { from: null, to: null, person: "", action: "", recordType: "", zoneId: "", recordCode: "" };

/**
 * Tìm trong lịch sử thao tác, mới nhất trước (ACCOUNT-10). Một người là một tài khoản, một nhân viên hoặc hệ thống.
 * Không khớp thì server trả trang rỗng kèm MSG-GEN-10.
 */
export function searchAudit(filter: AuditFilter, page: number) {
  const params = new URLSearchParams({ page: String(page), pageSize: String(AUDIT_LIMITS.pageSize) });
  if (filter.from) params.set("from", filter.from);
  if (filter.to) params.set("to", filter.to);
  const [kind, id] = filter.person.split(":");
  if (kind === "system") params.set("system", "true");
  else if (kind === "account" && id) params.set("actorAccountId", id);
  else if (kind === "employee" && id) params.set("actorEmployeeId", id);
  if (filter.action) params.set("action", filter.action);
  if (filter.recordType) params.set("recordType", filter.recordType);
  if (filter.zoneId) params.set("zoneId", filter.zoneId);
  if (filter.recordCode.trim()) params.set("recordCode", filter.recordCode.trim());
  return api<AuditEventSearchResult>(`/api/audit-events?${params.toString()}`);
}

export const auditFacets = () => api<AuditEventFacets>("/api/audit-events/facets");

export const getAuditEvent = (id: string) => api<AuditEventDetail>(`/api/audit-events/${id}`);

/** Bản ghi của thao tác như hiện tại (ACCOUNT-10.1); bản ghi không còn thì server trả 404 MSG-ACCOUNT-22. */
export const openAuditRecord = (id: string) => api<AuditEventRecord>(`/api/audit-events/${id}/record`);

/** Lỗi của bộ lọc trước khi gửi; chuỗi rỗng là hợp lệ. */
export function auditFilterError(filter: AuditFilter): string {
  if (filter.from && filter.to) {
    if (filter.from > filter.to) return "Từ ngày không được sau đến ngày.";
    const [year, month, day] = filter.from.split("-").map(Number);
    const limit = `${year + AUDIT_LIMITS.maxYears}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    if (filter.to > limit) return `Chỉ tìm được trong tối đa ${AUDIT_LIMITS.maxYears} năm mỗi lần.`;
  }
  if (filter.recordCode.trim().length > AUDIT_LIMITS.filterLength) return "Mã bản ghi quá dài.";
  return "";
}
