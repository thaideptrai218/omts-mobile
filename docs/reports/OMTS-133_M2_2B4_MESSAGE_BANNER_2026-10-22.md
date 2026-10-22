# OMTS-133 — M2.2b4 shared MessageBanner

## Kết quả

Đã bổ sung `MessageBanner` dùng chung cho bốn mức thông báo: thông tin, thành công, cảnh báo và lỗi. Component nhận nội dung hiển thị từ feature, còn màu sắc, nhãn trạng thái và cách screen reader thông báo được xử lý tập trung.

## Lý do thiết kế

Banner không nhận trực tiếp mã `MSGxx`. Mã thông báo thuộc tầng message catalog và có thể cần tham số hoặc bản dịch; primitive giao diện chỉ nên nhận chuỗi đã được render. Ranh giới này giúp cùng một banner dùng được cho cả lỗi validation, lỗi API và thông tin hướng dẫn mà không phụ thuộc backend.

Mỗi variant luôn có nhãn chữ như “Thành công” hoặc “Có lỗi xảy ra”. Vì vậy người dùng không phải dựa riêng vào màu để hiểu trạng thái. Lỗi dùng live region `assertive` và role `alert`; các mức còn lại dùng `polite` để không ngắt lời screen reader không cần thiết.

## Luồng dữ liệu

1. Feature hoặc message-catalog adapter tạo `title` và `message`.
2. `MessageBanner` chọn semantic palette theo `variant`.
3. Theme hiện tại cung cấp màu light/dark.
4. React Native hiển thị nội dung; TalkBack/VoiceOver nhận một accessibility label gộp từ tiêu đề và nội dung.

## Giới hạn còn lại

- Chưa nối với message catalog; đây là phần M2.3/M3.10.
- Chưa thêm nút retry vì chỉ feature mới biết lỗi nào thực sự retry được.
- Chưa kiểm tra VoiceOver/TalkBack trên thiết bị thật.

## Defense Q&A

**Vì sao không để component tự tra mã MSG?**

Vì đó là trách nhiệm của tầng nội dung/domain. Component giao diện chỉ biểu diễn một thông báo đã được render, nhờ vậy không bị khóa vào một danh mục hoặc ngôn ngữ cụ thể.

**Vì sao lỗi dùng `assertive` còn thông tin dùng `polite`?**

Lỗi chặn thao tác cần được thông báo ngay. Thông tin thông thường không nên cắt ngang nội dung mà người dùng screen reader đang nghe.
