import type {
  Bank,
  CustomerListPage,
  CustomerMergePreview,
  CustomerSaved,
  CustomerSearchParams,
  CustomerSettings,
  CustomerView,
  MergeCustomer,
  SaveCustomer,
} from "@/features/customers/models/Customer";

import { api } from "@/services/httpClient";
import { appendPhoto, shrinkImage } from "@/utils/imageFile";

/** Ảnh khách hàng: JPEG hoặc PNG, tối đa 2 MB (FileRules.CustomerPhoto của backend). */
const PHOTO_MAX_BYTES = 2 * 1024 * 1024;

function query(params: Record<string, string | number | boolean | null | undefined>) {
  const q = Object.entries(params)
    .filter(([, v]) => v !== null && v !== undefined && v !== "")
    .map(([k, v]) => `${k}=${encodeURIComponent(String(v))}`)
    .join("&");
  return q ? `?${q}` : "";
}

/** SALE-04 bước 2: tìm theo tên, mã hoặc số điện thoại; hồ sơ đã gộp không có trong danh sách. */
export function listCustomers(filter: CustomerSearchParams) {
  return api<CustomerListPage>(
    `/api/customers${query({
      search: filter.search,
      status: filter.status,
      type: filter.type,
      overDebtLimit: filter.overDebtLimit ? true : null,
      page: filter.page ?? 1,
      pageSize: filter.pageSize ?? 20,
    })}`,
  );
}

export function getCustomer(id: string) {
  return api<CustomerView>(`/api/customers/${id}`);
}

export function createCustomer(body: SaveCustomer) {
  return api<CustomerSaved>("/api/customers", { method: "POST", body });
}

export function updateCustomer(id: string, body: SaveCustomer) {
  return api<CustomerSaved>(`/api/customers/${id}`, { method: "PUT", body });
}

/** Ngừng dùng hoặc dùng lại; không cần lý do. Hóa đơn, phiếu thu và công nợ cũ giữ nguyên. */
export function setCustomerInUse(id: string, inUse: boolean) {
  return api<CustomerView>(`/api/customers/${id}/${inUse ? "resume" : "discontinue"}`, { method: "POST" });
}

export async function setCustomerPhoto(id: string, photo: Blob) {
  // Ảnh không phải JPEG/PNG (WebP, HEIC, chưa rõ loại) được vẽ lại thành JPEG để backend nhận.
  const accepted = photo.type === "image/jpeg" || photo.type === "image/png";
  const form = new FormData();
  appendPhoto(form, "file", await shrinkImage(photo, accepted ? PHOTO_MAX_BYTES : 0));
  return api<CustomerView>(`/api/customers/${id}/photo`, { method: "PUT", form });
}

export function removeCustomerPhoto(id: string) {
  return api<CustomerView>(`/api/customers/${id}/photo`, { method: "DELETE" });
}

export function getCustomerSettings() {
  return api<CustomerSettings>("/api/customer-settings");
}

/** Danh sách ngân hàng của form; backend chỉ mở cho Chủ HTX. */
export function listBanks() {
  return api<Bank[]>("/api/banks");
}

/** SALE-04.3 bước 2 và 3: hai hồ sơ, số bản ghi sẽ chuyển sang hồ sơ giữ lại, hoặc lý do không gộp được. */
export function previewMerge(keptId: string, mergedId: string) {
  return api<CustomerMergePreview>(`/api/customers/${keptId}/merge-preview${query({ mergedCustomerId: mergedId })}`);
}

/** Gộp hồ sơ `mergedCustomerId` vào hồ sơ `keptId`. Không hoàn tác được. */
export function mergeCustomer(keptId: string, body: MergeCustomer) {
  return api<CustomerView>(`/api/customers/${keptId}/merge`, { method: "POST", body });
}
