# OMTS-180 — M12 Logout foundation review

Ngày review: 22/10/2026
Nhánh: `feature/OMTS-133-mobile-foundation`

## 1. Yêu cầu đã đối chiếu

- Jira `OMTS-180`: xóa SecureStore và cache, về login; offline phải xóa phiên thiết bị và queue revoke.
- SRS UC07: local protected content phải bị xóa; phiên hết hạn vẫn logout; offline dùng MSG07 và đánh dấu server session cần hủy khi online.
- Backend: `POST /api/auth/logout` yêu cầu bearer access token và trả 204; 401 xảy ra trước controller nếu token đã hết hạn/revoked.
- Expo SecureStore SDK 57: có trong Expo Go; API async có thể reject; dữ liệu iOS Keychain có thể tồn tại qua reinstall; không dùng `requireAuthentication` trong foundation Expo Go.

## 2. Phần đã triển khai

### Token bundle trong SecureStore

Access/refresh token và hai thời điểm hết hạn nằm trong một envelope `schemaVersion: 1` tại key `omts.auth.tokens.v1`. Một lệnh delete xóa toàn bộ bundle. Parser chỉ nhận chuỗi token không rỗng và thời gian ISO hợp lệ; JSON/schema hỏng bị từ chối.

Adapter dùng `WHEN_UNLOCKED_THIS_DEVICE_ONLY`, tránh chuyển credential sang thiết bị khác. Không log token và không lưu AsyncStorage.

### Logout local-first

Coordinator đọc access token vào biến tạm, sau đó đồng thời xóa SecureStore, protected cache và in-memory session state. Chỉ sau khi ba thao tác local kết thúc mới gọi server revoke. `navigateToLogin` luôn là true, kể cả khi server lỗi; app shell phải lắng nghe session state để ẩn dữ liệu trước khi network hoàn tất.

### Online revoke

API adapter gọi `POST api/auth/logout` với bearer token:

- 204 → `revoked`;
- 401 → `failed`: có thể là access token hết hạn trước khi controller chạy, chưa chứng minh refresh session bị thu hồi (sửa sau full review);
- network/timeout/5xx → `failed`, không phục hồi local session.

Full review còn sửa trường hợp đọc token thất bại thành revoke `failed`, thay vì
`not-needed`. Mỗi lời gọi cleanup được bọc riêng để một exception đồng bộ không
ngăn các cleanup còn lại. Xem `MOBILE_FULL_REVIEW_2026-10-22.md` cho kết quả mới
nhất; các số kiểm tra ở phần dưới là bằng chứng tại thời điểm slice ban đầu.

## 3. Phần chưa thể hoàn tất

### Route replacement và cache thật

Repo chưa có auth/app route groups, session bootstrap hoặc protected business cache. Vì vậy chưa thể chứng minh Android Back/deep link không hiện lại dữ liệu cũ trên Expo Go. Service boundary đã sẵn sàng để controller nối sau.

### Offline deferred revoke

Backend chưa có opaque revoke handle hoặc endpoint idempotent cho retry sau khi token local đã bị xóa. Giữ lại refresh token để retry sẽ đi ngược mục tiêu logout. Foundation hiện trả `deferred-contract-required` và MSG07, không giả lập queue đã hoạt động.

Backend/BA cần chốt tối thiểu: revoke handle không dùng lại để đăng nhập, thời hạn, idempotency key, nơi lưu an toàn, số lần retry và hành vi sau reinstall.

## 4. Lỗi thực tế

### Regex tìm controller bị PowerShell làm hỏng

- Lệnh ban đầu dùng regex chứa `HttpPost(\"logout\")`.
- Thông báo: `regex parse error: unclosed group`.
- Nguyên nhân: quote/escape qua PowerShell làm pattern tới `rg` không còn cân bằng ngoặc.
- Khắc phục: dùng `rg -F` để tìm chuỗi cố định `HttpPost("logout")` và `LogoutAsync`, vì mục tiêu không cần regex.
- Bằng chứng: tìm thấy `AuthController.cs` dòng logout và `AuthService.cs` đoạn revoke session.

## 5. Kiểm tra và tự đánh giá

- Targeted Jest: 3 suites / 12 tests đạt.
- TypeScript strict và Expo lint đạt sau thay đổi.
- Đạt ở mức foundation: storage, local-first sequencing, online result mapping và fail-closed navigation intent.
- Chưa đạt Done của Jira: chưa có app-stack integration, Expo Go device evidence và offline retry backend contract.
- Không chuyển trạng thái Jira trong lần làm này.
