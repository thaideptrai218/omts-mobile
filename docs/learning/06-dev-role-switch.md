# Dùng một tài khoản Zalo để thử nhiều vai trò

Người dùng yêu cầu thử các vai trò bằng số điện thoại đã liên kết, vì không có số/tài khoản Zalo khác. Tài khoản được xác nhận trong DB đang là Chủ HTX; không cần tăng thêm quyền cho tài khoản thật.

## Cách dùng

Trong Device mode, mở trang chủ hoặc Tài khoản, tìm **Thử vai trò · bản dev**, chọn Chủ HTX / Quản lý vùng / Nhân viên / Thương lái và xác nhận chuyển.

Mỗi vai trò ngoài Chủ HTX dùng một hồ sơ thử nội bộ riêng. Hồ sơ được tạo khi chuyển sang vai trò đó lần đầu; không có số điện thoại, Zalo ID hoặc mật khẩu mà người dùng biết. Nhân viên/Quản lý vùng có hồ sơ Employee, Thương lái có Customer. Khi phân công, chọn đúng tên “Nhân viên thử” hoặc “Quản lý vùng thử” sau khi đã mở vai trò đó một lần. Quay về Chủ HTX sẽ dùng lại tài khoản gốc.

Tài khoản, số điện thoại, Zalo ID và quyền của Chủ HTX thật giữ nguyên. Phiên cũ bị thu hồi khi chuyển; backend phát phiên mới bằng luồng session bình thường, mobile bỏ quyền/dữ liệu người cũ và tải quyền từ server. Đây không phải đổi nhãn role ở frontend.

## Giới hạn truy cập

- Chỉ chạy trong ASPNETCORE_ENVIRONMENT=Development.
- Mặc định tắt. Cấu hình local qua Development:TestRoles:Enabled và Development:TestRoles:OwnerAccountId; không đưa giá trị của tài khoản thật vào source hoặc env example.
- Chỉ tài khoản Owner đã liên kết Zalo, đã xác minh điện thoại, đang hoạt động và được chỉ định mới mở công cụ; hồ sơ thử do tài khoản đó tạo mới được chuyển lại.
- Anonymous bị 401; tài khoản khác bị 403; request chọn role không được hỗ trợ bị 400. API không nhận accountId đích tùy ý.
- Production vô hiệu cấu hình và trả 404 cho công cụ, kể cả khi biến Enabled được đặt nhầm.
- Token của các hồ sơ thử cũng bị từ chối nếu tắt công cụ, đổi tài khoản được cho phép, hoặc tài khoản gốc bị khóa/gỡ liên kết; không chỉ ẩn nút trên UI.
- Không thêm vai trò Kế toán hay quản trị hệ thống.
- Dùng namespace username dev_<owner-guid>_<persona> cho hồ sơ thử; không dùng namespace này cho tài khoản thật.

## Tình trạng luồng nghiệp vụ

Bộ chuyển giúp thử những màn/API hiện có bằng một Zalo. Yêu cầu mua theo lồng và phản hồi Chủ HTX đã nối API ngày 31/10 (xem `07-cage-purchase-requests.md`). Thu hoạch/cân hàng/QR truy xuất thật chưa có luồng đầy đủ. Không tạo hóa đơn hoặc QR giả rồi báo thành công.

## Kiểm chứng

- Backend: 880 bài đạt (Domain 2, Application 133, API Integration 745); 104 bài cần dịch vụ ngoài được bỏ qua.
- Test mới: mặc định tắt/anonymous, đúng tài khoản, từ chối tài khoản khác/role không hợp lệ, chuyển đủ vai trò và giữ nguyên tài khoản gốc, thu hồi token cũ, refresh giữ persona, hồ sơ không có số/Zalo ID, tắt công cụ chặn token/refresh và Production không mở API.
- Mobile lint/typecheck/build đạt. Playwright dùng API fixture xác nhận lựa chọn chưa gửi request cho tới khi xác nhận, chuyển đủ 4 vai trò, thay session/quyền và về đúng Owner, không có runtime error.
- EF không có pending model changes; không cần migration mới.
- API dev đang public có health 200; công cụ trả 401 khi không có xác thực. Chưa thao tác chuyển bằng điện thoại thật của người dùng.

## Lỗi trong quá trình kiểm tra

- Helper LoginAsync của test chỉ nhận AuthApiFactory, còn WithWebHostBuilder trả WebApplicationFactory: thêm helper đăng nhập qua HTTP cho factory con, không ép kiểu.
- Username với tiền tố dài vượt giới hạn SQL 50 ký tự: rút namespace xuống dev_ để tên dài nhất là 48 ký tự.
- Playwright chờ networkidle bị timeout do kết nối dev kéo dài: chờ DOM màn khách sẵn sàng rồi thử, không coi timeout đó là lỗi ứng dụng.
- dotnet run có thể mở file exe ở bin cũ dù đã build BaseOutputPath khác: chạy trực tiếp DLL vừa kiểm chứng trên cổng riêng và đổi upstream proxy, không dừng API đang chạy.
