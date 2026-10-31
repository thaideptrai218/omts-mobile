/**
 * Chữ tiếng Việt cho các giá trị backend trả bằng tiếng Anh (tên trạng thái, enum, loại giấy tờ). App không hiện
 * chữ tiếng Anh của server; giá trị lạ hiện nguyên văn để không mất thông tin.
 */

export type Tone = "neutral" | "success" | "warning" | "danger";

type Label = { text: string; tone: Tone };

/** Tên trạng thái trong danh mục trạng thái của backend (`StatusCatalogSeed`, trường `status`). */
const STATUS: Record<string, Label> = {
  "In Use": { text: "Đang dùng", tone: "success" },
  Discontinued: { text: "Ngừng dùng", tone: "neutral" },
  Active: { text: "Đang hoạt động", tone: "success" },
  Locked: { text: "Đã khóa", tone: "danger" },
  "Pending approval": { text: "Chờ duyệt", tone: "warning" },
  Rejected: { text: "Đã từ chối", tone: "danger" },
  Employed: { text: "Đang làm", tone: "success" },
  Left: { text: "Đã nghỉ", tone: "neutral" },
  Effective: { text: "Đang hiệu lực", tone: "success" },
  Revoked: { text: "Đã thu hồi", tone: "neutral" },
  Draft: { text: "Nháp", tone: "warning" },
  Completed: { text: "Hoàn tất", tone: "success" },
  Cancelled: { text: "Đã hủy", tone: "neutral" },
  Recorded: { text: "Đã ghi nhận", tone: "success" },
  Confirmed: { text: "Đã xác nhận", tone: "success" },
  Corrected: { text: "Đã sửa", tone: "neutral" },
  Superseded: { text: "Đã thay thế", tone: "neutral" },
  Voided: { text: "Đã hủy", tone: "neutral" },
  Open: { text: "Đang mở", tone: "success" },
  Closed: { text: "Đã đóng", tone: "neutral" },
};

export function statusLabel(status: string | null | undefined): Label {
  if (!status) return { text: "—", tone: "neutral" };
  return STATUS[status] ?? { text: status, tone: "neutral" };
}

/** Mã trạng thái phép đo nước (`statusCode`). */
const WATER_STATUS: Record<string, Label> = {
  DRAFT: { text: "Nháp", tone: "warning" },
  CONFIRMED: { text: "Đã xác nhận", tone: "success" },
  SUPERSEDED: { text: "Đã sửa", tone: "neutral" },
  VOIDED: { text: "Đã hủy", tone: "neutral" },
};

export function waterStatusLabel(code: string | null | undefined): Label {
  return (code && WATER_STATUS[code]) || { text: code ?? "—", tone: "neutral" };
}

export const LICENSE_STATE: Record<string, Label> = {
  Valid: { text: "Còn hiệu lực", tone: "success" },
  ExpiringSoon: { text: "Sắp hết hạn", tone: "warning" },
  Expired: { text: "Đã hết hạn", tone: "danger" },
  NotYetEffective: { text: "Chưa hiệu lực", tone: "neutral" },
  Superseded: { text: "Đã thay thế", tone: "neutral" },
  Missing: { text: "Thiếu giấy tờ", tone: "danger" },
};

/** Loại giấy tờ pháp lý của vùng nuôi (`documentType`). */
export const DOCUMENT_TYPE: Record<string, string> = {
  AQUACULTURE_LICENSE: "Giấy phép nuôi trồng thủy sản trên biển",
  FOOD_SAFETY_COMMITMENT: "Cam kết an toàn thực phẩm",
  SEA_AREA_ALLOCATION: "Quyết định giao khu vực biển",
};

export const SUPPLIER_TYPE: Record<string, string> = {
  Seed: "Giống",
  Material: "Vật tư",
  Other: "Khác",
};

export const INPUT_GROUP: Record<string, string> = {
  Seed: "Con giống",
  RaftMaterial: "Vật tư bè",
  Other: "Khác",
};

export const PAYMENT_METHOD: Record<string, string> = {
  Cash: "Tiền mặt",
  BankTransfer: "Chuyển khoản",
  Other: "Khác",
};

export const WATER_ALERT: Record<string, Label> = {
  None: { text: "Trong ngưỡng", tone: "success" },
  Active: { text: "Vượt ngưỡng", tone: "danger" },
  Corrected: { text: "Đã sửa số đo", tone: "neutral" },
  Voided: { text: "Đã hủy", tone: "neutral" },
};

export const INPUT_SOURCE: Record<string, string> = {
  Ocr: "Đọc từ ảnh",
  Manual: "Nhập tay",
};

/** Thao tác trong vai trò (`PermissionAction`). */
export const PERMISSION_ACTION: Record<string, string> = {
  View: "Xem",
  Create: "Tạo",
  Edit: "Sửa",
  Delete: "Xóa",
  Export: "Xuất",
  Import: "Nhập",
  Approve: "Duyệt",
  Publish: "Công bố",
};

export const DATA_SCOPE: Record<string, string> = {
  OwnRecords: "Bản ghi của mình",
  AssignedZone: "Vùng được giao",
};

/** Tên vai trò mẫu do hệ thống tạo sẵn (tiếng Anh) → tiếng Việt. Vai trò do Chủ HTX đặt tên giữ nguyên. */
const ROLE_NAME: Record<string, string> = {
  Accountant: "Kế toán",
  "Zone Manager": "Quản lý vùng",
  "Zone manager": "Quản lý vùng",
  Staff: "Nhân viên",
  Worker: "Nhân công",
  Viewer: "Người xem",
  "Sales Staff": "Nhân viên bán hàng",
  "Sales staff": "Nhân viên bán hàng",
};

export function roleName(name: string | null | undefined) {
  if (!name) return "—";
  return ROLE_NAME[name] ?? name;
}

export const SUBJECT_TYPE: Record<string, string> = {
  SystemAdministrator: "Quản trị hệ thống",
  CooperativeOwner: "Chủ HTX",
  Staff: "Nhân viên",
  Trader: "Thương lái",
};

/**
 * Mô tả chỉ số vượt ngưỡng server ghi bằng tiếng Anh, ví dụ "Salinity 18.50 < 20.00; pH 8.70 > 8.50"
 * → "Độ mặn 18,5 < 20; pH 8,7 > 8,5".
 */
export function violatedText(value: string | null | undefined) {
  if (!value) return "";
  return value
    .replace(/Salinity/g, "Độ mặn")
    .replace(/\d+\.\d+/g, (n) => String(Number(n)).replace(".", ","));
}
