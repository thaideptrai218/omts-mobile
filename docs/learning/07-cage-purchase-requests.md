# Yêu cầu mua theo lồng — 31/10/2026

Theo yêu cầu trực tiếp của chủ dự án, thay bản xem thử bằng yêu cầu mua được lưu trên backend; số lượng đặt mua là **số lồng nguyên**, không phải kg. Quyết định này thay trường số kg của SALE-01/03 trong DOCX V8 cho bước đặt mua.

Thương lái mở Mua hàng của tôi, chọn sản phẩm thật trong danh mục của HTX, nhập số lồng và ngày nhận, kiểm tra rồi bấm Gửi yêu cầu mua. Backend tự lấy hồ sơ khách hàng từ tài khoản đang gọi, không nhận customerId từ ứng dụng. Yêu cầu chuyển sang chờ phản hồi; Chủ HTX nhận thông báo trong ứng dụng.

Chủ HTX mở Yêu cầu mua, chấp nhận số lồng từ 1 đến số lồng đặt, xác nhận ngày nhận và tùy chọn trả sau; hoặc từ chối kèm lý do. Thương lái đọc được phản hồi sau khi tải lại, rời màn hoặc đổi vai trò. Thương lái được hủy yêu cầu của mình khi chờ phản hồi hoặc đã chấp nhận và chưa thực hiện. Chưa có nghiệp vụ thực hiện/giao hàng trong lát cắt này; khi bổ sung phải đóng quyền hủy theo tiến độ giao thực tế.

Màn Sản phẩm bán của Chủ HTX quản lý mã, tên, mô tả và ngừng bán/dùng lại; sản phẩm không còn khả dụng không được đặt mới. Tên sản phẩm tại thời điểm đặt được giữ trong yêu cầu để lịch sử không đổi khi sửa danh mục. Dữ liệu đơn cũ tính kg không được chuyển đổi sang lồng. Cân hàng, hóa đơn, công nợ, thanh toán và QR truy xuất chưa được tạo từ yêu cầu này; cân thực nhận theo kg sẽ là dữ liệu riêng.

## Hợp đồng

- `GET/POST /api/me/purchase-requests`, `GET /api/me/purchase-requests/{id}`, `POST …/{id}/cancel`: chỉ thương lái, chỉ dữ liệu của mình.
- `GET /api/purchase-requests`, `GET …/{id}`: Chủ HTX hoặc nhân viên có quyền xem `PURCHASE_REQUESTS`; `POST …/{id}/response` chỉ Chủ HTX.
- `GET /api/sales-products`: thương lái/Chủ HTX; `includeUnavailable=true`, tạo và sửa sản phẩm chỉ Chủ HTX.
- `requestedCages`, `acceptedCages`: số nguyên dương, API trả `quantityUnit: "Cage"`. Không làm tròn, không quy đổi kg.
- Phân trang 20 dòng trên mobile, lọc trạng thái `AWAITING_RESPONSE`, `ACCEPTED`, `DECLINED`, `CANCELLED`.
- `clientOperationId` giữ nguyên khi thử gửi lại; backend có chỉ mục duy nhất theo khách hàng và lần gửi. Cùng lần gửi và cùng dữ liệu trả lại bản ghi cũ, không gửi thông báo lần hai; khác dữ liệu bị từ chối.
- Phản hồi/hủy/sửa danh mục dùng `rowVersion`. Lỗi hoặc mất mạng hiện trạng thái thất bại và cho thử lại; không thêm hàng đợi offline.

## Kiểm tra

12 ca API kiểm tra lưu dữ liệu, đơn vị lồng, nhập số thập phân/âm/tràn số, danh mục/ngày không hợp lệ, gửi lại không trùng, quyền truy cập riêng, phản hồi/hủy, phiên bản xung đột và phân trang. Toàn bộ backend: 892 bài đạt (2 Domain, 133 Application, 757 API), 104 bài cần dịch vụ ngoài bỏ qua. Lint, typecheck và build mobile đạt; EF không còn pending model changes.

Kiểm tra trình duyệt dùng API fixtures đi qua form thương lái → phản hồi Chủ HTX → quay lại thương lái/hủy và thêm sản phẩm, không có runtime error; fixtures không phải bằng chứng thao tác trên điện thoại thật. Thêm kiểm tra trên SQL Server bằng các service/repository thật trong giao dịch: lưu 20 lồng, xóa tracking và đọc lại, thử gửi lại cùng operation, Chủ HTX nhận 18 lồng, thương lái đọc phản hồi và hủy bằng rowVersion do SQL cấp. Giao dịch thử được rollback và xác nhận không lưu lại tài khoản/sản phẩm/yêu cầu/thông báo thử.

Migration `AddCagePurchaseRequests` đã áp dụng trên DB dev; API mới chạy ở cổng riêng và proxy public chuyển sang bản này, không dừng API trước đó. Device mode nhận thay đổi qua hot reload, không khởi động lại phiên Device. Danh mục dev ban đầu trống: Chủ HTX thêm sản phẩm thật trước khi chuyển Thương lái đặt mua.

Typecheck ban đầu báo `TS2741: Property 'value' is missing … CheckboxProps` ở hai checkbox mới. ZaUI yêu cầu `value` kể cả khi điều khiển bằng `checked`; đã thêm giá trị cố định riêng cho trạng thái bán và trả sau, kiểm tra lại typecheck thành công.
