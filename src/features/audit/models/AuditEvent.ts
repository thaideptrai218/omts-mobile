import type { Paged } from "@/models/Pagination";

/** Lịch sử thao tác (ACCOUNT-10), theo `AuditEventDtos.cs` của backend. Chỉ Chủ HTX xem (BR-ACCOUNT-13); chỉ đọc, không sửa hay xóa. */

export type AuditActorKind = "System" | "Account" | "Employee";

/** Ai đã làm: một tài khoản (tên và tên đăng nhập), một nhân viên (họ tên) hoặc hệ thống (tên "System"). */
export type AuditActor = {
  kind: AuditActorKind;
  accountId: string | null;
  employeeId: string | null;
  name: string;
  username: string | null;
};

export type AuditEventListItem = {
  id: string;
  occurredAt: string;
  actor: AuditActor;
  /** Mã thao tác dạng "Raft.Updated", danh sách lấy ở facets. */
  action: string;
  /** Tên loại bản ghi dạng "FarmingZone". */
  recordType: string;
  recordId: string | null;
  recordCode: string | null;
  zoneId: string | null;
  reason: string | null;
};

/** JSON tùy ý của giá trị trước và sau (tên trường kiểu PascalCase như backend lưu); không bao giờ có mật khẩu, mã hay token. */
export type AuditValue = string | number | boolean | null | AuditValue[] | { [field: string]: AuditValue };

export type AuditEventDetail = AuditEventListItem & {
  before: AuditValue | null;
  after: AuditValue | null;
};

export type AuditEventSearchResult = {
  page: Paged<AuditEventListItem>;
  /** Khoảng ngày đã tìm (mặc định 30 ngày gần nhất). */
  from: string;
  to: string;
  /** MSG-GEN-10 khi không có thao tác nào khớp. */
  message: string | null;
  messageCode: string | null;
};

/** Giá trị cho các bộ lọc: thao tác và loại bản ghi đã từng ghi, các tài khoản và nhân viên đã thao tác. */
export type AuditEventFacets = {
  actions: string[];
  recordTypes: string[];
  people: AuditActor[];
};

/** Bản ghi của thao tác như hiện tại, để mở màn quản lý bản ghi đó (ACCOUNT-10.1). */
export type AuditEventRecord = {
  eventId: string;
  recordType: string;
  recordId: string;
  recordCode: string | null;
};

/**
 * Bộ lọc trên màn: khoảng ngày theo giờ Việt Nam (null là để server lấy 30 ngày gần nhất), một người
 * ("system", "account:<id>", "employee:<id>" hoặc rỗng), thao tác, loại bản ghi, vùng và mã bản ghi (khớp phần đầu).
 */
export type AuditFilter = {
  from: string | null;
  to: string | null;
  person: string;
  action: string;
  recordType: string;
  zoneId: string;
  recordCode: string;
};

/** Một trường thay đổi trên màn chi tiết. */
export type AuditChange = { field: string; before: AuditValue | undefined; after: AuditValue | undefined };

/** Khoảng ngày server đã tìm, hiện trên dòng bộ lọc. */
export type AuditPeriod = { from: string; to: string };
