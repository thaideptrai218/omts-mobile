# OMTS-133 — M2.3b ContentState

## Kết quả

Đã thêm `ContentState` cho ba trường hợp: không có dữ liệu, lỗi tải nội dung và không có quyền. Component có tiêu đề, mô tả và action tùy chọn; không tự tạo nút retry.

## Quyết định kỹ thuật

Type của action là một union: hoặc có đủ `actionLabel` + `onAction`, hoặc không có cả hai. Điều này ngăn màn hình tạo ra một nút có nhãn nhưng không hoạt động, hoặc handler không có phần tử để người dùng kích hoạt.

Nút action tái sử dụng `AppButton`, nên trạng thái pending, touch target và accessibility không bị triển khai lại. Variant chỉ chọn cách trình bày; feature vẫn quyết định nội dung và hành động có hợp lệ hay không.

## Lỗi thực tế đã phát hiện

Sau M2.3a, việc đọc lại JSX phát hiện một khoảng trắng nằm ngay sau thẻ mở `Text`. TypeScript và ESLint đều không báo vì đây là JSX hợp lệ, nhưng nó tạo khoảng trắng thừa trước nhãn. Đã xóa bằng cách đặt nội dung bắt đầu ở dòng kế tiếp và tiếp tục dùng `git diff --check` cùng self-review.

## Giới hạn

- Chưa có minh họa bằng ảnh; marker chữ chỉ là tín hiệu phụ, tiêu đề/mô tả vẫn là nguồn ý nghĩa chính.
- Retry chỉ xuất hiện khi feature truyền action an toàn.
- Chưa kiểm tra large font trên thiết bị.

## Defense Q&A

**Vì sao dùng union type cho action?**

Để loại bỏ trạng thái UI vô nghĩa ngay từ lúc compile: nút phải vừa có nhãn vừa có hành động.

**Vì sao permission denied khác error?**

Lỗi có thể tạm thời và retry được; thiếu quyền là trạng thái truy cập, thường cần giải thích hoặc quay lại thay vì gửi lại request giống hệt.
