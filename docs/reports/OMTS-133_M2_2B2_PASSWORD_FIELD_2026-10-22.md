# OMTS-133 — báo cáo M2.2b2 PasswordField

> Ngày: 22/10/2026
> Kết quả: component code hoàn tất; M2.2 vẫn đang thực hiện

## Phạm vi

Slice này thêm `PasswordField` bằng cách tái sử dụng `TextField` và mở rộng `TextField` với vùng `trailingContent` có layout rõ ràng.

`PasswordField` cung cấp:

- che mật khẩu mặc định;
- hành động “Hiện/Ẩn” với vùng chạm tối thiểu 48 logical pixels;
- label accessibility thay đổi theo hành động kế tiếp;
- disabled state đồng nhất giữa input và nút toggle;
- `readOnly` cũng được phản ánh nhất quán ở input và nút toggle;
- tắt auto-capitalize, auto-correct và spell-check theo mặc định;
- giữ khả năng truyền `autoComplete`/`textContentType` phù hợp từng use case.

## Luồng trạng thái

```text
Feature giữ password value
  -> PasswordField
      -> TextField render value/error
      -> PasswordField chỉ giữ isVisible
      -> secureTextEntry = !isVisible
```

Toggle không đọc, sao chép, log hoặc lưu password. Nó chỉ đổi cách native input hiển thị chuỗi đang có.

## Tự review

### Điểm tốt

- Không sao chép label/focus/error logic từ TextField.
- Dùng `Pressable` thay cho touchable cũ và có pressed/disabled feedback từ token.
- Nút dùng chữ tiếng Việt dễ hiểu hơn icon không nhãn với nhóm người dùng ít quen công nghệ.
- PasswordField loại bỏ `multiline` vì React Native không hỗ trợ `secureTextEntry` với multiline.
- Không hard-code `current-password` hoặc `new-password`; route đăng nhập và đổi mật khẩu phải cung cấp hint đúng mục đích.

### Giới hạn cần kiểm tra sau

- Chưa chạy trên bàn phím Android/iOS thật; React Native ghi nhận một số tổ hợp `secureTextEntry` với keyboard type không tương thích.
- Chưa kiểm tra hành vi cursor khi đổi Hiện/Ẩn trên từng OS.
- Chưa kiểm tra password manager/autofill vì cần màn auth thật và build thiết bị.
- Che ký tự chỉ bảo vệ việc nhìn màn hình; nó không mã hóa password trong JavaScript state.

## Kiểm tra

- `npm run typecheck`: đạt.
- `npm run lint`: đạt.
- `git diff --check`: đạt.
- `npx expo export --platform web`: đạt, exit code 0.

## Defense Q&A

**Tại sao PasswordField không tự lưu password?**

Password thuộc form state và chỉ nên tồn tại ngắn hạn để submit. Component trình bày không được ghi nó vào storage hoặc log; feature xóa/reset state khi flow kết thúc.

**Tại sao route phải chọn `autoComplete`?**

Đăng nhập cần `current-password`, còn tạo/đổi mật khẩu cần `new-password`. Primitive không biết use case hiện tại nên không được đoán sai và làm password manager hoạt động không đúng.
