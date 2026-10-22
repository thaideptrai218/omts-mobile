# OMTS-133 — M2.3d ConfirmationDialog

## Kết quả

Đã thêm dialog xác nhận dùng chung, hỗ trợ confirm thường hoặc nguy hiểm, cancel, pending state, đóng bằng backdrop, nút Back Android và accessibility escape trên iOS.

## Cơ chế

React Native `Modal` tạo một lớp native phía trên màn hiện tại. Backdrop là vùng nhấn độc lập nằm sau card, nên thao tác bên trong dialog không vô tình kích hoạt đóng. `onRequestClose` xử lý nút Back Android; `onAccessibilityEscape` hỗ trợ gesture thoát của công nghệ trợ năng trên iOS.

Khi confirm đang pending, confirm button hiển thị tiến trình, cancel/backdrop/Back bị khóa. Điều này tránh trường hợp dialog biến mất trong khi request vẫn chạy và người dùng không biết kết quả sẽ áp dụng ở đâu.

Animation fade tự tắt nếu hệ điều hành bật Reduce Motion. Dialog dùng `accessibilityViewIsModal` để công nghệ trợ năng ưu tiên nội dung modal thay vì màn phía sau.

## Quy tắc sử dụng

- Chỉ dùng cho hành động có hậu quả đáng kể hoặc khó hoàn tác.
- Feature phải viết hậu quả cụ thể, không dùng câu chung chung kiểu “Bạn có chắc không?”.
- Không dùng confirmation thay cho validation hoặc thông báo thành công.

## Giới hạn

- Chưa quản lý focus ban đầu thủ công; cần xác minh hành vi native Modal trên TalkBack/VoiceOver thực tế.
- Nếu mutation hỗ trợ hủy thật sự trong tương lai, quy tắc khóa Cancel cần được feature thiết kế riêng.

## Defense Q&A

**Vì sao khóa Cancel khi confirm đang chạy?**

Vì đóng giao diện không hủy request. Cho phép đóng sẽ tạo trạng thái mơ hồ: hành động vẫn có thể thành công sau khi người dùng tưởng đã hủy.

**Vì sao không xác nhận mọi nút lưu?**

Xác nhận liên tục làm chậm luồng và khiến người dùng bấm theo phản xạ. Form hợp lệ, có thể sửa lại nên dùng pending và success feedback thay vì thêm dialog.
