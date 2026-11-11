import type { DemoAccount } from "@/features/auth/models/DemoAccount";

/**
 * Năm tài khoản do lệnh seed demo của backend tạo (README "Run with Docker"), dùng chung mật khẩu demo của bản dev.
 * Chỉ bản dev chạy ngoài Zalo mới hiện danh sách này; trong Zalo vẫn là "Liên kết tài khoản".
 */
export const DEMO_ACCOUNTS: DemoAccount[] = [
  { username: "owner", role: "Chủ HTX", name: "Nguyễn Văn Hải", hint: "Nhận đơn, lập kế hoạch, xem mọi vùng" },
  { username: "quanlyvung1", role: "Quản lý vùng", name: "Lê Minh Tuấn", hint: "Vùng DEMO-01: thu hoạch, cân, lập hóa đơn" },
  { username: "thuonglai1", role: "Thương lái", name: "Nguyễn Thị Hương", hint: "Đặt lồng, đồng ý số cân, xem hóa đơn" },
  { username: "nhanvien1", role: "Nhân viên", name: "Nguyễn Văn Bình", hint: "Nhận ca thu hoạch, xem việc của tôi" },
  { username: "nhanvien2", role: "Nhân viên", name: "Trần Văn Khoa", hint: "Nhận ca thu hoạch, xem việc của tôi" },
];
