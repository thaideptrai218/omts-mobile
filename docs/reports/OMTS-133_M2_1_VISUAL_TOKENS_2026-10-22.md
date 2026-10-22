# OMTS-133 — báo cáo M2.1 Visual tokens

> Ngày: 22/10/2026
> Kết quả: code hoàn tất; kiểm tra tự động đạt

## Phạm vi

M2.1 tạo nền tảng hình ảnh dùng chung cho Mobile, chưa xây form đăng nhập hay thay đổi luồng nghiệp vụ.

Các phần đã thêm:

- semantic colors cho light/dark theme;
- thang spacing và radius;
- typography theo vai trò nội dung;
- kích thước chạm/form và giới hạn chiều rộng nội dung;
- elevation geometry dùng chung;
- `useAppTheme()` theo appearance của hệ thống.

Root layout, màn gốc hiện tại và `OfflineBanner` đã dùng theme mới. Các component này không còn chứa mã màu rải rác.

## Luồng hoạt động

```text
System appearance
  -> React Native useColorScheme()
  -> useAppTheme()
  -> themes.light hoặc themes.dark
  -> component chọn semantic token
  -> StyleSheet/render native
```

`app.json` đã có `userInterfaceStyle: "automatic"` và project đã cài `expo-system-ui`, nên Android/iOS có nền tảng cấu hình cần thiết để đi theo giao diện hệ thống.

## Tự review

### Điểm tốt

- Tên token diễn tả mục đích thay vì tên màu vật lý.
- Light và dark theme có cùng key nhờ TypeScript kiểm tra `ThemeColors`.
- Touch target chuẩn hóa ở 48 logical pixels, phù hợp thao tác ngoài hiện trường.
- Hook theme nhỏ, không tạo Context/provider thừa khi app hiện chỉ cần đi theo system appearance.
- Không thêm dependency mới.

### Giới hạn còn lại

- Chưa đo tương phản tự động cho toàn bộ tổ hợp text/background; M13 accessibility review vẫn phải kiểm tra bằng công cụ và thiết bị.
- Chưa có font thương hiệu; hiện dùng system font để ổn định tải và hỗ trợ tiếng Việt.
- M2.2 mới tạo các form primitives và áp dụng focus/error/disabled states.
- Màn gốc hiện chỉ là nội dung nền tảng tạm thời; M3 session bootstrap sẽ thay vai trò route này.

## Kiểm tra

- `npm run typecheck`: đạt.
- `npm run lint`: đạt.
- `git diff --check`: đạt.
- `npx expo-doctor`: đạt 21/21 checks.
- `npx expo export --platform web`: đạt, exit code 0; tạo thành công ba static routes.

Lần đầu export được chạy nối sau typecheck và lint trong một command có cửa sổ chờ 30 giây. Tool trả output của hai bước đầu nhưng chưa trả exit code, nên kết quả export lúc đó không được coi là pass. Chạy lại riêng lệnh export cho phép Metro hoàn tất sau khoảng 26 giây và trả exit code 0. Các dòng `NO_COLOR ... FORCE_COLOR` là warning về màu output terminal, không phải lỗi bundle.

## Defense Q&A

**Tại sao gọi là semantic token?**

Vì tên mô tả vai trò như `warningSurface`, không mô tả màu vàng cụ thể. Component giữ nguyên ý nghĩa khi giá trị màu thay đổi giữa light/dark theme.

**Tại sao chưa cần ThemeProvider?**

Ứng dụng hiện theo system appearance và theme object là bất biến. `useColorScheme()` đã cung cấp subscription cần thiết; Context riêng chỉ hữu ích khi có lựa chọn theme trong app hoặc dữ liệu theme runtime.
