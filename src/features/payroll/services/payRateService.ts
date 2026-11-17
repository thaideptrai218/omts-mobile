import type { ChangeRateRequest, JobTypeListParams, JobTypeStatusRequest, RenameJobTypeRequest } from "@/features/payroll/models/PayRate";
import type { JobType, JobTypeSaved } from "@/features/workforce/models/Job";
import type { Paged } from "@/models/Pagination";

import { api } from "@/services/httpClient";

// Loại việc và tiền công mỗi giờ (LABOR-11): Kế toán và Chủ HTX, quyền PAY_RULES. Thêm loại việc dùng `addJobType` của workforce.
export function searchJobTypes(filter: JobTypeListParams) {
  const params = [
    filter.search ? `search=${encodeURIComponent(filter.search)}` : "",
    filter.statusId ? `statusId=${filter.statusId}` : "",
    `page=${filter.page}`,
    `pageSize=${filter.pageSize}`,
  ].filter(Boolean);
  return api<Paged<JobType>>(`/api/job-types?${params.join("&")}`);
}

export function getJobType(id: string) {
  return api<JobType>(`/api/job-types/${id}`);
}

export function changeRate(id: string, body: ChangeRateRequest) {
  return api<JobTypeSaved>(`/api/job-types/${id}/rates`, { method: "POST", body });
}

export function renameJobType(id: string, body: RenameJobTypeRequest) {
  return api<JobTypeSaved>(`/api/job-types/${id}/name`, { method: "PUT", body });
}

export function setJobTypeInUse(id: string, inUse: boolean, body: JobTypeStatusRequest) {
  return api<JobTypeSaved>(`/api/job-types/${id}/${inUse ? "resume" : "discontinue"}`, { method: "POST", body });
}
