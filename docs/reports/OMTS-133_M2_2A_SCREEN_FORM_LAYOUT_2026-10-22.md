# OMTS-133 — báo cáo M2.2a Screen và form layout

> Ngày: 22/10/2026
> Kết quả: M2.2a hoàn tất; toàn bộ M2.2 chưa hoàn tất

## Phạm vi

Slice này thêm hai layout primitive dùng chung:

- `ScreenContainer`: quản lý safe area, nền theme, padding và giới hạn chiều rộng nội dung;
- `KeyboardSafeForm`: quản lý bàn phím và cuộn cho các form auth/account.

Màn gốc hiện tại đã chuyển sang `ScreenContainer` để xác minh primitive có thể render thật mà không tạo một màn “development showcase”. `KeyboardSafeForm` chưa được nhét vào màn gốc vì màn đó không có input; nó sẽ được kiểm tra tương tác cùng text field ở M2.2b.

## Thiết kế và luồng layout

```text
Screen route
  -> ScreenContainer
      -> safe-area insets + background + content width
      -> KeyboardSafeForm (chỉ khi màn có form)
          -> KeyboardAvoidingView
          -> bounded ScrollView
          -> fields/actions của feature
```

`KeyboardAvoidingView` dùng `padding` trên iOS và `height` trên Android. `ScrollView` dùng `flexGrow: 1`, còn mọi parent dùng `flex: 1`; điều này bảo đảm vùng cuộn có chiều cao hữu hạn.

## Tự review

### Điểm tốt

- Primitive không chứa submit logic, validation hay HTTP.
- Screen có thể chọn cạnh safe area để tránh padding top kép khi Stack header đã quản lý phần trên.
- Nội dung giới hạn theo `contentMaxWidth`, nên form không kéo quá rộng khi chạy tablet/web.
- `keyboardShouldPersistTaps="handled"` cho phép nút xử lý tap thay vì tap đầu tiên chỉ đóng keyboard.
- Không thêm dependency mới.

### Điều chưa được coi là hoàn tất

- Chưa có text field/password field/button; đây là M2.2b.
- Chưa kiểm tra keyboard thật, autofill và font scaling trên Android/iOS.
- `keyboardVerticalOffset` phải được route có header truyền đúng; primitive không tự đoán chiều cao header.
- Chưa có component test runner trong repo.

## Kiểm tra

- `npm run typecheck`: đạt.
- `npm run lint`: đạt.
- `git diff --check`: đạt.
- `npx expo export --platform web`: đạt, exit code 0.

## Defense Q&A

**Tại sao `ScrollView` cần parent có chiều cao hữu hạn?**

`ScrollView` chứa nội dung có thể dài vô hạn nhưng bản thân vùng nhìn phải biết cao bao nhiêu để tính việc cuộn. Chuỗi parent `flex: 1` truyền giới hạn kích thước từ màn hình xuống vùng cuộn.

**Tại sao không luôn cộng safe area top?**

Stack header thường đã đứng dưới status bar. Cộng thêm top inset trong nội dung có thể tạo khoảng trắng kép. Vì vậy `ScreenContainer` có default an toàn cho màn headerless nhưng cho route chọn `edges` khi header đã xử lý cạnh trên.
