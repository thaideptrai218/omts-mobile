# Bổ sung vai trò Mobile theo DOCX V8

Nguồn: [Report-3 Software Requirement Specification V8](https://drive.google.com/file/d/1wXDOBumQUmn-XQvOMUg9ejerTbVZx6V7/view), bản sửa 28/10/2026; đối chiếu I.4.1, I.4.4, LABOR-02/04/05/07/08/10/15 và BR-LABOR-05/08/13.

## Kết quả đối chiếu

| Vai trò trong DOCX V8 | Trước đợt này | Bổ sung trong đợt này |
| --- | --- | --- |
| Chủ HTX | Có màn vùng, bè, nhân sự, quyền, mua hàng và liên kết | Phân công/chấm công, duyệt nghỉ phép, cài đặt giờ nghỉ/làm tròn và danh mục loại việc |
| Quản lý vùng | Nhiều ô chức năng còn là trang chờ, trang chủ dùng số liệu mẫu | Phân công theo bè/ngày, chuyển phân công khi chưa vào ca, đổi việc cho đội, ghi vào/ra bằng QR hoặc thủ công; menu mua hàng/nước theo quyền |
| Employee / Nhân viên | Chưa có màn công việc cá nhân thật | Phân công theo tháng, QR có hạn, lịch sử giờ làm, gửi/hủy nghỉ phép và xem phản hồi |
| Thương lái | Có liên kết và bản xem thử yêu cầu mua | Không đổi nghiệp vụ trong đợt này; bản yêu cầu mua vẫn chưa gửi API thật |
| Public Viewer | Có tra cứu/QR mẫu | Không đổi trong đợt này |
| Kế toán | Có khung/màn dùng chung từ trước | Không bổ sung chức năng riêng, theo yêu cầu người dùng |

System Administrator không còn là actor nghiệp vụ trong V8; không tự thêm màn cho vai trò này. Registered User là actor trừu tượng, không phải một vai trò mới.

Đây là phần công việc/chấm công cơ bản cho hai vai trò còn thiếu. Không phải toàn bộ 80 use case của SRS đã hoàn thành. Các phần chưa triển khai tiếp tục giữ trạng thái chưa có, không báo lưu thành công bằng dữ liệu giả.

## Định danh và phạm vi

Giữ quyết định đã chốt của dự án: Mobile liên kết Zalo bằng số điện thoại, backend khớp tài khoản có sẵn. Không thêm màn mật khẩu hoặc mã đăng nhập nhân viên riêng của tài liệu. Hồ sơ Employee đang làm việc, gắn với tài khoản Staff đã liên kết Zalo, được vào phần cá nhân ngay cả khi không có quyền quản lý vùng. Tài khoản không có quyền quản lý vẫn bị từ chối khi mở API nghiệp vụ.

Nhân viên chỉ đọc dữ liệu suy từ account hiện tại; API cá nhân không nhận employeeId từ client. Trên frontend, gate so cả accountId của quyền và phiên; đổi tài khoản remount màn để bỏ dữ liệu/form cũ. Người không có hồ sơ nhân sự nhận màn hướng dẫn nhờ Chủ HTX liên kết hồ sơ, không tự chọn hồ sơ người khác.

Quản lý vùng thao tác trong phạm vi quyền hiện tại. API kiểm tra lại vùng của bản ghi và vùng đích khi chuyển bè. Quyền chấm công độc lập vẫn đọc được đội, nhưng không tạo phân công nếu thiếu WORK_ASSIGNMENTS/Create. Duyệt nghỉ phép và cấu hình chấm công là Owner-only.

## Luồng dữ liệu

- `/account/work`: GET `/api/me/workforce?from=...&to=...`; QR từ POST `/api/me/attendance-qr`; nghỉ phép POST/DELETE `/api/me/leave-requests`.
- `/manage/workforce`: lookup loại việc/nhân viên, danh sách theo ngày; tạo/gỡ phân công, đổi việc cho đội, ghi vào/ra. Nút ghi công luôn mở xác nhận trước khi gửi.
- `/manage/leave-requests`: Owner xem/duyệt/từ chối. Phê duyệt cho phép ghi chú trống, từ chối bắt buộc lý do. Yêu cầu đã hủy/đã duyệt không được duyệt lại.
- `/manage/attendance-settings`: loại việc dùng cho phân công; phiên bản giờ nghỉ/làm tròn có ngày áp dụng. Không thêm bảng giá, tính lương hoặc trả lương.
- Thông báo phân công và nghỉ phép có liên kết đến màn tương ứng trong inbox. Push bên ngoài điện thoại vẫn phụ thuộc kênh OA/push thật đã bàn trước, chưa được bật trong đợt này.

QR chỉ chứa mã ngẫu nhiên có hạn 1 phút, server lưu hash, gắn đúng hồ sơ nhân viên; không dùng QR tĩnh bằng employeeId. Tạo mã mới thay mã cũ. Không lưu QR hoặc token vào log/tài liệu.

Giờ vào/ra lấy từ server. Ra ca khi thiếu giờ vào vẫn lưu bản ghi thiếu, không tự điền giờ. Đổi việc khi đang làm thêm một khoảng giờ mới. Theo BR-LABOR-05: trừ phần giờ nghỉ giao với từng khoảng, cộng các khoảng cùng loại việc trên mọi bè, rồi làm tròn xuống một lần. Mặc định không nghỉ/không làm tròn; giữ các cài đặt cũ theo ngày. Ngày thiếu giờ không tính giờ công. Kỳ lương đã chốt chặn việc sửa công/cài đặt liên quan.

Nghỉ phép được hiển thị lúc chọn người để phân công; không tự xóa phân công hoặc trừ lương. Chặn hai yêu cầu đang chờ có ngày trùng nhau; clientOperationId giúp gửi lại sau lỗi mạng không tạo bản sao. Yêu cầu hủy được giữ lại.

## Những việc còn thiếu so với SRS

- Yêu cầu sửa giờ chấm công bị thiếu và màn Owner sửa giờ; kiểu Staff/Seasonal riêng, chấm công staff không cần phân công, nhập giờ bắt đầu đội và các biến thể còn lại của LABOR-04.
- Lương/phiếu lương và bảng giá công không làm trong đợt này; danh mục loại việc hiện phục vụ phân công/chấm công, chưa phải hoàn tất LABOR-11.
- Chu kỳ nuôi, thả giống, nhật ký, thu hoạch, bán hàng/truy xuất thật và các use case còn thiếu của Chủ HTX/Quản lý vùng chưa được triển khai bởi thay đổi này.
- Thương lái mua hàng vẫn là bản xem thử, Public Viewer vẫn có dữ liệu mẫu. Không coi hai phần này đã hoàn tất API theo V8.
- Quyền camera/quét QR và thao tác trên điện thoại Zalo thật cần kiểm tra thiết bị.
- Backend process đang chạy trước đó không bị dừng/khởi động lại; thay đổi này chưa được deploy Zalo.

## Kiểm chứng và lỗi đã xử lý

Mobile: lint, typecheck, build; Playwright ở màn 390×844 với API fixture kiểm tra công việc cá nhân, QR tạo trên thiết bị, số giờ, gửi nghỉ phép, gate quản lý, xác nhận chấm công và gate Owner. API nghiệp vụ được kiểm tra thật bằng integration host, không chỉ qua fixture trình duyệt.

Backend: integration tests kiểm tra anonymous/nhân viên/Quản lý vùng, vùng khác, quyền chỉ chấm công, trùng phân công, ngăn đổi phân công sau vào ca, QR hết hạn/sai, ra thiếu vào, đổi việc tách khoảng giờ, yêu cầu nghỉ phép và hủy, Zalo link cho nhân viên không có quyền quản lý, nghỉ việc không cho liên kết, khóa kỳ lương. Unit tests dùng đúng ví dụ SRS 06:10 → 09:40 → 16:55, nghỉ 11:30–12:30 và gom cùng loại việc trên nhiều bè trước khi làm tròn.

Kết quả cuối: Mobile lint/typecheck/build đạt; Playwright đạt, không có lỗi runtime. Backend build 0 warning/0 error; Domain 2 + Application 133 + API Integration 741 = 876 bài đạt, 104 bài tích hợp SQL Server/Azurite bên ngoài được bỏ qua. Kiểm tra EF không có pending model changes.

Migration EF được sinh bằng CLI và áp dụng lên DB dev: AddEmployeeWorkforce, AddLeaveRequestCancellation; không sửa tay migration. Không sửa hoặc commit file env.

Lỗi kiểm chứng:
- Truyền BaseOutputPath qua `dotnet ef -p:` bị hiểu nhầm project option: dùng biến môi trường BaseOutputPath.
- So sánh JsonElement trực tiếp trong test cho ra false dù cùng GUID: so sánh GetGuid().
- Test nhắc nước cũ cộng 1 giờ từ UtcNow lúc sát nửa đêm Việt Nam thành ngày tiếp theo: cố định số đo ở 06:00 giờ Việt Nam để đúng giả thiết cùng ngày.
- Typecheck phát hiện tên trường Employee lặp trong danh mục dịch: giữ một mục.
- Hook quyền trả tiền ban đầu đặt ở component cha nhưng form là component con: chuyển hook vào ReceiptForm.

## Mất kết nối khi thử trên Zalo

Mobile dev vẫn trỏ tới tunnel HTTPS cũ trong cấu hình local, trong khi API đã chuyển sang tunnel mới. Đổi riêng VITE_API_BASE_URL trong env local, giữ các khóa khác; Vite tự nạp lại cấu hình. Đọc module cấu hình đang phục vụ để xác nhận URL đã đổi và gọi health của API mới nhận 200. Không cần gỡ liên kết Zalo; chưa xác nhận lại trên điện thoại sau thay đổi.