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
