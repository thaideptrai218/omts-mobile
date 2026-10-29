import type { FeatureKey } from "./features";

/** Các vai trò theo SRS hiện tại của OTMS. */
export type RoleKey =
  | "owner"
  | "zoneManager"
  | "staff"
  | "accountant"
  | "trader"
  | "admin"
  | "viewer";

export type Tone = "neutral" | "success" | "warning" | "danger";

export type Stat = {
  label: string;
  value: string;
  unit?: string;
  note?: string;
  tone?: Tone;
};

export type Task = {
  id: string;
  title: string;
  detail: string;
  tone: Tone;
  feature: FeatureKey;
};

export type Role = {
  key: RoleKey;
  label: string;
  person: string;
  /** Phạm vi dữ liệu người này được xem, ví dụ một vùng nuôi hay toàn HTX. */
  scope: string;
  stats: Stat[];
  actions: FeatureKey[];
  /** Chia chức năng thành nhóm có tiêu đề khi vai trò có nhiều chức năng (Chủ HTX). Không có thì dùng `actions`. */
  actionGroups?: { title: string; actions: FeatureKey[] }[];
  tasksTitle: string;
  tasks: Task[];
  note?: string;
};

// Dữ liệu mẫu để dựng giao diện. Khi nối API, thay bằng dữ liệu từ OMTS.Api.
export const ROLES: Record<RoleKey, Role> = {
  owner: {
    key: "owner",
    label: "Chủ HTX",
    person: "Nguyễn Văn Tuấn",
    scope: "Toàn HTX",
    stats: [
      { label: "Bè đang nuôi", value: "42", unit: "bè", note: "2 vùng nuôi" },
      { label: "Thu hoạch tháng 10", value: "18,6", unit: "tấn", note: "Tăng 12% so với tháng 9", tone: "success" },
      { label: "Doanh thu tháng 10", value: "1,24", unit: "tỷ", note: "Đã thu 928 triệu" },
      { label: "Công nợ phải thu", value: "312", unit: "triệu", note: "1 thương lái quá hạn", tone: "warning" },
    ],
    actions: ["zones", "cycles", "harvest", "salesOrders", "receivables", "staff", "trace", "reports"],
    // Số liệu và việc cần làm của Chủ HTX lấy từ API (services/owner-summary.ts); stats/tasks bên dưới chỉ là mẫu cũ.
    actionGroups: [
      { title: "Vùng nuôi", actions: ["zones", "water", "raftMaterials", "trace"] },
      { title: "Mua hàng", actions: ["purchases", "suppliers", "supplierPayments", "inputItems"] },
      { title: "Tổ chức", actions: ["staff", "accounts", "permissions", "traderRequests", "cooperative"] },
      { title: "Chưa có trên hệ thống", actions: ["cycles", "harvest", "salesOrders", "receivables", "payroll", "reports", "auditLog", "broadcast"] },
    ],
    tasksTitle: "Cần anh xử lý",
    tasks: [
      { id: "o1", title: "3 đơn bán chờ duyệt", detail: "Tổng 4,8 tấn cho 2 thương lái", tone: "warning", feature: "salesOrders" },
      { id: "o2", title: "Khiếu nại chất lượng lô TN-2410-07", detail: "Thương lái Đức Phát báo hàu chết 6%", tone: "danger", feature: "claims" },
      { id: "o3", title: "Bảng lương tháng 10 chờ duyệt", detail: "Kế toán đã gửi lúc 16:20 hôm qua", tone: "neutral", feature: "payroll" },
    ],
  },
  zoneManager: {
    key: "zoneManager",
    label: "Quản lý vùng",
    person: "Trần Thị Hoa",
    scope: "Vùng 1 Bãi Ngang",
    stats: [
      { label: "Bè đang nuôi", value: "18", unit: "bè", note: "Trong vùng của chị" },
      { label: "Sắp thu hoạch", value: "4", unit: "chu kỳ", note: "Trong 14 ngày tới" },
      { label: "Độ mặn sáng nay", value: "21", unit: "‰", note: "Thấp hơn ngưỡng 25‰", tone: "warning" },
      { label: "Có mặt hôm nay", value: "12/14", unit: "người", note: "2 người chưa chấm công" },
    ],
    actions: ["cultivationLog", "water", "seeding", "harvest", "assignments", "attendance", "raftMaterials", "trace"],
    tasksTitle: "Cần chị xử lý",
    tasks: [
      { id: "z1", title: "Độ mặn bè B-07 xuống 21‰", detail: "Đo lúc 06:30, nên đo lại trước 10:00", tone: "warning", feature: "water" },
      { id: "z2", title: "Chu kỳ CK-2405 đến hạn thu hoạch", detail: "Bè B-01 đến B-04, dự kiến 6,2 tấn", tone: "neutral", feature: "harvest" },
      { id: "z3", title: "2 nhân công chưa chấm công", detail: "Ca sáng bắt đầu lúc 06:00", tone: "danger", feature: "attendance" },
    ],
  },
  staff: {
    key: "staff",
    label: "Nhân viên",
    person: "Lê Văn Nam",
    scope: "Vùng 1 Bãi Ngang",
    stats: [
      { label: "Việc hôm nay", value: "3", unit: "việc", note: "Còn 2 việc chưa xong" },
      { label: "Vào ca lúc", value: "06:42", note: "Ca sáng", tone: "success" },
      { label: "Giờ công tháng 10", value: "168", unit: "giờ" },
      { label: "Nhật ký đã ghi", value: "5", unit: "mục", note: "Trong tuần này" },
    ],
    actions: ["attendance", "cultivationLog", "water", "portWeighing", "harvest", "schedule"],
    tasksTitle: "Việc của bạn hôm nay",
    tasks: [
      { id: "s1", title: "Vệ sinh lồng bè B-03 đến B-06", detail: "Vùng 1, xong trước 11:00", tone: "neutral", feature: "cultivationLog" },
      { id: "s2", title: "Đo độ mặn và nhiệt độ lúc 14:00", detail: "Bè B-07 và B-08", tone: "warning", feature: "water" },
      { id: "s3", title: "Hỗ trợ cân hàng tại cảng 16:30", detail: "Đơn ĐH-1024 của thương lái Đức Phát", tone: "neutral", feature: "portWeighing" },
    ],
  },
  accountant: {
    key: "accountant",
    label: "Kế toán",
    person: "Phạm Thu Trang",
    scope: "Toàn HTX",
    stats: [
      { label: "Đã thu tháng 10", value: "928", unit: "triệu", tone: "success" },
      { label: "Còn phải thu", value: "312", unit: "triệu", note: "5 thương lái" },
      { label: "Chờ đối soát", value: "6", unit: "giao dịch", note: "Chưa khớp với đơn", tone: "warning" },
      { label: "Lương chờ quyết toán", value: "214", unit: "triệu", note: "Tháng 10" },
    ],
    actions: ["receipts", "receivables", "reconcile", "refunds", "payroll", "costs", "reports"],
    tasksTitle: "Cần chị xử lý",
    tasks: [
      { id: "a1", title: "6 khoản chuyển khoản chưa khớp đơn", detail: "Nhận từ 20/10 đến 24/10", tone: "warning", feature: "reconcile" },
      { id: "a2", title: "Thương lái Đức Phát quá hạn 15 ngày", detail: "Còn nợ 86,5 triệu", tone: "danger", feature: "receivables" },
      { id: "a3", title: "Kiểm tra bảng lương tháng 10", detail: "52 nhân công, 3 người có ngày công điều chỉnh", tone: "neutral", feature: "payroll" },
    ],
  },
  trader: {
    key: "trader",
    label: "Thương lái",
    person: "Hoàng Đức Phát",
    scope: "Đại lý Đức Phát",
    stats: [
      { label: "Công nợ hiện tại", value: "86,5", unit: "triệu", note: "Đến hạn 28/10", tone: "warning" },
      { label: "Đơn đang giao", value: "2", unit: "đơn" },
      { label: "Đã nhận tháng 10", value: "3,2", unit: "tấn" },
      { label: "Lần nhận tới", value: "07:00", note: "Sáng mai tại cảng số 2" },
    ],
    actions: ["orders", "payment", "weighSlips", "pickup", "claims", "trace"],
    tasksTitle: "Cần anh chú ý",
    tasks: [
      { id: "t1", title: "Nhận hàng đơn ĐH-1024 lúc 07:00", detail: "Cảng số 2, khoảng 1,5 tấn", tone: "neutral", feature: "pickup" },
      { id: "t2", title: "Khoản 42 triệu đến hạn ngày 28/10", detail: "Của đơn ĐH-1009", tone: "warning", feature: "payment" },
      { id: "t3", title: "Khiếu nại lô TN-2410-07 đang được xử lý", detail: "HTX sẽ phản hồi trước 26/10", tone: "neutral", feature: "claims" },
    ],
  },
  admin: {
    key: "admin",
    label: "Quản trị hệ thống",
    person: "Đỗ Minh Quân",
    scope: "Toàn hệ thống",
    stats: [
      { label: "Tài khoản hoạt động", value: "37" },
      { label: "Chờ xác minh", value: "2", unit: "tài khoản", tone: "warning" },
      { label: "Đăng nhập hôm nay", value: "21", unit: "lượt" },
      { label: "Cảnh báo bảo mật", value: "0", tone: "success" },
    ],
    actions: ["accounts", "permissions", "zones", "auditLog", "broadcast", "settings"],
    tasksTitle: "Cần anh xử lý",
    tasks: [
      { id: "ad1", title: "2 tài khoản chờ xác minh liên hệ", detail: "Đăng ký từ Zalo hôm qua", tone: "warning", feature: "accounts" },
      { id: "ad2", title: "Nhân viên mới chưa được phân vùng", detail: "Lê Văn Nam mới vào ngày 20/10", tone: "neutral", feature: "permissions" },
    ],
    note: "Các thao tác quản trị đầy đủ nằm trên bản web.",
  },
  viewer: {
    key: "viewer",
    label: "Người xem QR",
    person: "Khách",
    scope: "Không cần đăng nhập",
    stats: [],
    actions: [],
    tasksTitle: "",
    tasks: [],
  },
};

export const ROLE_ORDER: RoleKey[] = ["owner", "zoneManager", "staff", "accountant", "trader", "admin", "viewer"];
