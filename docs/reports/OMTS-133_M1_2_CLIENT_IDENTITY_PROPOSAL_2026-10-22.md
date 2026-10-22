# OMTS-133 — báo cáo M1.2 Mobile client identity

> Ngày: 22/10/2026
> Kết quả: tài liệu đề xuất đã sẵn sàng; xác nhận runtime với Backend/QA còn chờ

## Phạm vi đã thực hiện

Micro-task này không sửa Mobile runtime và không sửa backend. Mục tiêu là biến phát hiện ở M1.1 thành một đề xuất đủ cụ thể để BA/backend-dev có thể duyệt hoặc phản biện.

Tài liệu mới `docs/contracts/AUTH_ENUM_CONTRACT_PROPOSAL.md` đã mô tả:

- vì sao Mobile không được bỏ `clientType` hoặc hard-code số `1`;
- request đề xuất dùng `clientType: "Mobile"`;
- yêu cầu enum response như `subjectType` và `dataScope` có wire format ổn định;
- cách chuyển đổi backend an toàn, tránh đổi tất cả endpoint ngoài ý muốn;
- quy tắc nhãn thiết bị không chứa dữ liệu cá nhân;
- ranh giới adapter phía Mobile;
- bằng chứng bắt buộc trước khi đánh dấu M1.2 hoàn tất.

## Tự đánh giá

### Điểm đã giải quyết tốt

- Tách rõ backend hiện tại với contract đề xuất, không biến khuyến nghị frontend thành quyết định đã duyệt.
- Đưa ra JSON cụ thể và hành vi lỗi cụ thể thay vì chỉ nói chung chung “nên thống nhất enum”.
- Giữ chi tiết transport trong adapter, tránh để UI phụ thuộc enum C#.
- Nhận diện rủi ro tương thích nếu backend bật enum-string converter toàn cục.

### Phần chưa thể xác nhận

- Chưa có phản hồi chính thức từ Backend về string enum.
- Chưa có QA API URL và tài khoản test.
- Chưa chứng minh phiên tạo ra thật sự là `ClientType.Mobile`.
- Chưa xác nhận danh sách string chính thức của `DataScope`.

Vì vậy M1.2 ở trạng thái **proposal prepared / runtime pending**, không phải Done.

## Bước tiếp theo hợp lý

Trong khi chờ Backend, Mobile có thể bắt đầu M2 — UI foundation vì tokens, spacing, typography, form primitives và accessibility không phụ thuộc wire format auth. API client/login production tiếp tục bị chặn để không đóng đinh một contract sai.

## Sự cố thực tế trong lúc cập nhật tài liệu

Patch đầu tiên báo `apply_patch verification failed` khi cùng một patch vừa chèn nội dung ở đầu execution log vừa cố tìm lại một dòng nằm phía trước đoạn vừa chèn trong cùng file plan.

Thông báo này có nghĩa công cụ không còn khớp được context mà hunk sau yêu cầu. Đây không phải lỗi Markdown hay mất dữ liệu. Giả thuyết được kiểm tra bằng `Test-Path` cho ba file mới và đọc lại 30 dòng đầu của plan; kết quả cho thấy toàn bộ patch đã dừng trước khi ghi.

Cách khắc phục là tách thao tác thành hai patch độc lập: patch thứ nhất tạo file, patch thứ hai cập nhật các file có sẵn. Sau đó các file mới tồn tại, plan chứa execution log M1.2 và `git diff --check` đạt.

## Defense Q&A

**Tại sao không tạm dùng số `1` rồi sửa sau?**

Vì `1` là chi tiết implementation của backend, không mang ý nghĩa tự mô tả. Nếu nó đổi, request vẫn là JSON hợp lệ nhưng có thể tạo sai loại phiên; đây là lỗi âm thầm nguy hiểm hơn lỗi compile.

**Tại sao `deviceName` không dùng làm device ID?**

Vì nhãn hiển thị có thể trùng, thay đổi và do client gửi lên. Định danh bảo mật phải do backend quản lý bằng session/device identifier riêng, không dựa vào chuỗi thân thiện với người dùng.
