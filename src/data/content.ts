import type { IconName } from "./features";
import type { RoleKey, Tone } from "./roles";

/**
 * Thông tin bắt buộc phải hiển thị trong Mini App theo điều khoản của Zalo.
 * Các giá trị dưới đây là dữ liệu mẫu, cần thay bằng thông tin thật của HTX trước khi gửi duyệt.
 */
export const COOPERATIVE = {
  name: "Hợp tác xã Thủy sản Trung Nam",
  shortName: "HTX Thủy sản Trung Nam",
  registrationNo: "Mã số HTX: 5701234567",
  address: "Thôn Trung Nam, xã Vân Đồn, tỉnh Quảng Ninh",
  phone: "0203 3999 888",
  email: "lienhe@htxtrungnam.vn",
  service: "Quản lý nuôi trồng và truy xuất nguồn gốc hàu của HTX Thủy sản Trung Nam.",
  support: "Gọi 0203 3999 888 hoặc nhắn tin cho Zalo OA của HTX, giờ hành chính các ngày trong tuần.",
  appVersion: "1.0.0",
};

export type Notice = {
  id: string;
  title: string;
  body: string;
  time: string;
  icon: IconName;
  tone: Tone;
  unread?: boolean;
};

const STAFF_NOTICES: Notice[] = [
  { id: "n1", title: "Độ mặn vùng 1 thấp", body: "Bè B-07 đo được 21‰ lúc 06:30.", time: "06:35", icon: "zi-warning", tone: "warning", unread: true },
  { id: "n2", title: "Lịch thu hoạch đã được duyệt", body: "Chu kỳ CK-2405 thu hoạch ngày 27/10.", time: "Hôm qua", icon: "zi-calendar", tone: "neutral" },
  { id: "n3", title: "Bảng lương tháng 9 đã chi trả", body: "Kiểm tra trong mục Lương nhân công.", time: "15/10", icon: "zi-check-circle", tone: "success" },
];

const TRADER_NOTICES: Notice[] = [
  { id: "t1", title: "Đơn ĐH-1024 đã được xác nhận", body: "Nhận hàng lúc 07:00 sáng mai tại cảng số 2.", time: "08:10", icon: "zi-check-circle", tone: "success", unread: true },
  { id: "t2", title: "Khoản 42 triệu sắp đến hạn", body: "Hạn thanh toán ngày 28/10 cho đơn ĐH-1009.", time: "Hôm qua", icon: "zi-clock-1", tone: "warning" },
  { id: "t3", title: "HTX đã nhận khiếu nại của anh", body: "Khiếu nại lô TN-2410-07 đang được xem xét.", time: "23/10", icon: "zi-chat", tone: "neutral" },
];

export const NOTICES: Record<RoleKey, Notice[]> = {
  owner: STAFF_NOTICES,
  zoneManager: STAFF_NOTICES,
  staff: STAFF_NOTICES,
  accountant: [
    { id: "a1", title: "Có 2 khoản chuyển khoản mới", body: "Tổng 64 triệu, chưa khớp với đơn nào.", time: "09:12", icon: "zi-retry", tone: "warning", unread: true },
    ...STAFF_NOTICES.slice(1),
  ],
  trader: TRADER_NOTICES,
  admin: [
    { id: "ad1", title: "Tài khoản mới chờ xác minh", body: "2 người đăng ký từ Zalo cần xác minh liên hệ.", time: "Hôm qua", icon: "zi-user-check", tone: "warning", unread: true },
  ],
  viewer: [],
};

export type TraceStep = {
  title: string;
  date: string;
  detail: string;
};

export type TraceLot = {
  code: string;
  product: string;
  zone: string;
  harvestDate: string;
  weight: string;
  water: string;
  steps: TraceStep[];
};

/** Lô mẫu để thử màn hình truy xuất. */
export const SAMPLE_LOT: TraceLot = {
  code: "TN-2410-07",
  product: "Hàu Thái Bình Dương",
  zone: "Vùng 1 Bãi Ngang, bè B-01 đến B-04",
  harvestDate: "21/10/2026",
  weight: "6,2 tấn",
  water: "Độ mặn trung bình 27‰, nhiệt độ 24 °C",
  steps: [
    { title: "Nhận giống", date: "02/04/2026", detail: "Giống hàu từ trại giống Cẩm Phả, lô giống G-0412." },
    { title: "Thả giống", date: "05/04/2026", detail: "Thả xuống 4 bè tại Vùng 1 Bãi Ngang." },
    { title: "Chăm sóc và theo dõi", date: "04 đến 10/2026", detail: "126 lần ghi nhật ký, đo chỉ số nước hằng ngày." },
    { title: "Thu hoạch", date: "21/10/2026", detail: "Thu 6,2 tấn, tạo lô truy xuất TN-2410-07." },
    { title: "Giao cho thương lái", date: "22/10/2026", detail: "Cân tại cảng số 2, giao cho Đại lý Đức Phát." },
  ],
};
