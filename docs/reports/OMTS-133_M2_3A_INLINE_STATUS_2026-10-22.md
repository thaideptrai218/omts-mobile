# OMTS-133 — M2.3a InlineStatus

## Kết quả

Đã bổ sung `InlineStatus` cho trạng thái ngắn trong card hoặc danh sách. Component hỗ trợ neutral, info, success, warning và danger; mỗi trạng thái có cả chấm màu lẫn nhãn chữ.

## Quyết định kỹ thuật

`InlineStatus` không nhận enum nghiệp vụ. Feature phải chuyển trạng thái domain thành nhãn hiển thị và variant. Nhờ đó shared UI không biết `AccountStatus`, `VerificationStatus` hay bất kỳ enum backend nào.

Live region mặc định tắt. Feature chỉ bật `announce` khi trạng thái thực sự vừa đổi và cần được thông báo. Cách này tránh việc screen reader đọc hàng loạt badge tĩnh khi mở một danh sách.

## Giới hạn

- Chưa được dùng trong màn nghiệp vụ thật.
- Cần kiểm tra font scaling và TalkBack/VoiceOver trên thiết bị.

## Defense Q&A

**Vì sao shared component không nhận trực tiếp `AccountStatus`?**

Vì nó sẽ làm tầng giao diện dùng chung phụ thuộc một feature cụ thể. Adapter của feature chịu trách nhiệm dịch enum domain thành nội dung trình bày.

**Vì sao trạng thái không chỉ dùng màu?**

Màu không đủ cho người mù màu, màn hình ngoài nắng hoặc screen reader. Nhãn chữ là nguồn ý nghĩa chính; màu chỉ hỗ trợ quét nhanh.
