# Xác nhận nhân lực cho yêu cầu mua — 31/10/2026

## Vấn đề và quyết định

Luồng cũ cho Chủ HTX nhận yêu cầu ngay. Chủ dự án yêu cầu hỏi nhân viên có tham gia ca trong ngày không trước khi nhận đơn. Đã xác nhận rõ: **Owner quyết định sau khi có phản hồi**, không tự động nhận/từ chối khi đủ/thiếu người.

Mobile mặc định 20 lồng/người/ngày, Owner được chỉnh khi lập kế hoạch. Số người cần được làm tròn lên; 100 lồng cần 5 người ở năng suất mặc định. 4 người đồng ý chưa đủ điều kiện nhận. Nếu chưa đủ, Owner có thể mời thêm người hoặc từ chối đơn kèm lý do gửi thương lái.

## Tổ chức mã và luồng dữ liệu

- Model `features/sales/models/PurchaseStaffing.ts` khai báo kế hoạch, lời mời, phản hồi và tiến độ. `PurchaseRequest.ts` thêm `AWAITING_STAFF` và `staffing`.
- Service `features/sales/services/purchaseStaffingService.ts` gọi API; không giữ model hay tự giả phản hồi nhân viên.
- Owner xem đơn ở `PurchaseRequestsPage`, lập kế hoạch và đọc phản hồi qua component `PurchaseStaffing`. Nút nhận bị khóa khi chưa đủ; backend kiểm tra lại nên không thể bỏ qua điều kiện bằng HTTP trực tiếp.
- Nhân viên mở Công việc của tôi → Phân công → Lời mời ca cho đơn hàng (`workforce/components/MyPurchaseShifts`). Chọn tháng của ngày được mời, đồng ý hoặc từ chối kèm lý do. Lời mời tách khỏi việc chấm công thực tế.
- Khi gửi lời mời, đơn chuyển sang `AWAITING_STAFF`. Khi đủ người, đơn vẫn chờ Owner quyết định. Số lồng/ngày nhận khi nhận đơn phải khớp nội dung ca đã gửi.
- Giữ nguyên nội dung ca đã gửi; có thể mời thêm nhân viên. Mỗi nhân viên chỉ giữ một đơn mỗi ngày. Từ chối/hủy đơn giải phóng ngày giữ, không xóa lịch sử.
- Thương lái thấy tiến độ tổng, không nhận danh sách tên/lý do riêng của nhân viên. Có thể hủy yêu cầu trong giai đoạn chờ nhân viên.
- Thông báo in-app dẫn nhân viên đến Công việc của tôi, dẫn Owner đến Yêu cầu mua. Không bổ sung kênh push ngoài màn hình điện thoại trong thay đổi này.

## Vì sao cần cả kiểm tra ứng dụng và SQL

Hai request có thể cùng đọc thấy nhân viên rảnh rồi cùng ghi. Kiểm tra trước khi lưu chưa đủ: unique index lọc `(EmployeeId, ReservedWorkDate)` bảo vệ ngay trong SQL. Khi nhân viên trả lời, backend cũng sửa parent để rowversion chặn việc Owner nhận/hủy dựa trên số người cũ. Cùng một SaveChanges lưu phản hồi, tiến độ, audit và thông báo; xung đột rollback cả thao tác.

## Lỗi đã gặp và cách kiểm tra

- Fixture Staff ban đầu thiếu liên kết Zalo nên `/api/auth/login` trả 403 `MSG13`. Chẩn đoán `AuthService.HasEffectiveAccessAsync` cho thấy nhân viên không có grant chỉ được vào khu cá nhân khi có hồ sơ đang làm và đã liên kết. Bổ sung Zalo ID sinh ngẫu nhiên trong fixture, không nới kiểm tra auth hoặc thêm fake vào luồng thật.
- Bản migration thử đầu sửa transition có sẵn để trỏ status mới; kiểm tra mã sinh thấy `UpdateData` đứng trước `InsertData` status, có nguy cơ lỗi FK. Gỡ scaffold chưa áp dụng bằng EF, thay transition cũ bằng transition mới rồi sinh lại. Migration cuối đã chạy thành công trên SQL thử và DB dev; không viết tay migration.
- SQL test đầu dùng `Cooperative.Name`, build báo `CS0117`; entity thực dùng `FullName`, đã sửa fixture theo schema.
- Chạy hai build test vào cùng output trong lúc testhost đang giữ DLL gây `MSB3026/MSB3027`. Chờ suite xong rồi chạy kiểm tra SQL tuần tự, không kill process. Các build dùng thư mục temp riêng với API đang chạy.
- Script trình duyệt tìm `input[type=date]` bị timeout vì `DateField` thực dùng ZaUI DatePicker. Chuyển ca kiểm tra sang ngày mặc định của form. Tiến độ có ở cả Facts và panel nên locator một dòng chữ bị strict-mode; chọn phần tử đầu. Đây là lỗi script kiểm tra, không đổi component ngày để chiều theo script.
- Trình duyệt ngoài Zalo vẫn phát một pageerror `Object`, trùng baseline ghi ở lesson 10; không coi các kiểm tra fixtures là bằng chứng chạy thành công trên điện thoại.
- Sau khi migration lên dev nhưng API mới không khởi chạy được do chặn tự động, `GET /health/ready` của process cũ trả 503 `status-catalog`. Readiness bản cũ kiểm tra đủ ID transition 77 đã bị migration mới thay bằng 84. Khôi phục riêng row tương thích 77 trên DB dev, không sửa đơn hay lời mời; local/public readiness đã về 200. Không dừng backend/tunnel. Seed/source mới vẫn dùng bước xác nhận nhân lực; row dev tương thích chỉ dọn khi không còn dùng API cũ.

## Bằng chứng

- `npm run lint`, `npm run typecheck`, `npm run build`: đạt; build còn cảnh báo Sass/Tailwind/chunk có sẵn.
- Suite backend: 898 đạt, 105 bỏ qua do dịch vụ ngoài. Chạy riêng Sales trên bản cuối với SQL cấu hình: 19/19 đạt, gồm kiểm tra migration, trùng ca và rowversion trên SQL thật. 104 ca dịch vụ ngoài còn lại chưa chạy.
- UI fixtures: thương lái gửi 100 lồng; Owner mời 5 người; 4/5 không nhận được đơn; đủ 5/5 thì Owner nhận; thương lái đọc kết quả; từ chối đơn bắt buộc lý do. Script kiểm tra tạm `omts-staffing-browser.mjs`; server UI tạm đã đóng.
- EF không còn pending model changes. Migration `20261030203817_AddPurchaseStaffing` đã áp dụng DB dev.
- Bộ duyệt tự động chặn lệnh chạy API mới ở cổng 5204 với lý do duy nhất `blocked by policy`. Chưa đổi proxy, không dừng Device/backend/tunnel. **Mini App hiện vẫn gọi backend cũ; cần cập nhật process phục vụ API trước khi thử luồng mới thật.**
- Không sửa `.env` hoặc thông tin bí mật; chưa commit/push thay đổi này.

## Câu hỏi bảo vệ

- Vì sao 101 lồng cũng cần 6 người? Vì mỗi người có công suất 20 cho ngày đó, phải làm tròn lên để đủ công suất.
- Đủ người thì tự nhận không? Không, Owner đã được chủ dự án xác nhận là người quyết định cuối.
- Có thể sửa ngày sau khi nhân viên đồng ý không? Không trong lát cắt này; phản hồi phải gắn với nội dung ca mà nhân viên đã đọc.
- Đồng ý ca có tạo giờ công hoặc xác nhận thu hoạch chưa? Chưa; đây là cam kết tham gia để quyết định nhận đơn. Phân công tại bè, vào/ra ca và thực hiện thu hoạch là dữ liệu nghiệp vụ tiếp theo.
