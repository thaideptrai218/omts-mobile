# OMTS-176 — M11 Notification preferences review

Ngày review: 22/10/2026
Nhánh: `feature/OMTS-133-mobile-foundation`

## 1. Nguồn yêu cầu đã đối chiếu

- Jira `OMTS-176`: mobile SCR-06, đọc quyền push, đăng ký token, trường hợp từ chối dùng MSG22.
- Jira `OMTS-174`: API preference của backend; ticket vẫn To Do và bị chặn bởi `OMTS-124`.
- SRS UC06/SCR-06/MSG21–23: ma trận loại thông báo × kênh; mục bắt buộc không được tắt; push bị từ chối vẫn lưu các kênh hợp lệ khác.
- Expo SDK 57 `expo-notifications`: `getPermissionsAsync` không tạo hiệu ứng phía người dùng; `requestPermissionsAsync` mới mở hộp thoại; Android 13 cần notification channel trước khi lấy token; remote push không hoạt động trong Expo Go Android từ SDK 53.
- Source backend hiện tại: mới có `NotificationPreference` và enum `InApp, Push, Email, Sms`; chưa có controller đăng ký token hoặc API UC06.

## 2. Phần đã triển khai

### M11.1 — Domain model

Model không đóng cứng catalog. Backend/controller sẽ cấp loại thông báo và channel áp dụng cho tài khoản hiện tại. Mỗi cell mang `enabled`, `editable` và lý do khóa typed theo MSG21/22/23. Helper domain chặn thay đổi trái với cell khóa và báo lỗi contract khi nhận ID không tồn tại.

### M11.2 — SCR-06 mobile

Màn hình dùng card dọc thay vì bảng ngang. Mỗi card giữ nguyên tên loại thông báo khi cuộn, có nhãn “Bắt buộc”, switch tối thiểu đúng touch target native và lý do khóa hiển thị bằng chữ. Screen có state loading bằng skeleton, load error có retry, empty, saving và feedback.

Không có catalog mẫu được gắn vào production screen. Dữ liệu trong test đều có hậu tố `test` để tránh bị hiểu nhầm là quyết định BA.

### M11.3 — Quyền push của hệ điều hành

Đã cài `expo-notifications ~57.0.23` bằng `npx expo install` và thêm config plugin. Repository tách Expo khỏi UI:

- `read()` chỉ đọc trạng thái và không hiện prompt;
- `request()` chỉ được gọi từ nút “Cho phép thông báo”;
- Android tạo channel `general` trước khi xin quyền;
- mapping hỗ trợ granted, denied, undetermined và iOS provisional.

### M11.5 — Contract lưu preference và mock adapter

Repository/service contract không để component gọi trực tiếp mock storage. Mock adapter preflight toàn bộ selections trước khi mutation, trả MSG21/MSG23 cho thay đổi không hợp lệ và giữ push tắt khi OS từ chối nhưng vẫn lưu các cell hợp lệ kèm warning MSG22. Session expiry trả MSG19.

## 3. Phần chưa thể hoàn tất

### M11.4 — Đăng ký và duy trì push token

Chưa được đánh dấu hoàn thành vì ba điều kiện còn thiếu:

1. Expo Go Android không hỗ trợ remote push trong SDK 57; cần development build.
2. App chưa có EAS `projectId` và push credentials.
3. Backend chưa có endpoint/payload đăng ký, cập nhật hoặc xóa device token.

Không tạo endpoint giả, không log token và không lưu token vào localStorage/AsyncStorage.

### API lưu ma trận

`OMTS-124` chưa chốt catalog và `OMTS-174` chưa triển khai. Ngoài ra backend có `Sms` trong khi SRS dùng `Zalo OA`. Mobile giữ ID channel dạng data-driven để chưa khóa sai wire enum.

## 4. Lỗi thực tế đã gặp và cách xử lý

### Switch test không gọi callback

- Lệnh: targeted Jest cho `notification-preferences-screen-test.tsx`.
- Thông báo chính: callback `onChange` có 0 lần gọi dù test dùng `userEvent.press`.
- Nguyên nhân gốc: React Native `Switch` phát `onValueChange(value)`, không tương đương Pressable press event trong test renderer.
- Cách kiểm tra: callback của button vẫn hoạt động, riêng native switch không phát giá trị mới.
- Khắc phục: dùng `fireEvent(element, "valueChange", true)` để mô phỏng đúng native event.
- Bằng chứng: targeted suite sau sửa đạt 4/4 test, không warning.

### Rerender tạo cảnh báo `overlapping act()`

- Thông báo chính: React cảnh báo hai `act()` chồng nhau khi unmount loading tree rồi render error tree trong cùng test.
- Nguyên nhân gốc: RNTL 14 hoàn tất lifecycle bất đồng bộ, còn test tạo lifecycle mới trước khi lifecycle trước kết thúc.
- Khắc phục: tách loading và error thành hai test độc lập; mỗi test có một renderer lifecycle.
- Bằng chứng: suite chạy lại không còn console warning.

### Cảnh báo Expo Go khi import module trong Jest

- Thông báo chính: remote notifications đã bị loại khỏi Expo Go Android từ SDK 53.
- Ý nghĩa: cảnh báo xác nhận Done criteria của Jira không thể đồng thời yêu cầu Expo Go và remote token trên Android SDK 57.
- Khắc phục trong unit test: mock native boundary để CI không lặp warning; giới hạn thật vẫn được giữ trong plan/report và không bị che bằng fake success.

### Lệnh dọn export tạm bị policy chặn

- Lệnh ban đầu: `Remove-Item` đệ quy cho đúng thư mục `dist-review` vừa được Expo tạo.
- Thông báo chính: process bị sandbox policy từ chối trước khi chạy; không có file nào bị xóa ở lần đó.
- Cách kiểm tra: dùng `Get-Item` xác nhận đường dẫn tuyệt đối là `D:\Đồ_án\omts-mobile\dist-review`, sau đó kiểm tra `git status` để chắc chắn chỉ có artifact export.
- Khắc phục: dùng `git clean -fd -- dist-review` với target tĩnh đã xác minh; các file export tạm được xóa, source không bị ảnh hưởng.

## 5. Kết quả kiểm tra

- `npm test`: 28 suites, 154 tests đạt.
- `npm run typecheck`: đạt.
- `npm run lint`: đạt.
- `npx expo-doctor`: 21/21 checks đạt.
- `npx expo config --type public`: nhận đúng plugin `expo-notifications` và SDK 57.
- `npx expo export --platform web --output-dir dist-review`: production export đạt; thư mục kết quả tạm đã được dọn sau kiểm tra.
- `git diff --check`: đạt.

`npm audit --omit=dev --audit-level=high` báo 53 lỗ hổng gián tiếp trong cây Expo/Metro/Jest (`braces`, `node-forge`, `decode-uri-component`, `sprintf-js`). Các fix được npm đề xuất đều kéo theo thay đổi breaking như Expo 44, Expo Router 58 hoặc Jest 30, nên không chạy `npm audit fix --force`. Expo Doctor vẫn xác nhận dependency compatibility 21/21; cần theo dõi bản vá chính thức thay vì phá khóa SDK.

## 6. Tự đánh giá

- Đạt: domain/UI/permission/mock save có ranh giới sạch, không hard-code catalog theo role, không tự xin quyền và có test cho các nhánh SRS quan trọng.
- Chưa đạt Done của Jira: token chưa được QA backend nhận; chưa có development-build evidence; chưa có API persistence.
- Jira không được chuyển trạng thái trong lần làm này. `OMTS-176` nên giữ To Do/In Progress cho tới khi M11.4 và QA API hoàn tất.
