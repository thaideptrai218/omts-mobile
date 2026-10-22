# OMTS-133 — M3.10a typed message resolution

## Kết quả

Đã nâng catalog từ hàm `MSG07 -> string` thành resolver trả một `ResolvedMessage` gồm mã đã nhận diện, tiêu đề, nội dung và severity. Mã không hỗ trợ nhận fallback an toàn và không echo giá trị thô từ server.

Offline banner đã dùng `MessageBanner` thay vì tự xây một hộp cảnh báo thứ hai. Safe-area wrapper vẫn thuộc feature connectivity; màu, nhãn và accessibility presentation thuộc shared primitive.

## Ranh giới hỗ trợ

Danh sách typed hiện chỉ có `MSG07`, đúng với nội dung frontend đã tồn tại và đã được mô tả là provisional. Các mã auth/account trong SRS/backend chưa được thêm câu tiếng Việt vì wording cuối chưa được BA/backend xác nhận. Mã chưa hỗ trợ sẽ dùng fallback; đây là hành vi có chủ đích, không phải “mất mã”.

## Luồng dữ liệu

1. Adapter/parser nhận một giá trị code kiểu `unknown`.
2. `isMessageCode` kiểm tra code có trong tập được frontend hỗ trợ.
3. `resolveMessage` trả nội dung catalog hoặc fallback không chứa raw detail.
4. Feature đưa kết quả vào `MessageBanner`.

Khi thêm message có tham số trong tương lai, catalog sẽ thêm renderer theo từng code sau khi contract tham số ổn định; không dùng replace chuỗi tùy ý từ backend.

## Test

- `MSG07` resolve đúng content và severity.
- mã lạ trả `code: null`, severity danger và không lặp lại raw server value.
- Component suite tiếp tục kiểm tra semantics của `MessageBanner`.

## Lỗi patch đã gặp

Lần patch đầu dùng đồng thời `Delete File` và `Add File` cho cùng đường dẫn. `apply_patch` từ chối với `multiple operations target ...`; vì patch là atomic nên không file nào bị ghi một nửa. Đã đổi thành `Update File` cho file hiện hữu, chia phần tài liệu sang patch riêng và đọc lại diff sau áp dụng.

## Defense Q&A

**Vì sao không hiển thị `ProblemDetails.detail` làm fallback?**

Detail có thể là nội dung kỹ thuật, không ổn định hoặc chứa thông tin không nên công khai. Client dùng câu an toàn; mã/detail đầy đủ chỉ nên đi vào logging đã kiểm soát.

**Vì sao catalog chỉ có một mã?**

Typed catalog phải phản ánh nội dung frontend thực sự hỗ trợ. Thêm mã mà chưa có wording/parameter contract được duyệt sẽ biến giả định thành hành vi production.
