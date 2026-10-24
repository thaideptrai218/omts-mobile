import type { IconProps } from "zmp-ui/icon";

export type IconName = NonNullable<IconProps["icon"]>;

/** Một chức năng có thể mở từ dashboard. Hiện mới có giao diện, chưa nối API. */
export type Feature = {
  title: string;
  icon: IconName;
  description: string;
};

export const FEATURES = {
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
    title: "Đo chỉ số nước",
    icon: "zi-poll",
    description: "Nhập độ mặn, nhiệt độ, độ pH đo được tại từng vùng nuôi.",
  },
  harvest: {
    title: "Thu hoạch",
    icon: "zi-check-circle",
    description: "Ghi nhận các đợt thu hoạch và tạo lô truy xuất cho hàu đã thu.",
  },
  raftMaterials: {
    title: "Vật tư bè",
    icon: "zi-list-2",
    description: "Theo dõi phao, dây, lồng và vật tư khác trên từng bè.",
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
    title: "Đơn bán",
    icon: "zi-note",
    description: "Tạo và duyệt đơn bán hàu cho thương lái.",
  },
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
    title: "Đơn hàng của tôi",
    icon: "zi-note",
    description: "Xem các đơn mua hàu và trạng thái giao nhận.",
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
    title: "Phân quyền",
    icon: "zi-shield-solid",
    description: "Gán vai trò và phạm vi vùng nuôi cho từng tài khoản.",
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
  trace: {
    title: "Truy xuất",
    icon: "zi-qrline",
    description: "Tra cứu nguồn gốc một lô hàu bằng mã QR hoặc mã lô.",
  },
} satisfies Record<string, Feature>;

export type FeatureKey = keyof typeof FEATURES;
