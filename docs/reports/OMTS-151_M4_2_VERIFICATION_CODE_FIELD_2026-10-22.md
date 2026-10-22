# OMTS-151 — M4.2 six-digit verification code field

## Nguồn phạm vi

- Jira [OMTS-151](https://welterial.atlassian.net/browse/OMTS-151): shared SCR-02, 6-digit input, numeric keypad, paste/one-time-code autofill, reuse by UC01/02/03/05.
- SRS UC08: verification is bound to purpose, channel and recipient; UC08 does not grant account or permissions itself.
- SRS SCR-02: masked recipient, required verification-code field, verify/resend/back controls and policy notices.

Slice này chỉ xây code field; không chốt contact flow hoặc API contract còn xung đột.

## Kết quả

Đã thêm `VerificationCodeField` controlled với một canonical string. Sáu cell chỉ là presentation; một native TextInput phủ vùng nhập để giữ paste, focus và OS autofill.

Input dùng numeric input mode, number-pad, iOS `textContentType="oneTimeCode"`, Android `autoComplete="sms-otp"`, và giới hạn 6 ký tự. Normalizer loại ký tự không phải ASCII digit và cắt sau 6 số. Component không auto-submit khi đủ mã; route/controller mới quyết định lúc gọi Verify.

## Accessibility

- Một label và một TextInput duy nhất trong accessibility tree.
- Sáu cell trang trí dùng `aria-hidden`.
- Error được nối vào accessibility hint và polite live region.
- Disabled/read-only state được truyền vào native input và palette.

## Lỗi thực tế

Lần chạy đầu có 7/7 test pass nhưng `tsc --noEmit` báo `TS2551: StyleSheet.absoluteFillObject does not exist`, gợi ý `absoluteFill`. Điều này xảy ra vì test chạy qua Babel/test renderer không kiểm tra TypeScript API surface.

Đã đổi từ spread `absoluteFillObject` sang style array `[StyleSheet.absoluteFill, styles.input]`, đúng API/type React Native 0.86. Sau sửa, 7 test, typecheck, lint và diff-check cùng pass.

## Test

7 test bao phủ normalize, lọc ký tự, giới hạn 6 số, paste, numeric/autofill props, error association và việc decorative cells không trở thành sáu input cho screen reader.

## Còn thiếu

- Device test cho SMS/email autofill và paste thật trên Android/iOS.
- Countdown/resend/attempts thuộc các micro-task kế tiếp.
- Verification service/challenge/token chưa code vì backend endpoint chưa tồn tại ổn định.

## Defense Q&A

**Vì sao không dùng sáu TextInput?**

Sáu input làm paste, autofill, backspace, focus và screen reader phức tạp hơn. Một canonical input giữ dữ liệu đúng một chỗ; sáu cell chỉ giúp nhìn nhanh.

**Vì sao không tự Verify khi nhập đủ sáu số?**

Auto-submit là quyết định luồng và có thể gửi nhầm khi autofill/paste. Ticket yêu cầu nút Verify; controller sẽ submit rõ ràng.
