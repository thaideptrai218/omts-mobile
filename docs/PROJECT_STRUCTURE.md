# Cấu trúc dự án OMTS Mobile (Zalo Mini App)

Cập nhật 28/10/2026. App chạy trong webview của Zalo, viết bằng React 18 + TypeScript + Vite, giao diện ZaUI (`zmp-ui`),
gọi tính năng của Zalo qua ZMP SDK (`zmp-sdk`), giữ trạng thái bằng Jotai. Dữ liệu lấy từ backend OMTS.Api qua HTTPS.

## Luồng chạy tổng quát

```
src/app.ts                       khởi động React, gắn vào <div id="app">
  └─ components/layout.tsx       khai báo mọi đường dẫn (route) của app
       ├─ session-guard.tsx      kiểm tra phiên: chưa liên kết thì về /link, tải quyền của tài khoản
       ├─ pages/*                từng màn hình
       │    └─ services/*        gọi API backend, gọi Zalo SDK (màn không gọi HTTP hay SDK trực tiếp)
       │         └─ services/api/http.ts   gắn token, làm mới token, đổi lỗi thành ApiError/NetworkError
       └─ bottom-nav.tsx         thanh dưới: Tổng quan | nút quét QR | Tài khoản
```

## Thư mục gốc

| Đường dẫn | Chứa gì | Chức năng |
|---|---|---|
| `src/` | Toàn bộ mã nguồn app | Xem mục "Thư mục src" bên dưới |
| `docs/` | Tài liệu dự án | Bối cảnh, thiết kế liên kết Zalo, chức năng Chủ HTX, ghi chép học tập |
| `scripts/` | Script kiểm thử tự động | `e2e-acs.mjs`: chạy thử luồng liên kết tài khoản và điều hướng trên Chrome (Playwright) |
| `.github/` | Cấu hình GitHub | CI (lint + typecheck mỗi PR), quét lộ bí mật (gitleaks), kiểm tra tên PR, tạo release; mẫu issue/PR; CODEOWNERS |
| `.vscode/` | Cấu hình VS Code | Extension gợi ý; tự sửa lỗi lint và sắp xếp import khi lưu |
| `www/` | Bản build (sinh ra, không commit) | Kết quả `npm run build`, là thứ `zmp deploy` đưa lên Zalo |
| `node_modules/` | Thư viện đã cài (không commit) | |

### File cấu hình ở gốc

| File | Chức năng |
|---|---|
| `package.json` | Thư viện và lệnh: `start` (chạy dev), `build`, `lint`, `typecheck`, `deploy` |
| `app-config.json` | Cấu hình Mini App mà Zalo đọc: tiêu đề, màu chữ thanh trạng thái, ẩn thanh tác vụ, danh sách CSS/JS (plugin tự điền khi build) |
| `zmp-cli.json` | Thông tin template của công cụ `zmp` (sinh lúc tạo dự án) |
| `vite.config.mts` | Cấu hình build: thư mục gốc `src`, alias `@` → `src`, đọc `.env`, proxy `/api` tới backend khi chạy dev |
| `tsconfig.json` | Cấu hình TypeScript (strict, target ES2015) |
| `eslint.config.mjs` | Luật kiểm tra mã (CI chạy) |
| `tailwind.config.js`, `postcss.config.js` | Tailwind CSS (có sẵn từ template, giao diện chủ yếu dùng `app.scss`) |
| `index.html` | Trang khung khi chạy dev. **Zalo không dùng file này** khi chạy thật |
| `.env` / `.env.example` | Biến môi trường: `VITE_API_BASE_URL` (địa chỉ backend), `APP_ID` (mã Mini App). `.env` không commit |
| `.editorconfig`, `.gitattributes`, `.gitignore`, `.nvmrc` | Quy ước định dạng, xuống dòng, file bỏ qua, phiên bản Node |
| `README.md` | Hướng dẫn cài, chạy, deploy |
| `CLAUDE.md` | Quy định nền tảng Zalo (kiểm duyệt, dữ liệu, thanh toán, giới hạn kỹ thuật) và các quyết định đã chốt của dự án |
| `AGENTS.md` | Quy tắc làm việc: kiến trúc, việc phải hỏi trước, quy trình Git |
| `CONTRIBUTING.md` | Quy trình đóng góp (nhánh, commit, PR) |

## Thư mục `src`

| Đường dẫn | Chứa gì | Chức năng chính |
|---|---|---|
| `src/app.ts` | Điểm vào | Nạp CSS (ZaUI, Tailwind, `app.scss`), khôi phục phiên đã lưu, bật theo dõi mạng, gắn component `Layout` vào trang |
| `src/config.ts` | Cấu hình lúc build | Đọc `VITE_API_BASE_URL`, các tùy chọn khác từ `.env` |
| `src/env.d.ts` | Khai báo kiểu | Kiểu cho biến `import.meta.env` |
| `src/pages/` | Các màn hình | Mỗi file là một màn, có đường dẫn riêng trong `layout.tsx` |
| `src/components/` | Thành phần giao diện dùng lại | Header, thanh dưới, lưới chức năng, khối dùng chung của màn quản lý… |
| `src/services/` | Lớp dịch vụ | Gọi API backend, gọi Zalo SDK, định dạng và dịch dữ liệu. Màn hình chỉ gọi qua đây |
| `src/state/` | Trạng thái toàn app (Jotai atom) | Phiên đăng nhập, quyền, số thông báo chưa đọc, mạng, cỡ chữ |
| `src/hooks/` | React hook dùng chung | Tải dữ liệu, chạy thao tác, mở chức năng, quét QR, đăng xuất |
| `src/data/` | Dữ liệu tĩnh | Danh mục chức năng, điều kiện hiện chức năng theo quyền, vai trò, nội dung bắt buộc của Zalo |
| `src/css/` | Giao diện | `app.scss`: màu (token sáng/tối), chữ, mọi class giao diện; `tailwind.scss` |
| `src/static/images/` | Ảnh | Ảnh splash, nền. Ảnh phải `import` trong mã, không dùng đường dẫn `/public` |

### `src/pages/` — màn hình

| File / thư mục | Đường dẫn | Màn hình |
|---|---|---|
| `index.tsx` | `/` | Tổng quan. Chưa liên kết: tra cứu truy xuất + nút liên kết. Đã liên kết: việc cần làm, chức năng theo quyền. Chủ HTX có Tổng quan riêng với số liệu thật |
| `trace.tsx` | `/trace?lot=` | Truy xuất nguồn gốc lô hàu (mở từ nút quét QR hoặc nhập mã; hiện dùng dữ liệu mẫu) |
| `notifications.tsx` | `/notifications` | Danh sách thông báo, đánh dấu đã đọc |
| `account.tsx` | `/account` | Tab Tài khoản: hồ sơ, cài đặt, cỡ chữ, thông tin HTX, đăng xuất |
| `feature.tsx` | `/feature/:key` | Trang giải thích cho chức năng chưa có trên hệ thống (backend chưa có API) |
| `auth/link.tsx` | `/link` | Liên kết tài khoản bằng số điện thoại Zalo; gửi yêu cầu tài khoản thương lái; trạng thái chờ duyệt/bị từ chối |
| `account/profile.tsx` | `/account/profile` | Hồ sơ cá nhân (đổi tên hiển thị) |
| `account/notification-preferences.tsx` | `/account/notifications` | Chọn kênh nhận từng nhóm thông báo |
| `account/trader-requests.tsx` | `/account/trader-requests` | Chủ HTX duyệt/từ chối yêu cầu tài khoản thương lái |
| `manage/farm/` | `/manage/zones…`, `/manage/rafts…`, `/manage/licenses/:id`, `/manage/water…` | Chủ HTX: vùng nuôi, bè, giấy tờ pháp lý, ngưỡng và số đo chỉ số nước |
| `manage/purchasing/` | `/manage/suppliers…`, `/manage/purchases…`, `/manage/supplier-payments`, `/manage/supplier-debts`, `/manage/input-items`, `/manage/raft-costs` | Chủ HTX: nhà cung cấp, công nợ, phiếu nhập, trả tiền, danh mục vật tư, chi phí vật tư theo bè |
| `manage/org/` | `/manage/employees…`, `/manage/accounts…`, `/manage/roles…`, `/manage/cooperative` | Chủ HTX: nhân viên, tài khoản và vai trò theo vùng, vai trò, hồ sơ HTX |

Mỗi thư mục trong `manage/` có `routes.tsx` khai báo đường dẫn của nhóm đó. Mỗi màn được tải riêng khi mở
(`lazyPage`), nên app mở nhanh dù có nhiều màn. Chi tiết chức năng Chủ HTX: `docs/owner-features.md`.

### `src/components/` — thành phần giao diện

| File | Chức năng |
|---|---|
| `layout.tsx` | Khung app: theme Zalo, router, danh sách route, splash, thanh dưới |
| `session-guard.tsx` | Vào lại im lặng bằng Zalo khi mở app; chặn màn cần đăng nhập (`/account/…`, `/manage/…`); báo phiên hết hạn; tải quyền |
| `bottom-nav.tsx` | Thanh dưới: Tổng quan, nút quét QR tròn ở giữa, Tài khoản |
| `page-header.tsx` | Dải đầu trang màu xanh, chuông thông báo góc trái |
| `notification-bell.tsx` | Chuông có huy hiệu số chưa đọc |
| `action-grid.tsx` | Lưới ô chức năng trên Tổng quan |
| `task-list.tsx` | Danh sách việc cần làm, có nhãn mức độ (Gấp, Cần chú ý) |
| `stat-panel.tsx` | Bảng số liệu chính |
| `owner-dashboard.tsx` | Tổng quan của Chủ HTX: việc cần xử lý và số liệu từ API, chức năng chia nhóm |
| `trace-lookup.tsx` | Ô tra cứu mã lô, quét QR, hiện hành trình lô |
| `offline-banner.tsx` | Băng báo mất mạng (MSG07) |
| `splash.tsx` | Màn chào khi mở app |
| `text-size-sheet.tsx` | Chọn cỡ chữ |
| `form-error.tsx` | Dòng lỗi của form |
| `clock.tsx`, `logo.tsx` | Đồng hồ, logo |
| `manage/ui.tsx` | Khối dùng chung của màn quản lý: trang chi tiết, trạng thái tải/lỗi, dòng danh sách, bảng thông tin, chip lọc, ô tìm kiếm, sheet nhập lý do, ô số |
| `manage/lazy.tsx` | `lazyPage`: tách mỗi màn thành file riêng, tải khi mở |
| `manage/date-field.tsx` | Ô chọn ngày (DatePicker của ZaUI) |

### `src/services/` — gọi API và Zalo

| File / thư mục | Chức năng |
|---|---|
| `api/http.ts` | Hàm `api()` gọi OMTS.Api: gắn `Authorization: Bearer`, tự làm mới token, đổi lỗi HTTP thành `ApiError` |
| `api/errors.ts` | Kiểu lỗi `ApiError` (có mã MSGxx), `NetworkError` |
| `session/session.ts` | Giữ phiên (token) trong bộ nhớ, làm mới token, đăng xuất |
| `session/storage.ts` | Lưu bền trên máy bằng `nativeStorage` của Zalo (Mini App không có localStorage) |
| `zalo.ts` | Bọc Zalo SDK: lấy access token, token số điện thoại, mở cài đặt quyền, quét QR |
| `scan-targets.ts` | Nhận diện mã QR quét được (mã truy xuất…) và chọn màn mở tương ứng |
| `connectivity.ts` | Theo dõi mạng để hiện băng MSG07 |
| `acs/` | Tài khoản và phân quyền (ACS): `link.ts` liên kết Zalo, yêu cầu thương lái, vào lại; `auth.ts` phiên; `permissions.ts` quyền hiệu lực; `profile.ts` hồ sơ; `notifications.ts` tùy chọn thông báo; `inbox.ts` hộp thông báo; `push.ts` đăng ký nhận thông báo đẩy; `trader-requests.ts` duyệt thương lái; `masking.ts` che số điện thoại; `types.ts` kiểu dữ liệu |
| `acs/messages.ts` | **Nơi duy nhất chứa chữ thông báo**: danh mục MSGxx tiếng Việt, dịch mã lỗi và tên trường backend sang tiếng Việt (`errorText`) |
| `farm.ts` | API vùng nuôi, bè, giấy tờ, ngưỡng và số đo chỉ số nước |
| `purchasing.ts` | API nhà cung cấp, phiếu nhập, trả tiền, vật tư, chi phí theo bè |
| `organization.ts` | API nhân viên, tài khoản, cấp quyền, vai trò, hồ sơ HTX |
| `owner-summary.ts` | Gom số liệu và việc cần làm cho Tổng quan của Chủ HTX |
| `format.ts` | Định dạng tiền, số, ngày giờ kiểu Việt Nam (giờ HTX); đọc số người dùng gõ |
| `labels.ts` | Chữ tiếng Việt cho trạng thái, loại, enum mà backend trả bằng tiếng Anh |

### `src/state/` — trạng thái toàn app

| File | Chức năng |
|---|---|
| `session.ts` | Phiên hiện tại, quyền của tài khoản, cờ phiên hết hạn, thông báo nhanh sau điều hướng |
| `inbox.ts` | Số thông báo chưa đọc (huy hiệu chuông) |
| `connectivity.ts` | Đang có mạng hay không |
| `text-size.ts` | Cỡ chữ đã chọn |

### `src/hooks/` — hook dùng chung

| File | Chức năng |
|---|---|
| `use-load.ts` | Tải dữ liệu cho màn: đang tải, lỗi tiếng Việt, tải lại |
| `use-action.ts` | Chạy thao tác ghi: khóa nút khi đang chạy, báo lỗi/thành công bằng snackbar |
| `use-open-feature.ts` | Mở một chức năng theo `FEATURE_ROUTES` |
| `use-scan.ts` | Nút quét QR: quét rồi mở màn theo loại mã |
| `use-logout.ts` | Đăng xuất |

### `src/data/` — dữ liệu tĩnh

| File | Chức năng |
|---|---|
| `features.ts` | Danh mục chức năng (tên, icon, mô tả) và `FEATURE_ROUTES`: chức năng nào đã có màn thật |
| `feature-access.ts` | Điều kiện hiện chức năng theo quyền (`api/me/permissions`); mô tả vai trò trên Tổng quan |
| `roles.ts` | Vai trò, nhóm chức năng của Chủ HTX, số liệu mẫu cho các vai trò chưa nối API |
| `content.ts` | Thông tin HTX và nội dung bắt buộc theo điều khoản Zalo; lô truy xuất mẫu |

## Thư mục `docs`

| File | Nội dung |
|---|---|
| `PROJECT_CONTEXT.md` | Bối cảnh dự án, vai trò người dùng, ranh giới Web/Mobile |
| `PROJECT_STRUCTURE.md` | File này |
| `zalo-account-linking.md` | Thiết kế liên kết tài khoản Zalo và yêu cầu tài khoản thương lái |
| `owner-features.md` | Chức năng Chủ HTX: đã có, để bản web, chưa có API backend |
| `learning/` | Ghi chép học tập và xử lý lỗi theo quy định trong `AGENTS.md` |

## Quy ước khi thêm màn mới

1. Gọi API trong `src/services/<nhóm>.ts`, không gọi `fetch` hay Zalo SDK trong màn.
2. Đặt màn trong `src/pages/…`; màn quản lý thì khai báo đường dẫn trong `routes.tsx` của nhóm bằng `lazyPage`.
3. Chữ hiện cho người dùng viết tiếng Việt; thông báo lỗi lấy qua `errorText` (thêm mã mới vào `acs/messages.ts`).
4. Dùng khối trong `components/manage/ui.tsx` và class trong `css/app.scss` trước khi viết giao diện mới.
5. Nếu chức năng mở từ Tổng quan, thêm vào `data/features.ts` (`FEATURES`, `FEATURE_ROUTES`) và `data/feature-access.ts`.
6. Chạy `npm run lint` và `npm run typecheck` trước khi commit.
