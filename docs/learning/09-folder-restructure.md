# Sắp xếp folder — 31/10/2026

Người dùng yêu cầu dọn cấu trúc trước khi tiếp tục xử lý việc mở Mini App. Trước đó một chức năng mobile nằm rải ở pages, services, state và components; backend có các file chứa nhiều DTO/interface/record và controller đặt chung một thư mục.

## Cách chia

Mobile dùng app / features / shared. App ghép khung và router; mỗi feature giữ màn, API, trạng thái và component riêng; shared giữ HTTP, phiên, SDK Zalo, định dạng, hooks và UI dùng chung. 124 file được chuyển nhóm. Tách UUID chống gửi trùng và kiểu phân trang khỏi nghiệp vụ nuôi trồng/tổ chức. Tách lô truy xuất mẫu khỏi cấu hình HTX. Các nhóm quản lý có routes riêng. Giữ entry `src/app.ts`, ảnh import trong `src/static/images` và cấu hình công cụ ở gốc.

ESLint chặn shared import feature/app và feature import app. Header chung nhận chuông do nơi gọi truyền vào, tránh shared phụ thuộc nghiệp vụ thông báo. Script kiểm tra tài khoản chuyển vào `scripts/testing`.

Backend giữ các project Domain/Application/Infrastructure/Api, gom controller vào 10 nhóm và repository theo nghiệp vụ. Tách 71 file nhiều kiểu thành từng file cùng tên bằng Roslyn, giữ thân kiểu và chú thích. DTO ở Dtos, dữ liệu nội bộ ở Models; dữ liệu trao đổi qua cổng ở Common/Models. Cổng thông báo chuyển sang Common/Interfaces/Messaging. Namespace cập nhật theo folder; partial repository vẫn dùng chung namespace. Entity/configuration tách file cùng namespace, giữ nguyên model DB.

Hai repo vẫn ở vị trí hiện tại, không di chuyển `.git`, env hoặc các thư mục đang dùng bởi API chạy. `OMTS.code-workspace` ở gốc workspace mở thẳng hai repo trong VS Code. Hướng dẫn hiện hành nằm ở `docs/PROJECT_STRUCTURE.md` của từng repo.

## Kiểm chứng

- Mobile: lint/typecheck/build đạt; thử luật lint với import bị cấm và xác nhận bị chặn. 48 khai báo route khớp trước/sau. Browser fixtures chạy được luồng mua theo lồng, Chủ HTX phản hồi, thương lái hủy, quản lý sản phẩm và chuyển đủ bốn vai trò.
- Backend: build không warning/error; toàn bộ 892 bài đạt, 104 bài yêu cầu dịch vụ ngoài bỏ qua. 740 khai báo kiểu được kiểm tra vị trí/namespace theo bản đồ chuyển file. EF báo không có pending model changes; không tạo migration cho lần dọn folder.
- OpenAPI đối chiếu API trước dọn và test host sau dọn: 136 đường dẫn ứng dụng giữ nguyên method, tham số, schema dữ liệu vào/ra và yêu cầu xác thực. Các endpoint test-only của fixture không thuộc API ứng dụng.
- `.env` mobile được đối chiếu hash trước/sau, không đổi. Không đẩy code/env lên remote trong bước này.
- Link fallback trước đó bị người dùng báo không hợp lệ trong Zalo. Kiểm tra browser không thay cho xác nhận trên điện thoại; việc dọn folder chưa xử lý xong lỗi link đó.

## Lỗi gặp và cách sửa

- Script gom kiểu Paged chạy trúng file Paged mới, sinh self-import và TS2459, kéo theo generic unknown ở danh sách nhân viên/tài khoản. Khôi phục một định nghĩa export duy nhất tại shared/api/paged.ts; các service chỉ import kiểu đó. Typecheck và lint sau sửa đạt.
- Bộ lập kế hoạch tách C# phát hiện hai phần partial PurchaseReceiptRepository cùng tên đích trước khi di chuyển. Giữ tên file truy vấn riêng cho phần partial; không ghi đè nội dung.
- Build báo CS0234 tại SupplierDebts vì tham chiếu namespace tương đối còn trỏ tới model cũ trong Interfaces. Chuyển tham chiếu sang Common.Models.Persistence rồi build/test đạt.
- Runner OpenAPI đặt ngoài solution cần content root của test host và phải chạy DLL đã build khi dùng BaseOutputPath khác. Test host còn thêm endpoint test-only; loại các endpoint này khi đối chiếu với API đang chạy, giữ toàn bộ endpoint ứng dụng trong phép so sánh.
