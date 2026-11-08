# Sửa cấu trúc frontend theo yêu cầu — 31/10/2026

## Yêu cầu và phạm vi

Người dùng yêu cầu frontend theo cây `assets`, `components`, `features`, `hooks`, `layouts`, `pages`, `routes`, `services`, `contexts`, `utils`, `constants`, cùng `App` và `main`. Cách chia app/features/shared trước đó không đúng cây được yêu cầu. Lần này chuyển 127 file, tách 13 component từ file UI chung và cập nhật toàn bộ import.

Dự án dùng TypeScript nên component/trang dùng `.tsx`, service/hook/tiện ích dùng `.ts`. Nghiệp vụ tài khoản vẫn là liên kết Zalo; cây thư mục mẫu không thêm bước đăng nhập bằng mật khẩu hay đăng ký mới.

## Trách nhiệm và luồng khởi tạo

`app.ts` là entry mà Zalo CLI đọc, import `main.tsx`. Main nạp CSS và cấu hình, khôi phục phiên, theo dõi kết nối rồi mount `App.tsx`.

App ghép `contexts/AppProviders.tsx`, `layouts/MainLayout.tsx` và `routes/AppRoutes.tsx`. Provider giữ ZaUI/snackbar hiện có. Layout giữ ZMPRouter, kiểm tra phiên, trạng thái mạng, điều hướng và splash. Router giữ các URL và tải các màn theo yêu cầu.

Trang tổng quát ở `pages/`. Màn hình, component, hook và service riêng của từng nghiệp vụ ở `features/<tên>/`; mọi lời gọi API theo nghiệp vụ dùng thư mục `services/`. Thành phần dùng lại ở `components/<Tên>/<Tên>.tsx`; ảnh và style chung ở `assets/`.

## Luồng dữ liệu

Trang hoặc component gọi service của feature. Service dùng `services/httpClient.ts` để gửi yêu cầu tới backend. HTTP lấy token qua provider đã được `features/auth/services/sessionService.ts` đăng ký; cơ chế refresh, quyền, đăng xuất và nativeStorage giữ nguyên. Jotai tiếp tục dùng store mặc định cho cả service và UI.

`constants/messages.ts` giữ thông báo; `utils/errorText.ts` dịch mã lỗi backend. Tách hai phần giúp HTTP chỉ phụ thuộc thông báo và kiểu lỗi, không kéo ngược tiện ích dịch lỗi vào vòng phụ thuộc.

## Lỗi gặp và cách xử lý

Lần đầu chạy `npm run typecheck` báo TS1192 và TS1149 tại `main.tsx`: module `App` không có default export và tên file chỉ khác hoa/thường. Trên Windows, import không có đuôi `@/App` tìm trúng `app.ts` trước `App.tsx`. File entry này chỉ import main, nên không export component; nếu để lọt có thể tạo vòng import mà không mount React.

Sửa thành `import App from "@/App.tsx"`, bật `allowImportingTsExtensions` trong cấu hình TypeScript đang có `noEmit`. Giữ nguyên entry Zalo và tên App theo cây thư mục được yêu cầu. Typecheck và build sau sửa đều đạt.

## Kiểm chứng

- `npm run lint`, `npm run typecheck`, `npm run build`: đạt.
- So sánh AST với bản chụp trước khi chuyển: 48 URL và màn đích giống nhau; 123 module giữ nguyên phần xử lý; thân hàm của cả 13 component tách ra giữ nguyên; thông báo và cách dịch lỗi giữ nguyên.
- Luồng browser dùng API giả: thương lái gửi yêu cầu 20 lồng, chặn số lẻ; Chủ HTX nhận 18 lồng, chặn số vượt yêu cầu; thương lái xem phản hồi và hủy; Chủ HTX thêm sản phẩm; chuyển đủ bốn vai trò và về tài khoản gốc.
- Chạy cùng kịch bản trên bản chụp trước và mã sau khi chuyển. Cả hai có cùng pageerror `Object` trong môi trường ngoài Zalo; không kết luận browser hoàn toàn không có lỗi runtime và không coi đây là xác nhận mở app trên điện thoại.
- Hash `.env` và `.env.example` trước/sau giống nhau; ảnh giữ nguyên byte; không còn các folder `src/app/`, `src/shared/`, `src/static/`.
- Server browser tạm đóng sau kiểm tra, không chạy Device mới. Backend và tunnel không bị dừng hay khởi động lại.

Build vẫn cảnh báo kích thước một số chunk và Sass API cũ. Đây không phải lỗi build, không thay dependency trong lần sắp xếp này.

## Câu hỏi bảo vệ

- Vì sao còn `app.ts` ngoài App/main? Zalo CLI đọc entry này; nó chỉ chuyển quyền khởi tạo cho main.
- Vì sao `contexts` không có AuthContext? Phiên đang dùng Jotai; thêm một nguồn auth state sẽ tạo hai nơi giữ phiên. AppProviders chỉ ghép provider hiện có.
- Đổi folder có sửa lỗi link Device trước đó không? Việc chuyển mã không xác nhận đường truyền relay hoặc deeplink; cần kiểm tra riêng trong Zalo.

Cây thư mục chuẩn và quy tắc thêm file mới nằm ở [PROJECT_STRUCTURE.md](../PROJECT_STRUCTURE.md).
