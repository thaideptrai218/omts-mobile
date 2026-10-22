# OMTS-133 — báo cáo M2.2b1 TextField

> Ngày: 22/10/2026
> Kết quả: component code hoàn tất; M2.2 vẫn đang thực hiện

## Phạm vi

Slice này thêm `TextField` dùng chung với các trạng thái:

- normal;
- focused;
- invalid có error message;
- disabled hoặc `editable={false}`;
- helper text;
- multiline.

Component giữ label hiển thị bên ngoài input, hỗ trợ ref để feature chuyển focus giữa các field, và giữ toàn bộ props chuẩn của React Native `TextInput` ngoại trừ `style` được tách thành `inputStyle`.

## Luồng dữ liệu

```text
Feature form state
  -> value + onChangeText + validation result
  -> TextField props
  -> visual/accessibility state
  -> native TextInput event
  -> feature cập nhật form state
```

`TextField` chỉ giữ `isFocused`, vì focus là trạng thái trình bày cục bộ. Nó không giữ `value` và không tự quyết validation.

## Accessibility

- label luôn hiển thị và đồng thời là `accessibilityLabel` mặc định;
- Android có `accessibilityLabelledBy` trỏ tới `nativeID` của label;
- disabled state truyền qua `accessibilityState`;
- error/helper được đưa vào hint của input;
- error text dùng polite live region để thông báo thay đổi mà không ngắt lời khẩn cấp;
- font scaling giữ mặc định `true` của React Native.

## Tự review

### Điểm tốt

- Dùng semantic theme token cho màu, spacing, typography và border.
- Caller vẫn dùng được autocomplete, keyboard type, submit behavior và các props native khác.
- `forwardRef` cho phép form focus field kế tiếp mà không lộ implementation bên trong.
- `editable={false}` và `disabled` dùng chung một nguồn `isDisabled`, tránh giao diện nói field hoạt động trong khi native input không sửa được.
- Không chứa validation schema hoặc message nghiệp vụ.

### Giới hạn

- Chưa render trong route production; export web chỉ xác minh app baseline, còn component được kiểm tra compile bằng TypeScript.
- Chưa kiểm tra VoiceOver/TalkBack, autofill, bàn phím tiếng Việt và font scaling lớn trên thiết bị.
- Password visibility action thuộc PasswordField ở micro-task tiếp theo.
- Không có component-test runner trong repo hiện tại.

## Lỗi thực tế trong quá trình

Khi refactor để thống nhất `editable={false}` với `disabled`, một patch context không chặt đã để lại hai dòng liên tiếp `color: disabled` và `color: isDisabled`. Đọc lại file ngay sau patch phát hiện đây sẽ là lỗi cú pháp trước khi chạy compiler.

Nguyên nhân không nằm ở React Native mà ở thao tác thay thế chỉ thay phần giá trị, không xóa trọn property cũ. Dòng thừa được xóa bằng patch hẹp. Sau sửa, `npm run typecheck`, `npm run lint`, `git diff --check` và web export đều trả exit code 0.

## Kiểm tra

- `npm run typecheck`: đạt.
- `npm run lint`: đạt.
- `git diff --check`: đạt.
- `npx expo export --platform web`: đạt, exit code 0.

## Defense Q&A

**Tại sao TextField không tự giữ `value`?**

Form feature cần phối hợp nhiều field, validation và submit. Nếu mỗi field tự giữ dữ liệu, feature khó tạo payload, reset form hoặc hiển thị lỗi server. Controlled value tạo một nguồn dữ liệu rõ ràng ở feature.

**Tại sao error không chỉ đổi viền đỏ?**

Màu sắc không đủ cho người mù màu và screen reader không đọc được màu. Error cần nội dung chữ, hint và live-region behavior phù hợp.
