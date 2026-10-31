# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

Quy tắc cho `omts-mobile` (Zalo Mini App của OMTS). Đọc file này trước khi sửa code. Nội dung tổng hợp
từ tài liệu chính thức của Zalo Mini App (https://mini.zalo.me/documents, đọc ngày 24/10/2026) và các
quyết định đã chốt với chủ dự án. Khi Zalo cập nhật tài liệu hoặc dự án đổi hướng, sửa lại file này.

Lệnh, cấu trúc thư mục, quy tắc làm việc nhóm (nguồn ưu tiên, việc phải hỏi trước khi làm, nhánh git)
nằm trong AGENTS.md, được nạp ở đây:

@AGENTS.md

Cấu trúc hiện hành: `docs/PROJECT_STRUCTURE.md` (app / features / shared, cập nhật 31/10/2026).

## 0. Kiến trúc mã nguồn

- Kiểm tra bằng `npm run lint`, `npm run typecheck`, `npm run test:contracts` và `npm run build`.
  CI chạy cả bốn; contract tests dùng Node có sẵn, chưa có bộ UI/device tests. Sau đó chạy thử trong Zalo.
  ESLint chỉ quét `src/**/*.{ts,tsx}`.
- Vite chạy với `root: ./src`, alias `@` trỏ vào `src`; `npm run build` xuất ra `www/`.
  `src/app.ts` gán `app-config.json` vào `window.APP_CONFIG` rồi mount `Layout` vào `#app`.
- `src/app/layout.tsx` khai báo mọi route (`ZMPRouter` + `AnimationRoutes`), `BottomNav` nằm ngoài
  các route; `Splash` phủ lên trang chủ đã render sẵn rồi mờ dần.
- **Phiên và tài khoản (ACS)**: `src/shared/api/http.ts` gọi OMTS.Api (Bearer, tự làm mới access token
  15 phút, một lần làm mới dùng chung cho các request song song, 401 sau làm mới → phiên hết hạn MSG19);
  `src/shared/auth/session.ts` giữ token trong atom + nativeStorage, hàng đợi thu hồi phiên khi đăng
  xuất offline, cờ "đã đăng xuất" để không tự vào lại; `src/features/*/api` là các lời gọi API theo use case
  (link, profile, notifications, permissions, push), `messages.ts` giữ nguyên
  văn thông báo SRS (MSGxx) và `types.ts` hợp đồng DTO. UI không gọi HTTP hay storage trực tiếp.
  `src/app/session-guard.tsx` (nằm trong `ZMPRouter`) điều hướng theo phiên: thử vào lại im lặng bằng
  token Zalo, màn bảo vệ `/account/*`, MSG19 khi hết hạn.
- **Chỉ có "Liên kết tài khoản"** (`/link`): `getAccessToken` (vào lại nếu đã liên kết) rồi `getPhoneNumber`
  (số điện thoại Zalo), backend khớp số với hồ sơ HTX đã tạo. Bị từ chối quyền số điện thoại thì mở
  `openPermissionSetting` để người dùng tự bật lại. **Không làm** form mật khẩu, quên/đổi mật khẩu, mã xác minh
  SMS/email, cổng mật khẩu tạm hay cổng số điện thoại, đổi email/số điện thoại. Số chưa có trong OMTS: thương
  lái nhập tên (và lời nhắn) gửi **yêu cầu** (`zalo/trader-requests`), tài khoản ở trạng thái Chờ duyệt cho tới khi
  Chủ HTX duyệt ở mục "Duyệt thương lái" (`/account/trader-requests`, web cũng có API này); Chủ HTX nhận thông
  báo in-app, thương lái nhận thông báo khi được duyệt. Mật khẩu chỉ dùng cho bản web. Hợp đồng API liên kết
  ở `docs/zalo-account-linking.md`. Khi dev ngoài Zalo đặt
  `window.__OMTS_FAKE_ZALO__` (xem `src/shared/platform/zalo.ts`).
- **Dashboard chạy theo quyền**: `GET api/me/permissions` → `permissionsAtom`; `src/shared/navigation/feature-access.ts`
  quyết định `FeatureKey` nào hiện (mã chức năng của backend, chủ HTX, thương lái). `ROLES`
  (`src/shared/navigation/roles.ts`) chỉ còn cung cấp `stats`, `tasks`, `actions` mẫu theo vai trò gần nhất (`roleKeyFor`);
  `tasks[].feature` và `actions` là `FeatureKey` lấy từ `FEATURES` (`src/shared/navigation/features.ts`). `useOpenFeature`
  mở `trace` ở tab `/trace`, còn lại mở `/feature/:key` (`src/features/dashboard/pages/unavailable-page.tsx`, chỉ là khung "đang xây dựng").
  Thêm chức năng: thêm vào `FEATURES` và `FEATURE_ACCESS`, gắn vào role; khi có màn hình thật thì thêm route riêng
  trong `layout.tsx`. Chưa liên kết tài khoản thì trang chủ chỉ có ô tra cứu truy xuất.
- **Chạy với backend local**: `npm start` proxy `/api` sang `API_PROXY_TARGET` (mặc định `http://localhost:5198`,
  xem `vite.config.mts`, `.env.example`); trong Zalo đặt `VITE_API_BASE_URL` (HTTPS) và backend phải trả CORS
  cho `https://h5.zdn.vn`. Mã SMS/email giả đọc ở `GET /api/dev/sms`, `GET /api/dev/email` của backend.
- **Style**: token màu ở `:root` trong `src/shared/styles/app.scss`, bản tối ghi đè dưới `body[zaui-theme="dark"]`
  (Tailwind cũng dùng selector này cho dark mode). Màu ZaUI đổi qua biến `--zaui-light-*`.
  `--capsule-space` chừa vùng menu Zalo, `--top-safe` chừa thanh trạng thái; header tự vẽ phải dùng hai biến này.
- **Giao diện cho người lớn tuổi** (đã chốt): xanh Zalo `#006AF5`, chữ thân bài 16 đến 18px, chữ phụ `--ink-2`
  đạt tương phản 7:1, vùng chạm tối thiểu 48px, mức độ (gấp, cần chú ý, mới) luôn có nhãn chữ chứ không chỉ màu.
  Cỡ chữ và line-height viết bằng **rem**, vì lựa chọn "Cỡ chữ" (`src/shared/preferences/text-size.ts`) đổi `font-size` của
  thẻ `<html>` qua `data-text-size`. Viết px thì chữ sẽ không phóng theo lựa chọn này.
  Mọi tab dùng `PageHeader` nền xanh, trang chi tiết tô `Header` của ZaUI cùng màu, nên `app-config.json` đặt
  `textColor: white`. Thêm màn hình có đầu trang nền sáng thì chữ trên thanh trạng thái sẽ không đọc được.
- Chữ trên giao diện và comment trong code viết bằng tiếng Việt.
- Commit theo Conventional Commits kèm mã Jira: `type(scope): tóm tắt OMTS-<n>`; tiêu đề PR
  `type(scope): tóm tắt [OMTS-<n>]` (CI kiểm tra), merge bằng Squash and merge. Xem `CONTRIBUTING.md`.

## 1. Phạm vi app

- OTMS (Oyster and Traceability Management System) của **HTX Thủy sản Trung Nam**.
- Đây là app **quản trị kết hợp truy xuất nguồn gốc**, không phải cửa hàng bán thực phẩm.
- Ba nhóm người dùng:
  - Người tiêu dùng quét QR trên sản phẩm để truy xuất: công khai, không cần đăng nhập.
  - Nhân viên, xã viên HTX: dùng phần quản trị.
  - Thương lái (role trader): phải thanh toán cho HTX qua app.
- Backend: `OMTS.Api` (.NET 8, Clean Architecture) tại `D:\repo\OTMS\back-end\omts-backend`.
  Entity `Customer` đã có `ZaloAccountId`.
- Nếu thương lái trả tiền **mua hàu** qua app, Zalo có thể xếp app vào nhóm giao dịch thực phẩm
  và yêu cầu giấy tờ ngành "Thực phẩm & FMCG": giấy xác nhận mã ngành bán buôn/bán lẻ
  (4649/4772 hoặc tương đương) và giấy chứng nhận cơ sở đủ điều kiện an toàn thực phẩm.

## 2. Quy trình phát hành

- Các bước: `zmp deploy` bản **Development** (quét QR để thử, không ảnh hưởng production),
  rồi bản **Testing** (gắn version, tự trả về cho tester), rồi **gửi duyệt**, **đã duyệt**, **Publish**.
- Trước khi gửi duyệt phải **xác thực chủ sở hữu**: qua OA doanh nghiệp, hoặc giấy chứng nhận
  đăng ký doanh nghiệp/HTX kèm CCCD người đại diện pháp luật.
- Thời gian: duyệt mỗi phiên bản tối đa 3 ngày làm việc; xác thực giấy tờ 3 đến 5 ngày làm việc.
- **Mỗi bản cập nhật đều bị duyệt lại.**
- Quota deploy: 300 lần/tháng bản Development, 60 lần/tháng bản Testing.
- App có hệ thống tài khoản riêng phải ghi **tài khoản test bật đủ tính năng** vào mô tả khi gửi duyệt.
- Duy trì tối thiểu 10 lượt truy cập/tháng và tính năng ổn định; không đạt trong 3 tháng có thể
  bị hạn chế hiển thị hoặc vô hiệu hóa.
- Hỗ trợ: hotrodoitac@zaloplatforms.com.

## 3. Tên, logo, mô tả

- **Tên**: không viết hoa toàn bộ; chỉ viết hoa chữ cái đầu, tên riêng doanh nghiệp hoặc địa danh;
  không chứa "App", "Mini App", "Zalo", ký tự đặc biệt (#, $, @, !), emoji; nên có tiền tố hoặc hậu tố
  thể hiện đơn vị sở hữu; không dùng danh từ chung, từ khóa mơ hồ.
  - "OTMS" viết hoa toàn bộ có rủi ro bị từ chối. Muốn giữ thì cần giấy đăng ký nhãn hiệu.
    Gợi ý kiểu tên: "Truy xuất hàu Trung Nam".
- **Logo**: logo chính chủ, đúng chức năng; không nền trong suốt; không chứa số điện thoại, mã QR.
- **Mô tả**: đúng chức năng, đối tượng, mục đích; không chứa đường link.

## 4. Nội dung và trải nghiệm (vi phạm là bị từ chối)

- **Không điều hướng ra ngoài Mini App** (link, `openWebview`, trang thanh toán bên ngoài...), trừ tài liệu
  Chính sách bảo mật, Điều khoản sử dụng; khi đó nhúng dạng popup hoặc vô hiệu hóa link.
- Không kêu gọi tải app riêng. **Cấm đăng nhập bằng Google, Facebook** hay mạng xã hội khác ngoài Zalo.
- Không quảng cáo, banner kiếm tiền; không vật phẩm ảo, tiền ảo, NFT, nội dung số; không rút tiền, trả thưởng.
- Không tính năng mạng xã hội (đăng bài, video, like, comment) hay cạnh tranh sản phẩm của Zalo.
- **Không dùng iframe hay cờ bật/tắt từ server** để ẩn hoặc đổi tính năng nhằm qua mặt kiểm duyệt.
- Không giao diện đánh lạc hướng, ép đồng ý, tự chọn sẵn điều khoản bất lợi cho người dùng.
- Ảnh phải tải được, font rõ ràng; không tính năng "demo"; không treo, không màn hình trắng hoặc tối.
- **Hiệu năng**: tải app hoặc tính năng quá 10 giây là vi phạm. Mục tiêu LCP dưới 2,5 giây,
  PageLoad dưới 1,5 giây.
- **Bắt buộc hiển thị trong app**: tên tổ chức, mã số doanh nghiệp/HTX, địa chỉ, số điện thoại liên hệ,
  mô tả dịch vụ, **số phiên bản Mini App**, phương thức hỗ trợ và tiếp nhận khiếu nại.
- **Bắt buộc có Chính sách bảo mật và Điều khoản** ghi rõ là của Mini App "<tên app>" và của HTX.
- App làm theo chiến dịch có thời hạn phải ghi rõ thời gian bắt đầu, kết thúc.

## 5. Đăng nhập và xin quyền

- **Không bắt đăng nhập/đăng ký để dùng app**, trừ app nội bộ. App có form tài khoản + mật khẩu
  sẽ bị **tắt khỏi tìm kiếm Zalo và Mini App Store**, chỉ vào được qua QR, deeplink, shortcut.
- Hướng của OTMS:
  - Phần truy xuất nguồn gốc dùng được ngay, không cần đăng nhập hay cấp quyền.
  - Thương lái và nhân viên định danh bằng **tài khoản Zalo**, liên kết **một lần** với hồ sơ trong OMTS.
    Chức năng này phải tên là "Liên kết tài khoản". Liên kết xong không được bắt đăng nhập lại.
- Quy định xin quyền (tên & ảnh đại diện, số điện thoại, vị trí, camera, gửi thông báo,
  quan tâm OA, tương tác OA):
  - Không xin quyền ngay khi vừa mở app. Giải thích lý do trước, rồi mới gọi API.
  - Chỉ gọi API lấy thông tin cá nhân khi người dùng thực hiện một hành động cụ thể cần nó.
  - Luôn có lựa chọn "Từ chối"; bị từ chối thì app vẫn dùng được phần không liên quan,
    không tự đóng hay thoát app.
  - Không giả mạo giao diện xin quyền của Zalo.
- **Quyền phải xin Zalo duyệt theo Mini App ID** (Mini App Center, mục Quyền Mini App):
  số điện thoại, vị trí, camera, quét QR của Zalo, lưu ảnh vào máy (`saveImageToGallery`),
  native storage, giữ màn hình sáng, rung, shortcut, thông tin mạng.
  Chưa được duyệt thì chỉ tài khoản Developer/Admin của app dùng được (người khác sẽ gặp lỗi).
  Bản Testing không được cấp quyền truy cập dữ liệu riêng tư của người dùng thật.

## 6. Dữ liệu cá nhân

- **Xử lý và lưu trữ dữ liệu trong lãnh thổ Việt Nam.** Server nhận dữ liệu từ Zalo mà có IP ngoài
  Việt Nam là vi phạm, nên backend OMTS phải đặt ở nhà cung cấp trong nước.
- Chỉ thu thập khi người dùng đồng ý rõ ràng, đúng mục đích đã thông báo; không bán,
  không chia sẻ cho bên thứ ba khi chưa được đồng ý.
- **Người dùng phải tự xóa được dữ liệu của mình** ngay trong app.
- Ngừng vận hành app: xóa toàn bộ dữ liệu người dùng trong vòng 24 giờ.
- Lưu dữ liệu hoạt động tối thiểu 12 tháng; dữ liệu hợp đồng với người dùng tối thiểu 3 năm.
- **Không gửi dữ liệu cá nhân lấy từ Zalo** (tên, số điện thoại...) sang bên thứ ba như payOS, SePay.

## 7. Ràng buộc kỹ thuật

- **Không có `localStorage`, `sessionStorage`, cookie.** Dùng `nativeStorage` của `zmp-sdk`
  (tối đa 5 MB, tự xóa dữ liệu cũ khi đầy, phải xin quyền). Không dùng `atomWithStorage` của jotai
  với localStorage.
- Gửi token qua header `Authorization: Bearer <JWT>`, không dùng cookie.
- **API backend phải là HTTPS trên tên miền** (không dùng IP, SSL còn hạn).
- **CORS**: trả `Access-Control-Allow-Origin: https://h5.zdn.vn` cho mọi request, kể cả `OPTIONS`.
  Nhiều origin (ví dụ thêm `http://localhost:3000` khi dev) thì đọc origin của request và trả đúng
  **một** giá trị, không nối nhiều origin bằng dấu phẩy.
- API server-to-server (đổi token số điện thoại/vị trí, gửi thông báo, Open API, trạng thái đơn
  Checkout SDK) **chỉ gọi từ backend**. Không bao giờ đặt app secret hay private key trong Mini App.
- Ảnh phải `import` để Vite đóng gói, không dùng đường dẫn kiểu `/public/...`.
  **Mọi ảnh để chung trong `src/static/images`.**
- `index.html` **không được dùng trên Zalo**; mọi thứ khởi tạo phải nằm trong JS/CSS
  (`zmp-vite-plugin` tự sinh `listCSS`, `listSyncJS` khi build). Root element có id `app`.
- Dung lượng: tối đa 10 MB cả app, 3 MB mỗi file. Build target ES2015.
- `ZMPRouter` tự dùng basename `/zapps/<APP_ID>` ở bản production, nên mở bản build ngoài Zalo
  sẽ thấy trang trắng; đó là bình thường. Khi dev dùng `npm start`.
- Gặp lỗi dynamic import trên iOS thì tắt polyfill module preload trong `vite.config.mts`.
- Debug bản đang chạy thật: thêm `zDebug=true` vào deeplink.
- Deeplink: `https://zalo.me/s/<miniAppId>/?param=value`. Dùng dạng này cho QR truy xuất trên bao bì.
- Trình duyệt và simulator không chạy được `getAccessToken`, `CheckoutSDK.createOrder`;
  phải thử bên trong Zalo (Device mode hoặc `zmp deploy` rồi quét QR).
- `app-config.json`: `title` bắt buộc; `actionBarHidden: true` đang bật nên header do app tự vẽ;
  `selfControlLoading: true` + `closeLoading()` cho phép app tự quyết lúc tắt màn hình tải của Zalo.
- **Vị trí code**: app nằm ở thư mục gốc của repo `thaideptrai218/omts-mobile` (app Expo cũ đã được gỡ).
  CI chạy `npm run lint` (ESLint, cấu hình ở `eslint.config.mjs`) và `npm run typecheck` trên mọi PR.
  Làm việc theo nhánh từ `develop` rồi mở PR, không push thẳng vào `develop` hay `main`.
- **Chạy dev**: `npm start` = `zmp start --no-frame`, chỉ mở một cổng và trả về app trần.
  Không chạy `zmp start` trần rồi mở trong simulator của extension Zalo: `zmp start` mặc định bọc app
  trong một trang khung giả (thanh trạng thái ghi cố định "12:00", nút menu có biểu tượng nguồn),
  còn simulator của extension tự vẽ thêm một khung nữa (giờ thật, nút menu có dấu X), nên hai lớp chồng lên nhau.
  Giờ "12:00" là chữ cố định trong file khung của zmp-cli, không phải lỗi của app.

## 8. Thiết kế (Zalo Mini App Design Guidelines)

- **Màn hình tải của Zalo** (logo + tên app) luôn hiện khi mở app, không ẩn hay đổi được.
  Splash riêng của app phải ngắn, không được làm người dùng chờ thêm.
- **Menu của Zalo cố định ở góc trên bên phải** mọi màn hình. Không đặt nút hay thông tin dưới
  vùng đó; chọn màu sáng/tối cho menu sao cho đủ tương phản.
- Giữ nút "trở lại" ở góc trên bên trái các trang phụ (Android); iOS vuốt từ mép trái.
- Bottom navigation tối đa 4 tab. OMTS dùng (chốt 28/10/2026) `src/app/components/bottom-nav.tsx`: Tổng quan | nút quét
  QR tròn nổi ở giữa | Tài khoản. Nút giữa là hành động, không phải tab: quét bằng `scanQr` rồi mở màn theo loại mã
  (`src/shared/platform/scan-targets.ts`, hiện có mã truy xuất; điểm danh và loại khác thêm quy tắc ở đó). Thông báo mở từ
  chuông góc trên bên trái của các trang chính (`PageHeader bell`), không phải tab. Truy xuất và Thông báo là trang chi
  tiết. Quét QR của Zalo cần quyền được Zalo duyệt (mục 5).
- Luôn có trạng thái đang tải, lỗi, mất kết nối. Phản hồi kết quả bằng modal, popup hoặc trang kết quả;
  modal thông báo thành công tự tắt sau 1,5 giây.
- Vùng chạm 7 đến 9 mm; ưu tiên component ZaUI (`zmp-ui`).
- Font hệ thống; cỡ chữ 20, 18, 16, 15, 14, 12, 10.
  Màu: NL300 nội dung chính, NL700 nội dung phụ, NL500 đoạn mô tả dài; BL300 link,
  GL300 thành công, OL300 cảnh báo, RL300 lỗi.

## 9. Đăng nhập bằng tài khoản Zalo

1. Mini App gọi `getAccessToken()` của `zmp-sdk`.
2. Gửi access token lên `OMTS.Api`.
3. Backend gọi `GET https://graph.zalo.me/v2.0/me?fields=id,name,picture` với hai header
   `access_token` và `appsecret_proof` = HMAC-SHA256(access_token, app secret), dạng hex
   (bắt buộc từ 01/01/2024).
4. `id` trả về là duy nhất cho mỗi người dùng **trong phạm vi một Zalo App**. Map `id` này với
   `Customer.ZaloAccountId` hoặc tài khoản thương lái/nhân viên, rồi phát JWT của OMTS.

- Số điện thoại: `getPhoneNumber()` chỉ trả về **token**; backend đổi token lấy số thật qua Open API.
  Chỉ gọi khi người dùng dùng tính năng cần số điện thoại (ví dụ lúc liên kết tài khoản).

## 10. Thanh toán (thương lái trả tiền cho HTX)

### Bắt buộc

- App có hiển thị giá và chức năng thanh toán **phải tích hợp Checkout SDK**. Tự hiện QR chuyển
  khoản ngoài luồng Checkout SDK là vi phạm. Chưa tích hợp thì không hiện giá và đổi nút mua/thanh toán
  thành "Liên hệ" hoặc "Tư vấn".
- Mọi phương thức thanh toán phải khai báo trong Mini App Center (mục Checkout SDK). Mọi giao dịch
  phải được người dùng xác nhận trên giao diện của Zalo và được Zalo ghi nhận.

### Luồng đã chốt: chuyển khoản VietQR + webhook qua "phương thức riêng"

1. Backend OMTS tạo đơn và tính `mac` = HMAC-SHA256(privateKey, chuỗi `key=value` nối bằng `&`,
   sắp xếp key tăng dần, gồm `amount, desc, extradata, item, method`; object chuyển thành JSON string).
   Private key chỉ nằm ở backend. Từ ZMP SDK 2.45.0, thiếu `mac` là bị từ chối.
2. Mini App gọi `CheckoutSDK.createOrder({ amount, desc, item, extradata, method, mac })`
   với `method = JSON.stringify({ id: "<mã phương thức riêng>", isCustom: true })`.
3. Mini App nghe `events.on(EventName.OnDataCallback, ...)`. Khi `eventType === "PAY_BY_CUSTOM_METHOD"`
   sẽ nhận `{ method, orderId }`; gọi backend để lấy QR cho đơn đó.
4. Backend gọi payOS hoặc SePay tạo QR. **Mini App tự vẽ QR ngay trong app**, không mở `checkoutUrl`
   hay bất kỳ trang thanh toán bên ngoài nào.
5. Thương lái chuyển khoản bằng app ngân hàng. payOS/SePay gửi webhook về `OMTS.Api`.
6. Backend xác nhận đã thanh toán (điều kiện bên dưới), cập nhật đơn trong OMTS, rồi báo Zalo:
   `POST https://payment-mini.zalo.me/api/transaction/<MiniAppId>/custom-callback-payment`
   với `appId, orderId, resultCode, mac`;
   `mac` = HMAC-SHA256(privateKey, `appId={appId}&orderId={orderId}&resultCode={resultCode}&privateKey={privateKey}`);
   `resultCode`: 1 thành công, 0 đã hoàn tiền, -1 thất bại. Lỗi thì gọi lại cho tới khi thành công.
7. Mini App hỏi backend trạng thái đơn rồi hiện kết quả.

- Phương thức chuyển khoản có sẵn của Zalo (`BANK`): cấu hình số tài khoản, chủ tài khoản, ngân hàng,
  nội dung chuyển khoản trong Mini App Center. Zalo POST về **Notify URL**
  `{ data: { appId, orderId, method }, mac }` với `mac` = HMAC-SHA256(privateKey,
  `appId=..&orderId=..&method=..`); backend trả `{ returnCode: 1 }`. Xác nhận tiền về bằng
  `.../bank-callback-payment`. Chưa rõ nội dung chuyển khoản có tự gắn mã đơn không, nên thử trên
  `BANK_SANDBOX` trước khi dùng.
- Callback URL của Checkout SDK được gọi từ IP `118.102.2.29` và `49.213.78.2` (cần whitelist).
- Phương thức `*_SANDBOX` chỉ hiện với Admin, Developer và tester.
- Chưa rõ "phương thức riêng" có cần Zalo duyệt riêng không: hỏi hotrodoitac@zaloplatforms.com.

### Server chỉ coi là "đã thanh toán" khi đủ cả bốn điều kiện

1. Chữ ký hoặc khóa xác thực của webhook hợp lệ.
2. Mã đơn trong giao dịch khớp với một đơn đang chờ thanh toán.
3. Số tiền nhận được đủ bằng số tiền của đơn. Thiếu thì ghi nhận trả một phần, không báo thành công.
4. Mã giao dịch ngân hàng chưa từng được xử lý (webhook có thể bị gửi lại nhiều lần).

- Khoản tiền vào không có mã đơn: bỏ qua hoặc đưa vào danh sách đối soát bằng tay.
- **Client không bao giờ tự quyết định là đã thanh toán**; chỉ hiển thị trạng thái server trả về.

### Màn hình QR

- Hỏi backend mỗi 3 đến 5 giây khi màn hình QR đang mở.
- Hỏi ngay khi nhận `EventName.AppResumed` (thương lái quay lại từ app ngân hàng).
- Dừng hỏi khi QR hết hạn hoặc người dùng rời màn hình. Có nút "Tôi đã chuyển khoản" để kiểm tra ngay.
- Điện thoại không quét được QR trên chính màn hình của nó: có nút lưu ảnh QR (`saveImageToGallery`,
  cần Zalo duyệt quyền) và hiện số tài khoản, số tiền, nội dung chuyển khoản để chép.

### Bên trung gian xác nhận chuyển khoản (kiểm tra ngày 24/10/2026, giá có thể đổi)

| | payOS (của Casso) | SePay |
|---|---|---|
| Khớp tiền với đơn | VietQR Pro: mỗi đơn một tài khoản ảo, chuyển sai số tiền bị từ chối hoặc hoàn lại | Mã đơn trong nội dung chuyển khoản, hoặc tài khoản ảo (VA) |
| QR | API tạo link trả về `qrCode` (chuỗi VietQR) | Tự tạo VietQR từ số tài khoản, số tiền, mã đơn |
| Ngân hàng | Tài liệu không công bố danh sách | ACB, BIDV*, MBBank, MSB*, KienlongBank*, OCB*, Sacombank, TPBank, VietinBank, VPBank (*bắt buộc VA). Chưa có Vietcombank, Techcombank |
| Phí | Không thu theo % giao dịch; BIDV tặng gói 1.000 giao dịch/năm cho doanh nghiệp đến 31/12/2026 | Miễn phí 50 giao dịch tiền vào/tháng; gói trả phí từ 120.000đ/tháng |
| Thử nghiệm | Không có sandbox, thử bằng giao dịch thật số tiền nhỏ | Có chế độ Test |
| Webhook | Ký bằng checksum key | HMAC-SHA256, API key hoặc OAuth 2.0; gửi lại tối đa 7 lần trong khoảng 33 phút |

- Chọn **payOS** nếu ngân hàng của HTX được hỗ trợ: tiền tự khớp theo đơn, thương lái không cần gõ
  nội dung chuyển khoản.
- Chọn **SePay** nếu thương lái hay trả một khoản công nợ thành nhiều lần.
- payOS cho biết hạ tầng chạy trên Google Cloud: chỉ gửi mã đơn và số tiền, không gửi dữ liệu cá nhân.
- Casso Flow (đồng bộ ngân hàng + webhook) tính phí theo năm; chính Casso khuyên dùng payOS để
  xác nhận thanh toán.

## 11. Việc còn tồn đọng

- `POST api/auth/zalo/link`, `POST api/auth/zalo/login`, `DELETE api/me/zalo-link` và CORS cho `https://h5.zdn.vn`
  đã viết ở backend (28/10/2026) nhưng chưa vào `develop`: chờ mã Jira để mở PR. Development dùng `Zalo:Provider = Fake`
  (token `fake:<id>`, `fake:<số>`); thử với Zalo thật cần `Zalo:Provider = Graph` và secret key của Zalo App.
- Kênh Push chưa chốt (OMTS-215): `PUSH_PROVIDER` trong `src/shared/config/env.ts` đang là `"none"`, màn tùy chọn thông
  báo hiện Push là chưa khả dụng; đổi sang `"zalo"` thì luồng xin quyền + đăng ký thiết bị trong
  `src/features/notifications/api/push.ts` được bật.
- **Mọi chữ hiện cho người dùng bằng tiếng Việt** (chốt 28/10/2026), kể cả thông báo MSGxx: backend trả chữ tiếng
  Anh trong `detail` nhưng app không hiện chữ đó, mà dịch theo `code` ở `errorText` (`src/shared/lib/messages.ts`,
  một chỗ duy nhất). Thêm mã lỗi mới ở backend thì thêm chữ tiếng Việt vào `SERVER_TEXT`; thêm loại thông báo
  mới thì thêm vào `KINDS` của `src/features/notifications/pages/inbox-page.tsx`. Nghiệm thu so khớp MSGxx nguyên văn tiếng Anh
  cần thống nhất lại với SRS.
- Số liệu và việc cần làm trên dashboard vẫn là dữ liệu mẫu trong `src/shared/navigation` và feature sở hữu dữ liệu
  (`roles.ts`, `content.ts`) cho tới khi các module đó nối API; chức năng hiện ra đã lọc theo quyền thật.
- `nativeStorage` của zmp-sdk không ghi gì khi chạy ngoài Zalo (`npm start`): phiên chỉ sống trong một lần
  mở trang, tải lại trang là mất; trong Zalo cần quyền native storage được duyệt.
- Thông tin HTX trong `src/shared/config/cooperative.ts` (mã số, địa chỉ, điện thoại, kênh hỗ trợ) là dữ liệu mẫu,
  phải thay bằng thông tin thật trước khi gửi duyệt (xem mục 4).

- Splash (`src/app/components/splash.tsx`) đã rút còn 0,6 giây giữ ảnh và 0,3 giây mờ dần. Vẫn nên bỏ qua splash
  khi mở từ QR truy xuất, và cân nhắc `selfControlLoading` (xem mục 8).
- "Cỡ chữ" lưu bằng `nativeStorage`, mà quyền này phải xin Zalo duyệt (mục 5). Chưa duyệt thì lựa chọn chỉ
  giữ trong lần mở app hiện tại.
- Nội dung "Điều khoản sử dụng" trong `src/features/account/pages/account-page.tsx` là bản nháp, HTX cần duyệt trước khi gửi Zalo.
- "Xóa dữ liệu của tôi" mới mở chính sách bảo mật (hướng dẫn gọi HTX), chưa xóa được trong app như mục 6 yêu cầu.
- Tên app "OTMS" trong `app-config.json` đang viết hoa toàn bộ (xem mục 3).
- Tên viết tắt chưa thống nhất: repo, Jira, backend và README dùng "OMTS" (Oyster Management and Traceability
  System), còn mục 1, `app-config.json` và giao diện dùng "OTMS". Chốt một tên trước khi gửi duyệt.
- Header do app tự vẽ phải chừa vùng menu Zalo ở góc trên bên phải.

## Nguồn

- Chính sách kiểm duyệt: https://mini.zalo.me/documents/zalo-mini-app-censorship-policy/
- Điều khoản sử dụng, thỏa thuận nhà phát triển: https://mini.zalo.me/documents/zalo-mini-app-developer-program-agreement/
- Quy trình xác thực: https://mini.zalo.me/documents/zalo-mini-app-developer-program-agreement/mini-app-verification/
- Hàng hóa, dịch vụ cấm, hạn chế, có điều kiện: https://mini.zalo.me/documents/zalo-mini-app-developer-program-agreement/regulated-products-and-services/
- Design guidelines: https://mini.zalo.me/documents/intro/zalo-mini-app-design-guidelines/
- Xin quyền: https://mini.zalo.me/documents/intro/request-permission/
- Đăng nhập bằng Zalo: https://mini.zalo.me/documents/intro/authen-user/
- Gọi API, CORS: https://mini.zalo.me/documents/intro/call-api/
- Lỗi thường gặp: https://mini.zalo.me/documents/intro/frequently-solved-issues/
- Cấu hình app-config: https://mini.zalo.me/documents/devtools/app-config/
- Checkout SDK: https://mini.zalo.me/documents/checkout-sdk/
- payOS: https://payos.vn/docs/
- SePay: https://developer.sepay.vn/en/sepay-webhooks
