import type { IconProps } from "zmp-ui/icon";

export type IconName = NonNullable<IconProps["icon"]>;

/** Một chức năng có thể mở từ dashboard. Màn đã nối API khai báo đường dẫn trong `FEATURE_ROUTES`. */
export type Feature = {
  title: string;
  icon: IconName;
  description: string;
};

export const FEATURES = {
  myWork: { title: "Công việc của tôi", icon: "zi-calendar", description: "Phân công, QR chấm công, giờ làm và nghỉ phép cá nhân." },
  leaveRequests: { title: "Duyệt nghỉ phép", icon: "zi-user-check", description: "Phản hồi yêu cầu nghỉ phép của nhân viên." },
  attendanceSettings: { title: "Cài đặt chấm công", icon: "zi-clock-1", description: "Loại việc, giờ nghỉ và làm tròn giờ công." },
  zones: {
    title: "Vùng nuôi",
    icon: "zi-location",
    description: "Xem các vùng nuôi, bè và hàng bè, giấy tờ pháp lý của từng vùng.",
  },
  cycles: {
    title: "Chu kỳ nuôi",
    icon: "zi-calendar",
    description: "Theo dõi các chu kỳ nuôi từ lúc thả giống đến khi thu hoạch.",
  },
  seeding: {
    title: "Thả giống",
    icon: "zi-plus-circle",
    description: "Ghi nhận lô giống nhận về và các lần thả giống xuống bè.",
  },
  cultivationLog: {
    title: "Nhật ký nuôi",
    icon: "zi-edit-text",
    description: "Ghi lại công việc hằng ngày trên bè: vệ sinh, san thưa, kiểm tra hàu.",
  },
  water: {
    title: "Chỉ số nước",
    icon: "zi-poll",
    description: "Nhập và xem độ pH, độ mặn đo được tại từng vùng nuôi, cảnh báo khi vượt ngưỡng.",
  },
  harvest: {
    title: "Thu hoạch",
    icon: "zi-check-circle",
    description: "Ghi nhận các đợt thu hoạch và tạo lô truy xuất cho hàu đã thu.",
  },
  raftMaterials: {
    title: "Chi phí vật tư bè",
    icon: "zi-list-2",
    description: "Chi phí phao, dây, lồng và vật tư khác đã nhập cho từng bè.",
  },
  assignments: {
    title: "Phân công",
    icon: "zi-members",
    description: "Giao việc cho nhân công theo vùng, bè và ca làm.",
  },
  attendance: {
    title: "Chấm công",
    icon: "zi-clock-1",
    description: "Chấm công vào ca, ra ca và xem lịch sử chấm công.",
  },
  schedule: {
    title: "Lịch làm việc",
    icon: "zi-calendar-solid",
    description: "Xem các việc được giao trong ngày và trong tuần.",
  },
  portWeighing: {
    title: "Cân tại cảng",
    icon: "zi-inbox",
    description: "Ghi số cân khi giao hàu cho thương lái tại cảng.",
  },
  salesOrders: {
    title: "Yêu cầu mua",
    icon: "zi-note",
    description: "Nhận yêu cầu mua theo số lồng và phản hồi cho thương lái.",
  },
  salesProducts: { title: "Sản phẩm bán", icon: "zi-list-2", description: "Danh mục sản phẩm để thương lái đặt mua theo số lồng." },
  receivables: {
    title: "Công nợ",
    icon: "zi-poll-solid",
    description: "Xem công nợ của từng thương lái và các khoản đến hạn.",
  },
  receipts: {
    title: "Phiếu thu",
    icon: "zi-file",
    description: "Lập phiếu thu và phân bổ tiền thu vào các đơn bán.",
  },
  reconcile: {
    title: "Đối soát chuyển khoản",
    icon: "zi-retry",
    description: "Khớp các khoản chuyển khoản ngân hàng với đơn và công nợ.",
  },
  refunds: {
    title: "Hoàn tiền",
    icon: "zi-recall",
    description: "Xử lý hoàn tiền cho thương lái sau khiếu nại hoặc điều chỉnh đơn.",
  },
  payroll: {
    title: "Lương nhân công",
    icon: "zi-user-check",
    description: "Tính và quyết toán lương theo giờ công và bảng giá công.",
  },
  costs: {
    title: "Chi phí",
    icon: "zi-list-1",
    description: "Ghi nhận chi phí giống, vật tư, nhân công theo vùng nuôi.",
  },
  staff: {
    title: "Nhân sự",
    icon: "zi-group",
    description: "Quản lý nhân viên, nhân công thời vụ và nhà thầu.",
  },
  reports: {
    title: "Báo cáo",
    icon: "zi-more-grid",
    description: "Báo cáo sản lượng, doanh thu, chi phí theo tháng và theo vùng.",
  },
  orders: {
    title: "Mua hàng của tôi",
    icon: "zi-note",
    description: "Đặt mua theo số lồng, xem phản hồi của HTX và hủy yêu cầu.",
  },
  payment: {
    title: "Thanh toán",
    icon: "zi-check-circle-solid",
    description:
      "Thanh toán công nợ bằng chuyển khoản. Khi làm thật, bước này phải đi qua Checkout SDK của Zalo.",
  },
  weighSlips: {
    title: "Phiếu cân",
    icon: "zi-file",
    description: "Xem lại phiếu cân của từng lần nhận hàng tại cảng.",
  },
  pickup: {
    title: "Lịch nhận hàng",
    icon: "zi-calendar",
    description: "Xem giờ và địa điểm nhận hàng đã hẹn với HTX.",
  },
  claims: {
    title: "Khiếu nại",
    icon: "zi-warning-circle",
    description: "Gửi và theo dõi khiếu nại chất lượng hoặc trả hàng.",
  },
  accounts: {
    title: "Tài khoản",
    icon: "zi-user-settings",
    description: "Tạo, khóa và xác minh tài khoản người dùng.",
  },
  permissions: {
    title: "Vai trò",
    icon: "zi-shield-solid",
    description: "Các vai trò và quyền trên từng chức năng; gán vai trò theo vùng ở màn Tài khoản.",
  },
  auditLog: {
    title: "Nhật ký hệ thống",
    icon: "zi-list-1",
    description: "Xem lịch sử thao tác quan trọng trong hệ thống.",
  },
  broadcast: {
    title: "Gửi thông báo",
    icon: "zi-notif-ring",
    description: "Gửi thông báo cho nhân viên hoặc thương lái.",
  },
  settings: {
    title: "Cài đặt",
    icon: "zi-setting",
    description: "Cấu hình chung của hệ thống.",
  },
  suppliers: {
    title: "Nhà cung cấp",
    icon: "zi-user-circle",
    description: "Danh sách nhà cung cấp giống, vật tư và công nợ với từng nhà cung cấp.",
  },
  purchases: {
    title: "Phiếu nhập",
    icon: "zi-file",
    description: "Phiếu nhập giống, vật tư: hoàn tất, hủy, ghi thanh toán cho nhà cung cấp.",
  },
  supplierPayments: {
    title: "Trả tiền NCC",
    icon: "zi-check-circle-solid",
    description: "Các lần trả tiền cho nhà cung cấp.",
  },
  inputItems: {
    title: "Danh mục vật tư",
    icon: "zi-list-2",
    description: "Danh mục con giống, vật tư bè và vật tư khác dùng khi nhập hàng.",
  },
  traderRequests: {
    title: "Duyệt thương lái",
    icon: "zi-user-check",
    description: "Duyệt yêu cầu tài khoản thương lái gửi từ Zalo.",
  },
  cooperative: {
    title: "Hồ sơ HTX",
    icon: "zi-home",
    description: "Tên, mã số thuế, địa chỉ, người đại diện và ngành nghề của HTX.",
  },
  trace: {
    title: "Truy xuất",
    icon: "zi-qrline",
    description: "Tra cứu nguồn gốc một lô hàu bằng mã QR hoặc mã lô.",
  },
} satisfies Record<string, Feature>;

export type FeatureKey = keyof typeof FEATURES;

/**
 * Chức năng đã có màn thật (nối API). Chức năng không có ở đây mở trang "chưa có" giải thích lý do
 * (xem docs/owner-features.md).
 */
export const FEATURE_ROUTES: Partial<Record<FeatureKey, string>> = {
  myWork: "/account/work",
  assignments: "/manage/workforce",
  attendance: "/manage/workforce",
  schedule: "/account/work",
  leaveRequests: "/manage/leave-requests",
  attendanceSettings: "/manage/attendance-settings",
  orders: "/account/purchases",
  salesOrders: "/manage/purchase-requests",
  salesProducts: "/manage/sales-products",
  zones: "/manage/zones",
  water: "/manage/water",
  raftMaterials: "/manage/raft-costs",
  suppliers: "/manage/suppliers",
  purchases: "/manage/purchases",
  costs: "/manage/purchases",
  supplierPayments: "/manage/supplier-payments",
  inputItems: "/manage/input-items",
  staff: "/manage/employees",
  accounts: "/manage/accounts",
  permissions: "/manage/roles",
  cooperative: "/manage/cooperative",
  settings: "/manage/cooperative",
  traderRequests: "/account/trader-requests",
  trace: "/trace",
};
