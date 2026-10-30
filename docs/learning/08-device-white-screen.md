# Device mode trắng màn — 31/10/2026

> Trạng thái sau phản hồi người dùng: link phục hồi bị Zalo báo không hợp lệ. Chỉ kiểm tra HTTPS và hot reload trên trình duyệt đã đạt; chưa xác nhận mở được Mini App trên điện thoại. Không xem đường fallback là link Device đã hoạt động.

## Dấu hiệu và nguyên nhân

Sau khi khởi động lại `zmp start --device`, phiên mới dùng tên miền khác, trong khi Mini App mở từ QR cũ vẫn trỏ tới phiên cũ. Kiểm tra thực tế còn thấy cả đường dẫn mới của relay `mini.123c.vn` timeout khi GET `hr.config.json` và mã khởi tạo. Gửi HEAD có thể trả 200 nhưng không chứng minh app tải được.

Chuỗi kết nối là điện thoại Zalo → relay tạm của CLI → Vite trên máy tính; sau khi giao diện khởi tạo mới gọi API backend. Tải bootstrap/JS thất bại có thể gây trắng màn dù backend vẫn khỏe. Hot reload còn cần WebSocket của Vite hoạt động trên đường kết nối này.

Khi kiểm tra lại trước khi push còn thấy hai tiến trình `zmp start --device` chạy đồng thời. Điều này làm việc xác định QR của phiên đang dùng khó hơn; chưa có log điện thoại để kết luận đây là nguyên nhân của mọi lần lỗi.

Giao diện trên localhost vẫn hiện trang khách. Backend public trả `/health/ready` 200 và Swagger 200. Vì vậy ở lần này lỗi nằm ở đường tải giao diện Device, chưa có bằng chứng lỗi từ chức năng mua theo lồng hoặc mất liên kết Zalo. Không xóa phiên, không tạo lại hồ sơ, không dừng API.

## Xử lý

Khởi động lại riêng tiến trình Node của Device sau khi kiểm tra đúng command line. GET qua relay mới vẫn timeout, nên chuyển đường tải giao diện sang tunnel HTTPS đang hoạt động của backend bằng một proxy local dùng trong phiên dev:

- `/api/*`, `/health/*`, `/swagger/*` tiếp tục chuyển tới API hiện hành; `/api/dev/*` vẫn bị chặn ở public proxy.
- Bootstrap, JS, CSS và tài nguyên Device chuyển tới Vite ở localhost:5173.
- Thay địa chỉ relay trong nội dung bootstrap/Vite client bằng origin HTTPS hiện hành, chuyển WebSocket HMR tới Vite.
- Bỏ script remote-debug tùy chọn ở bootstrap của đường thay thế vì nó dùng relay đang lỗi. Luồng app và hot reload không phụ thuộc debugger này; không có remote inspector qua đường thay thế.
- Tạo QR `TESTING_LOCAL` với `clientIp` là origin HTTPS thay thế. Phải đóng Mini App đang trắng và mở từ QR/link mới một lần.

Thử nghiệm thay clientIp bằng tunnel backend chỉ tải được giao diện trong trình duyệt; Zalo đã từ chối link đó. Kiểm tra HTTP 200 và browser không đủ để công bố một link Device hợp lệ. Cần dùng QR do phiên CLI thực tế sinh và xác nhận trong Zalo, hoặc thử một bản Development đã deploy. Chưa xác định điều kiện cụ thể khiến Zalo từ chối link fallback; không suy diễn đây là lỗi API hay lỗi tài khoản.

Proxy phục hồi của phiên nằm tại `%TEMP%/omts-device-shared-proxy.cjs`, cổng 5201; stdout/stderr tại `%TEMP%/omts-device-shared-proxy.*.log`. Device chạy riêng với log `%TEMP%/omts-device-live.*.log`. Các file này là công cụ local cho phiên kiểm tra, không phải hạ tầng triển khai chính thức. Không thay đổi `.env`, cơ chế xác thực hay dữ liệu nghiệp vụ trong lần khắc phục này.

## Kiểm chứng

- GET bootstrap và entry qua HTTPS ngoài máy trả 200; bootstrap không còn phụ thuộc tên miền `mini.123c.vn`.
- Trình duyệt qua HTTPS tải được trang khách và nút Liên kết tài khoản, không có request tải tài nguyên thất bại. SDK không chạy trong Zalo vẫn có lỗi nền `Object` như khi thử localhost; không xem browser là bằng chứng liên kết trên điện thoại.
- WebSocket `wss` qua HTTPS kết nối thành công; đổi mtime stylesheet (không đổi nội dung file) nhận được bản tin HMR `update`, giao diện tiếp tục hiển thị.
- Backend health/ready và Swagger vẫn 200. Không sửa source ứng dụng trong lần này, chỉ thêm ghi chép; `git diff --check` đạt.
- Đã gửi QR phục hồi và yêu cầu người dùng xác nhận trên điện thoại. Tunnel vẫn là kết nối tạm: cần giữ Device, proxy và cloudflared chạy để sử dụng/hot reload.
