# OMTS-133 — báo cáo M2.2b3 AppButton

> Ngày: 22/10/2026
> Kết quả: component code hoàn tất; M2.2 vẫn đang thực hiện

## Phạm vi

Slice này thêm `AppButton` với bốn variant:

- `primary` cho hành động chính;
- `secondary` cho hành động thay thế;
- `danger` cho hành động có hậu quả nghiêm trọng;
- `ghost` cho hành động nhẹ/điều hướng phụ.

Button hỗ trợ full-width hoặc inline, disabled state, pressed feedback và pending state có spinner cùng nhãn đang xử lý.

## Luồng async

```text
Feature submit
  -> set isSubmitting = true
  -> AppButton loading = true
      -> chặn onPress mới
      -> accessibility busy = true
      -> spinner + loadingLabel
  -> request kết thúc
  -> feature cập nhật success/error
  -> set isSubmitting = false
```

Button không tự đặt timer và không tự quyết request đã xong.

## Phân biệt trạng thái

- Disabled: hành động hiện không hợp lệ/không được phép; dùng disabled palette.
- Loading: hành động đã bắt đầu; giữ variant palette, khóa press và hiển thị tiến trình.
- Skeleton: dành cho nội dung ban đầu đang tải, không dùng thay mutation feedback trong button.

## Accessibility

- role luôn là `button`;
- state gồm `disabled` và `busy`;
- accessibility label khi loading ghép tên hành động với loading label;
- spinner được đánh dấu không phải một accessibility element độc lập để tránh đọc trùng;
- chiều cao tối thiểu 52 logical pixels, lớn hơn touch-target baseline 48.

## Tự review

### Điểm tốt

- Variant palette nằm trong một hàm thuần, dễ kiểm tra và không rải điều kiện trong JSX.
- Loading chặn double press ở UI và vẫn giữ tín hiệu hành động đang chạy.
- Caller có thể cung cấp loading label cụ thể như “Đang đăng nhập”.
- Danger theme có `onDanger` riêng cho light/dark contrast thay vì dùng sai `onBrand`.
- Không thêm dependency mới.

### Giới hạn

- Button chưa được render trong route production; cần kiểm tra touch, focus và screen reader khi gắn vào auth screen.
- Khóa button ở client không thay thế idempotency hoặc submit lock trong service.
- Chưa có haptic feedback; không tự thêm vì đây là lựa chọn UX cần kiểm tra trên thiết bị và không bắt buộc cho foundation.
- M2.2 còn message banner trước khi hoàn tất.

## Lỗi thực tế trong quá trình

Lần lint đầu trả hai warning `import/no-duplicates` vì `react-native` được import một lần cho type và một lần cho runtime component. Exit code vẫn là 0, nhưng warning không được coi là kết quả sạch.

Nguyên nhân là TypeScript cho phép `import type` riêng, còn ESLint của repo yêu cầu cùng source module chỉ xuất hiện một lần. Các type `PressableProps`, `StyleProp`, `ViewStyle` được chuyển vào cùng import bằng cú pháp `type ...`. Lần lint sau không còn warning.

Trong self-review, loading ban đầu dùng chung disabled palette vì cả hai đều khóa press. Điều này làm mất nghĩa “đang thực hiện”. Palette sau đó chỉ nhận `disabled`, còn biến `isUnavailable = disabled || loading` chỉ điều khiển tương tác/accessibility.

## Kiểm tra

- `npm run typecheck`: đạt.
- `npm run lint`: đạt, không warning.
- `git diff --check`: đạt.
- `npx expo export --platform web`: đạt, exit code 0.
- Contrast calculation for solid button pairs: light primary `5.47:1`, dark primary `9.56:1`, light danger `6.57:1`, dark danger `8.79:1`. Device review is still required for sunlight and font-scaling behavior.

## Defense Q&A

**Tại sao loading state do feature sở hữu?**

Feature/service biết Promise đã resolve/reject và biết có cần retry hay điều hướng. Button chỉ phản ánh trạng thái được truyền xuống; timer nội bộ có thể kết thúc sai thời điểm.

**Button khóa press có đủ chống tạo bản ghi trùng không?**

Không. Nó giảm thao tác lặp ở UI. Service/backend vẫn cần single-flight hoặc idempotency phù hợp vì request có thể được gửi từ nhiều nguồn hoặc retry do mạng.
