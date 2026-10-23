# omts-mobile

Mobile app for **OMTS — Oyster Management and Traceability System** for Trung Nam Aquaculture Cooperative (SEP490_G83):
field workflows for Staff and Zone Managers within their permitted farming-zone scope (cultivation, environment readings, harvest, and attendance).
Sibling repos: [omts-backend](https://github.com/thaideptrai218/omts-backend) · [omts-web](https://github.com/thaideptrai218/omts-web)

## Stack

Expo · React Native · Expo Router · TypeScript

## Getting started

Prerequisites: Node.js (version in `.nvmrc`), npm, the **Expo Go** app on your phone.

```bash
npm ci
cp .env.example .env.local   # set EXPO_PUBLIC_API_BASE_URL to your machine's LAN IP
npx expo start               # scan the QR code with Expo Go
```

`EXPO_PUBLIC_API_BASE_URL` must be an absolute `http` or `https` URL without
credentials, query parameters, or fragments. When testing on a physical phone,
use an API address the phone can reach; `localhost` points to the phone itself.
Values with the `EXPO_PUBLIC_` prefix are bundled into the app, so never put
tokens, passwords, private keys, or other secrets in them.

Add dependencies with `npx expo install <package>` (picks SDK-compatible versions).

## Chạy luồng tài khoản bằng mock

`.env.example` bật `EXPO_PUBLIC_AUTH_MODE=mock` một cách tường minh. Đây là adapter
trải nghiệm UI, không gọi QA API và không được nhập thông tin đăng nhập thật.
Nếu không bật mock, app chặn luồng cho tới khi adapter API thật được tích hợp;
không tự chuyển sang mock khi API lỗi.

- Staff lần đầu: `nguyen.minh.an` / `OmtsDemo2026` → đổi mật khẩu → xác minh một liên hệ.
- Staff đã xác minh: `tran.thu.ha` / `OmtsDemo2026` → tài khoản cá nhân.
- Mã onboarding tổng hợp: `246810`. Mock không gửi SMS hoặc email.
- Mật khẩu mới, trạng thái onboarding và phiên chỉ sống trong tiến trình.
  Logout rồi login lại trong cùng lần chạy dùng mật khẩu mới; reload toàn bộ app
  sẽ khởi tạo lại fixture, trở về mật khẩu mẫu và yêu cầu đăng nhập.
- Chạy xem bằng trình duyệt: `npx expo start --web --port 8082`.
- `/account` đã ghép hồ sơ mock: sửa tên hiển thị, xem tài khoản/liên hệ/phân công
  chỉ đọc, mở đổi mật khẩu và đăng xuất. Tên đã lưu còn sau logout/login trong cùng
  tiến trình; reload toàn bộ app reset fixture. Offline không tự lưu hoặc xếp hàng.
- Hết phiên về login có MSG19; logout chủ động không hiện lỗi hết phiên.
- Hồ sơ có nút **Tùy chọn thông báo** → `/notification-preferences`: lưu/hủy
  riêng từng tài khoản, có khóa mục bắt buộc và email chưa xác minh. Catalog chỉ
  là ví dụ mock; không gửi thông báo, đăng ký push token hay xin quyền thiết bị.
- **Quên mật khẩu** ở login → `/recovery`: nhập `ha@example.invalid` → nhận
  phản hồi MSG15 → nhập mã mock → đặt mật khẩu mới → về đăng nhập bằng
  `tran.thu.ha` và mật khẩu vừa đặt. Không tự đăng nhập sau reset.
  Trong cửa sổ mock 5 phút, mã lần gửi đầu là `246810`, lần hai `246811`, lần ba
  `246812`; gửi lại cách nhau tối thiểu 60 giây, mã cũ mất hiệu lực. Giới hạn
  5 lần nhập sai/3 lần gửi; quay lại nhập liên hệ không làm mới ngân sách này.
  Mỗi mã mới có đủ 5 phút kể từ lần gửi của nó, độc lập cửa sổ giới hạn gửi.
  Đây là dữ liệu thử và thời gian mock, không phải hợp đồng endpoint thật.
- `an@example.invalid` chưa xác minh nên chỉ nhận MSG15, không reset được.
  Số tổng hợp `0000000123` cũng chỉ dùng được sau khi An hoàn tất onboarding
  và xác minh SMS trong cùng tiến trình. Không dùng số điện thoại thật.
  Reset thu hồi mọi phiên mock cũ của đúng tài khoản; app cũ nhận MSG19 khi
  thực hiện yêu cầu được bảo vệ tiếp theo. Không có server push đăng xuất tức thì.
- **Đăng ký tài khoản thương lái** ở login → `/register`: dùng email tổng hợp
  `trader@example.invalid` hoặc số tổng hợp `0000000999`, tự nhập password thử
  thỏa quy tắc form → OTP → **Tạo tài khoản** → về login bằng liên hệ đó.
  Mã gửi lần 1/2/3 là `246810`/`246811`/`246812` trong cửa sổ mock; không gửi
  SMS/email thật. Tài khoản mới chưa tồn tại trước bước xác nhận, không tự login,
  không có grants nội bộ và không tạo/liên kết Customer hoặc Order.
  Account/password chỉ còn trong cùng tiến trình; reload toàn app reset.
  Không nhập credential thật; format/canonicalization email/SĐT chưa nghiệm thu.

Chi tiết phạm vi, bằng chứng và phần chưa hoàn thành:
[báo cáo ghép luồng](docs/reports/MOBILE_SESSION_ASSEMBLY_2026-10-22.md).
Lát tiếp theo: [MSG19 và hồ sơ mock](docs/reports/MOBILE_MSG19_PROFILE_ASSEMBLY_2026-10-22.md).
Lát thông báo: [báo cáo ghép mock](docs/reports/MOBILE_NOTIFICATION_ASSEMBLY_2026-10-22.md).
Lát khôi phục: [phạm vi, kiểm thử và giới hạn](docs/reports/MOBILE_RECOVERY_ASSEMBLY_2026-10-23.md).
Lát đăng ký: [báo cáo ghép Trader mock](docs/reports/MOBILE_TRADER_REGISTRATION_ASSEMBLY_2026-10-23.md).

Review đăng ký (mục R): 56 suites / 371 tests PASS; P3 REG-REV-01 vẫn mở:
proof hết hạn ở bước xác nhận đưa về form đăng ký nhưng thông báo còn hướng dẫn
nhập OTP. Báo cáo có cách tái hiện/đề xuất; chưa nghiệm thu API/native/full UC01.

Hai lỗi review REC-REV-01/02 đã sửa và có test hồi quy: OTP gửi lại có thời hạn
riêng; outcome offline từ adapter giữ proof để thử lại thủ công, nhưng không
giữ mật khẩu hay tự gửi lại. Xem mục S của báo cáo; chưa nghiệm thu API/native.

| Script | Purpose |
|---|---|
| `npm run lint` | `expo lint` |
| `npm test` | Jest component/unit tests, run serially |
| `npm run typecheck` | `tsc --noEmit` |
| `npx expo-doctor` | Expo SDK and dependency compatibility checks |
| `npx expo export --platform web` | Metro/static-export smoke test |

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) — branches, Jira keys, commit/PR rules, releases.

## Project guidance

- [Current project context](docs/PROJECT_CONTEXT.md)
