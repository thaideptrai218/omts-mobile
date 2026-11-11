# Deploy Testing ngày 06/11/2026

Người dùng yêu cầu mở tunnel backend, nối mobile và deploy bản Testing. Backend hiện tại build đạt, chạy local cổng 5198 với Zalo Graph; proxy cổng 5200 chặn `/api/dev/*` và cho phép Swagger. Health/DB/readiness qua HTTPS trả 200, CORS cho `https://h5.zdn.vn` trả 204. `.env` local đã cập nhật URL tunnel; bundle production chứa đúng URL và không chứa ZMP token hay mật khẩu demo dev.

Lệnh deploy: `zmp deploy --passive --testing --mode production`. CLI build thành công nhưng trả `Permission denied. Please login again. (Tips: Run 'zmp login')`. Kiểm tra cục bộ trường `exp` của JWT xác nhận token ZMP đã hết hạn, không có biến môi trường ghi đè token trong `.env`. Chỉ đọc cờ hết hạn, không in token hay claims cá nhân. Đây là lỗi xác thực của công cụ deploy; không phải lỗi build hay tunnel.

Đã gọi luồng QR chính thức của CLI. Chưa nhận được xác nhận trên điện thoại trong thời hạn phiên, nên CLI kết thúc với `Login failed!`, `Request Timeout`. Chưa có phiên bản Testing mới được tạo; không dùng QR đăng nhập đã hết hạn làm QR mở app.

Kiểm tra thêm khi người dùng yêu cầu đúng loại phiên bản: CLI 4.0.5 dùng mã số `versionStatus.TESTING = 2`, không phải chuỗi `"TESTING"`. Đã sửa script tự đăng nhập/deploy trong temp để lấy hằng số từ CLI và chỉ chấp nhận target 2; đồng thời kiểm tra receipt có `status: TESTING` trước khi công bố QR mở app. Nhánh deploy của script cũ chưa chạy vì đăng nhập chưa thành công. `--mode production` là chế độ đóng gói Vite, độc lập với đích `--testing` của Zalo; không thay bằng build Development để tránh đưa mật khẩu demo dev vào bundle.

Cần người có quyền Developer/Admin chạy `zmp login`, chọn đăng nhập QR và xác nhận bằng Zalo. Sau khi đăng nhập thành công, chạy lại lệnh deploy Testing. Backend và tunnel vẫn chạy; không push env hoặc token lên Git. URL Quick Tunnel thay đổi khi tạo phiên tunnel mới nên bản Testing cần build/deploy lại nếu URL thay đổi.
