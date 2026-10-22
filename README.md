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
- Mã thử tổng hợp: `246810`. Mock không gửi SMS hoặc email.
- Mật khẩu mới, trạng thái onboarding và phiên chỉ sống trong tiến trình.
  Logout rồi login lại trong cùng lần chạy dùng mật khẩu mới; reload toàn bộ app
  sẽ khởi tạo lại fixture, trở về mật khẩu mẫu và yêu cầu đăng nhập.
- Chạy xem bằng trình duyệt: `npx expo start --web --port 8082`.

Chi tiết phạm vi, bằng chứng và phần chưa hoàn thành:
[báo cáo ghép luồng](docs/reports/MOBILE_SESSION_ASSEMBLY_2026-10-22.md).

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
