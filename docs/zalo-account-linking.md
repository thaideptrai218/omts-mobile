# Backend cần làm gì để "Liên kết tài khoản" Zalo hoạt động

Tài liệu bàn giao cho người làm `omts-backend`. Cập nhật 28/10/2026.

Mobile (Zalo Mini App) **không có form tên đăng nhập + mật khẩu**: Zalo ẩn khỏi tìm kiếm và Mini App Store những
app có form đó (`CLAUDE.md` mục 5). Nhân viên và thương lái vào app bằng **Liên kết tài khoản**: liên kết tài khoản
Zalo **một lần** với hồ sơ OMTS qua **số điện thoại Zalo**, sau đó mở app là vào thẳng. Phía mobile đã viết xong
và gọi đúng các endpoint dưới đây (`src/services/acs/link.ts`, `src/services/zalo.ts`, `src/pages/auth/link.tsx`).
Backend `develop` (sau OMTS-198) **chưa có** các endpoint này. Hiện bấm "Liên kết bằng số điện thoại Zalo" sẽ báo
"Máy chủ OMTS chưa hỗ trợ liên kết tài khoản Zalo".

Mọi API tài khoản khác của OMTS-198 giữ nguyên và mobile đã dùng được: xác minh mã, khôi phục mật khẩu, đổi
mật khẩu, hồ sơ, tùy chọn thông báo, đăng xuất, `api/me/permissions`.

## 1. Danh sách việc

### Bắt buộc (thiếu là không liên kết được)

| # | Việc | Mục |
|---|---|---|
| B1 | `POST api/auth/zalo/link`: liên kết bằng số điện thoại Zalo, phát phiên OMTS | [3.1](#31-post-apiauthzalolink) |
| B2 | `POST api/auth/zalo/login`: vào lại bằng Zalo cho tài khoản đã liên kết | [3.2](#32-post-apiauthzalologin) |
| B3 | `DELETE api/me/zalo-link`: người dùng tự gỡ liên kết | [3.3](#33-delete-apimezalo-link) |
| B4 | Cột `Account.ZaloAccountId` (unique) + migration | [5](#5-dữ-liệu) |
| B5 | Adapter gọi Zalo Open API (`Graph`) + bản giả `Fake` cho Development, cấu hình app secret | [4](#4-gọi-zalo-open-api), [6](#6-cấu-hình-và-bản-giả-cho-development) |
| B6 | CORS cho origin `https://h5.zdn.vn` (Program.cs hiện không có CORS) | [7](#7-cors-và-triển-khai) |
| B7 | Triển khai API trên **HTTPS, tên miền** (không dùng IP), server đặt tại Việt Nam | [7](#7-cors-và-triển-khai) |

### Nên làm cùng đợt (không chặn liên kết nhưng chặn một số màn)

| # | Việc | Vì sao |
|---|---|---|
| N1 | Cho tài khoản **không có mật khẩu** đổi email/số điện thoại mà không cần `currentPassword` | Thương lái tạo từ Zalo không biết mật khẩu, nên `POST api/me/contact-changes` (đang bắt buộc `currentPassword`) luôn trả MSG01 với họ. Gợi ý: thêm cờ `Account.HasPassword` (hoặc `PasswordSetAt`); khi chưa có mật khẩu thì yêu cầu phiên được tạo bằng Zalo trong ít phút gần đây, hoặc xác minh qua số điện thoại hiện tại. Cần chốt cách chứng minh. |
| N2 | Chốt: phiên tạo bằng Zalo có còn bị **cổng đổi mật khẩu tạm** không | Nhân viên Chủ HTX vừa tạo có `MustChangePassword = true`. Mobile đã xử lý cổng này: người dùng nhập mật khẩu tạm + mật khẩu mới. Nếu muốn mobile không có ô mật khẩu nào thì backend bỏ cờ khi liên kết bằng Zalo (mật khẩu chỉ còn dùng cho web). |

### Để sau (không liên quan tới liên kết)

- Push qua Zalo khi OMTS-215 chốt kênh thông báo. Mobile đã có sẵn: gọi `POST api/me/devices` với `token` = Zalo user ID
  (`getUserID()`), `platform` = `ios`/`android`/`web`, `permissionGranted`. `PushDeviceService` hiện mô tả token là "Expo
  push token", nên cần thêm provider gửi qua Zalo OA/ZNS.

## 2. Luồng

```
Mini App                                   OMTS.Api                                   Zalo
   |  bấm "Liên kết bằng số điện thoại Zalo"  |                                          |
   |  getAccessToken()  ─────────────────────────────────────────────────────────────▶  |  (không hỏi người dùng)
   |  POST api/auth/zalo/login {zaloAccessToken}                                         |
   |  ───────────────────────────────────────▶|  GET graph.zalo.me/v2.0/me  ───────────▶|  → id
   |                                          |  tìm Account.ZaloAccountId = id          |
   |  ◀── 200 AuthTokens (đã liên kết, xong)  |                                          |
   |  ◀── 404 ZALO_NOT_LINKED (chưa liên kết) |                                          |
   |  getPhoneNumber()  ─────────────────────────────────────────────────────────────▶  |  (Zalo hiện hộp thoại xin số)
   |  POST api/auth/zalo/link {zaloAccessToken, phoneToken, createTrader:false}          |
   |  ───────────────────────────────────────▶|  GET graph.zalo.me/v2.0/me ────────────▶|  → id
   |                                          |  GET graph.zalo.me/v2.0/me/info ───────▶|  → số điện thoại
   |                                          |  tìm Account theo số, gắn ZaloAccountId  |
   |  ◀── 200 AuthTokens + created/notice     |                                          |
   |  ◀── 404 ZALO_PHONE_NOT_FOUND            |                                          |
   |  (người dùng chọn "Tạo tài khoản thương lái")                                       |
   |  getAccessToken(), getPhoneNumber() lại (token số chỉ dùng 1 lần)                   |
   |  POST api/auth/zalo/link {..., createTrader:true} ─▶ tạo thương lái, gắn Zalo, phát phiên
```

- Mở app mà không còn phiên trên máy: mobile gọi `POST api/auth/zalo/login` **im lặng** (không bật hộp thoại nào),
  trừ khi người dùng vừa chủ động đăng xuất. Lỗi của lời gọi im lặng không hiện cho người dùng.
- Phiên trả về đi qua các cổng sẵn có: `mustChangePassword` → cổng đổi mật khẩu tạm; `phoneVerificationRequired`
  phải là `false` sau khi liên kết vì Zalo đã xác minh số.
- Đăng xuất (`POST api/auth/logout`) chỉ thu hồi phiên, **không** gỡ liên kết Zalo.

## 3. Endpoint

Mọi lỗi trả RFC 7807 problem details có `code` và `detail` như các API hiện có (`ProblemResults.Create`). Enum đi
bằng tên (`"Mobile"`). Mobile hiện nguyên văn `detail` cho người dùng, trừ các mã ghi chú riêng ở bảng mục 3.4.

### 3.1 `POST api/auth/zalo/link`

Anonymous. Rate limit `RateLimitingExtensions.Logins`.

Request:

```json
{
  "zaloAccessToken": "…",
  "phoneToken": "…",
  "createTrader": false,
  "clientType": "Mobile",
  "deviceName": "Zalo Mini App android 24.10.1"
}
```

| Trường | Bắt buộc | Ghi chú |
|---|---|---|
| `zaloAccessToken` | có | Từ `getAccessToken()` trên Mini App |
| `phoneToken` | có | Từ `getPhoneNumber()`; dùng **một lần**, hết hạn sau **2 phút** |
| `createTrader` | không, mặc định `false` | `true` khi người dùng đã đồng ý tạo tài khoản thương lái mới |
| `clientType` | không, mặc định `Mobile` | Quyết định thời hạn refresh token (Mobile 30 ngày, tối đa 90) |
| `deviceName` | không | Như `LoginRequest.DeviceName` |

Xử lý:

1. Lấy `zaloId` từ `zaloAccessToken` (mục 4.1). Lỗi → 401 `ZALO_TOKEN_INVALID`.
2. Đổi `phoneToken` lấy số (mục 4.2), chuẩn hóa bằng `PhoneNumbers.Normalize`. Lỗi → 400 `ZALO_PHONE_TOKEN_INVALID`.
3. Nếu `zaloId` đã gắn với một tài khoản khác tài khoản tìm được ở bước 4 → 409 `ZALO_ALREADY_LINKED`.
4. Tìm `Account` có `PhoneNumber` = số đó, **kể cả chưa xác minh** (Chủ HTX nhập số cho nhân viên). Nhiều tài khoản
   trùng số → 409 `ZALO_PHONE_AMBIGUOUS`.
   - **Tìm thấy, Active**: gắn `ZaloAccountId = zaloId`; nếu `PhoneVerifiedAt` còn null thì đặt `= now` (Zalo đã xác minh
     số; với thương lái gọi `TraderCustomerLinker.ApplyVerifiedPhoneAsync`, trả MSG57 khi nhiều hồ sơ khách cũ trùng số);
     audit `Account.ZaloLinked`; phát phiên.
   - **Tìm thấy, Locked** → 403 MSG13 (`UserMessages.AccountUnusable`).
   - **Mật khẩu tạm đã hết hạn** (`IsTemporaryPasswordExpired`) → 403 MSG68, giống đăng nhập (trừ khi chốt N2 là bỏ cổng).
   - **Không thấy, `createTrader = false`** → 404 `ZALO_PHONE_NOT_FOUND` kèm `maskedPhone` (ví dụ `"09******89"`).
     Không tạo gì.
   - **Không thấy, `createTrader = true`** → tạo thương lái như `RegistrationService.RegisterAsync`: `SubjectType.Trader`,
     username bằng `UsernameGenerator.NewTraderUsernameAsync`, `PhoneNumber` = số, `PhoneVerifiedAt = now`, `DisplayName`
     = số điện thoại (người dùng sửa trong hồ sơ), `PasswordHash` = hash của một chuỗi ngẫu nhiên không ai biết
     (`PasswordHash` không nhận null; muốn dùng web thì đặt mật khẩu qua Quên mật khẩu ACS-03), liên kết hồ sơ khách cũ
     qua `TraderCustomerLinker`, gắn `ZaloAccountId`, audit như đăng ký; phát phiên.
5. Phát phiên bằng `AuthService.CreateSessionAsync(account, clientType, deviceName, client)` (như `PasswordChangeService`),
   cập nhật `LastLoginAt`.

Response 200: `AuthTokens` cộng ba trường:

```json
{
  "accessToken": "…",
  "accessTokenExpiresAt": "2026-10-28T10:15:00+00:00",
  "refreshToken": "…",
  "refreshTokenExpiresAt": "2026-11-27T10:00:00+00:00",
  "accountId": "…",
  "displayName": "…",
  "subjectType": "Trader",
  "mustChangePassword": false,
  "phoneVerificationRequired": false,
  "created": true,
  "oldDocumentsHidden": false,
  "notice": null
}
```

`created`: vừa tạo tài khoản thương lái. `oldDocumentsHidden` + `notice`: `notice` là chữ MSG57 khi nhiều hồ sơ khách
cũ trùng số, ngược lại `null`.

### 3.2 `POST api/auth/zalo/login`

Anonymous. Rate limit `Logins`.

```json
{ "zaloAccessToken": "…", "clientType": "Mobile", "deviceName": "…" }
```

Lấy `zaloId` như mục 4.1, tìm `Account.ZaloAccountId == zaloId`:

- Active → phát phiên như 3.1 bước 5, trả `AuthTokens` (không cần ba trường thêm).
- Không có → 404 `ZALO_NOT_LINKED`. Mobile coi đây là bình thường và chuyển sang hỏi số điện thoại.
- Locked → 403 MSG13. Mật khẩu tạm hết hạn → 403 MSG68. Token hỏng → 401 `ZALO_TOKEN_INVALID`.

Không gọi `/v2.0/me/info`, không cần token số điện thoại.

### 3.3 `DELETE api/me/zalo-link`

`[Authorize]`. Đặt `ZaloAccountId = null`, thu hồi phiên hiện tại, audit `Account.ZaloUnlinked`, trả 204. Gọi lại khi
đã gỡ vẫn trả 204. Phục vụ quy định Zalo: người dùng tự xóa được dữ liệu liên kết của mình. Chủ HTX gỡ hộ trên web
(ACS-09) là việc riêng, ngoài phạm vi.

### 3.4 Mã lỗi mới (ngoài danh sách SRS)

Thêm vào `UserMessages`. Chữ dưới đây là đề xuất, giữ phong cách tiếng Anh như các mã hiện có.

| Mã | HTTP | `detail` đề xuất | Mobile xử lý |
|---|---|---|---|
| `ZALO_TOKEN_INVALID` | 401 | The Zalo account could not be verified. Please open OMTS from Zalo and try again. | Hiện `detail` |
| `ZALO_PHONE_TOKEN_INVALID` | 400 | The phone number could not be read from Zalo. Please try again. | Hiện `detail` |
| `ZALO_PHONE_NOT_FOUND` | 404 | No OMTS account uses this phone number. (+ `maskedPhone`) | Hộp thoại riêng: tạo tài khoản thương lái / nhân viên nhờ Chủ HTX sửa số |
| `ZALO_PHONE_AMBIGUOUS` | 409 | Several OMTS accounts use this phone number. Please contact the support channel. | Hiện `detail` |
| `ZALO_ALREADY_LINKED` | 409 | This Zalo account is already linked to another OMTS account. | Hiện `detail` |
| `ZALO_NOT_LINKED` | 404 | This Zalo account is not linked to OMTS yet. | Không hiện; chuyển sang xin số điện thoại |

Lưu ý: 404 **không kèm `code`** (đường dẫn không tồn tại) được mobile hiểu là "máy chủ chưa hỗ trợ liên kết". Vì vậy
`ZALO_NOT_LINKED` và `ZALO_PHONE_NOT_FOUND` bắt buộc phải có `code`.

## 4. Gọi Zalo Open API

Đã đối chiếu với tài liệu chính thức ngày 28/10/2026:
[getPhoneNumber](https://docs.zaloplatforms.com/docs/MA/api/user/user-information/getPhoneNumber),
[authen-user](https://miniapp.zaloplatforms.com/documents/intro/authen-user/),
[mã lỗi](https://docs.zaloplatforms.com/docs/MA/api/errorCode). Chỉ backend gọi; app secret không bao giờ nằm trong
Mini App (`CLAUDE.md` mục 7).

### 4.1 Access token → Zalo user ID

```
GET https://graph.zalo.me/v2.0/me
access_token: <zaloAccessToken>
appsecret_proof: <HMAC-SHA256(access_token, app secret), dạng hex>
```

```json
{ "id": "3681046936240438345", "name": "…", "picture": { "data": { "url": "…" } }, "error": 0, "message": "Success" }
```

- Lấy `id`. `error` khác 0 hoặc thiếu `id` → `ZALO_TOKEN_INVALID`.
- `appsecret_proof` bắt buộc từ 01/01/2024. Trang authen-user không hiện được đoạn code mẫu; cách tính trên theo
  `CLAUDE.md` mục 9. Đối chiếu lại ở [tài liệu Social API](https://developers.zalo.me/docs/api/social-api/tai-lieu/thong-tin-nguoi-dung-post-28)
  khi làm.
- `id` là duy nhất cho mỗi người dùng **trong một Zalo App ID** (không phải trong một Mini App). Đổi Zalo App là đổi ID.
- Không lưu `name`, `picture`: không cần cho liên kết, và lấy tên/ảnh phải được người dùng cho phép riêng.

### 4.2 Token số điện thoại → số điện thoại

```
GET https://graph.zalo.me/v2.0/me/info
access_token: <zaloAccessToken>
code: <phoneToken>
secret_key: <app secret>
```

```json
{ "data": { "number": "849123456789" }, "error": 0, "message": "Success" }
```

- Số nằm ở `data.number`, dạng `84…` không có `+`, không có số 0 đầu. `PhoneNumbers.Normalize` đổi `84` + 9 số thành
  `0` + 9 số. Ví dụ trong tài liệu Zalo có 12 chữ số (không khớp quy tắc 10 số của VN), nên phải thử với số thật.
- Mã lỗi (`error` > 0): 114 thiếu code, 115 code không hợp lệ, 116 thiếu secret_key, 117 secret_key sai,
  118 code thuộc ứng dụng khác, 119 code đã dùng. Tất cả → `ZALO_PHONE_TOKEN_INVALID`; 116/117 là lỗi cấu hình, ghi log
  mức error.
- Token dùng một lần, hết hạn sau 2 phút: không retry cùng token.

## 5. Dữ liệu

- `Account.ZaloAccountId`: `string?`, max length như `Customer.ZaloAccountId` (`Lengths.ShortText`), **unique index**
  (lọc null). Migration mới.
- `Customer.ZaloAccountId` đã có nhưng không dùng cho đăng nhập; chủ thể đăng nhập là `Account`. Có thể bỏ hoặc giữ
  đồng bộ khi tạo thương lái, tùy người làm backend.
- Audit: `Account.ZaloLinked` (Before/After `ZaloAccountId` đã che), `Account.ZaloUnlinked`. Không ghi token vào log hay
  audit (`AuditValueSerializer` đã che các khóa chứa "token").

## 6. Cấu hình và bản giả cho Development

| Khóa | Ghi chú |
|---|---|
| `Zalo:Provider` | `Graph` (thật) hoặc `Fake`. Mặc định `Graph`; `appsettings.Development.json` đặt `Fake` |
| `Zalo:AppId` | Zalo App ID (không phải Mini App ID) |
| `Zalo:AppSecret` | Secret store / user-secrets. **Bắt buộc** khi `Graph`; thiếu thì khởi động báo lỗi rõ |
| `Zalo:TimeoutSeconds` | Mặc định 10 |

Bản `Fake` (giống `FakeSmsSender`, chỉ chạy ở Development):

- Access token `fake:<zaloId>` → user ID `<zaloId>`. Chuỗi khác → `ZALO_TOKEN_INVALID`.
- Phone token `fake:<số điện thoại>` → số đó. Chuỗi khác → `ZALO_PHONE_TOKEN_INVALID`.

Thử local với mobile (`npm start`, chạy trong trình duyệt): mở DevTools của khung app rồi chạy

```js
window.__OMTS_FAKE_ZALO__ = { accessToken: "fake:u1", phoneToken: "fake:0912345678" };
```

rồi bấm "Liên kết bằng số điện thoại Zalo". Bản giả phía mobile chỉ có trong bản dev (`import.meta.env.DEV`).

## 7. CORS và triển khai

- Mini App chạy ở origin `https://h5.zdn.vn`. Thêm `AddCors` + `UseCors` (trước `UseAuthentication`) cho **mọi** request,
  kể cả preflight `OPTIONS`; header `Authorization`, `Content-Type`; method `GET, POST, PUT, DELETE`. Cần thêm origin dev
  (`http://localhost:3000`) thì đọc origin của request và trả đúng **một** giá trị (`WithOrigins(...)` của ASP.NET Core
  làm đúng như vậy), không nối nhiều origin bằng dấu phẩy.
- API phải chạy HTTPS trên tên miền, chứng chỉ còn hạn. Mini App không gọi được `http://` hay địa chỉ IP.
- Server đặt tại Việt Nam (quy định dữ liệu của Zalo, `CLAUDE.md` mục 6).
- Mobile trỏ tới API qua biến `VITE_API_BASE_URL` lúc build (xem `.env.example`).

## 8. Phía Zalo (người quản lý Mini App làm)

- Xin duyệt quyền **số điện thoại** (`scope.userPhonenumber`) và **native storage** cho Mini App. Chưa duyệt thì chỉ tài
  khoản Developer/Admin của Mini App liên kết được; người khác bị từ chối và app báo "chưa chia sẻ số điện thoại".
- Lấy Zalo App ID + secret key ở developers.zalo.me ("Quản lý ứng dụng") cho cấu hình `Zalo:*`.

## 9. Tiêu chí xong

Integration test cho backend (dùng `Fake`):

- [ ] Số khớp nhân viên chưa xác minh SĐT → 200, `phoneVerificationRequired = false`, `ZaloAccountId` được gắn, `PhoneVerifiedAt` có giá trị.
- [ ] Nhân viên có mật khẩu tạm → 200 với `mustChangePassword = true`; mật khẩu tạm hết hạn → 403 MSG68.
- [ ] Số không có tài khoản, `createTrader = false` → 404 `ZALO_PHONE_NOT_FOUND` có `maskedPhone`, không tạo gì.
- [ ] Số không có tài khoản, `createTrader = true` → 200, `created = true`, tài khoản thương lái mới; nhiều hồ sơ khách cũ trùng số → `notice` = MSG57.
- [ ] Tài khoản bị khóa → 403 MSG13.
- [ ] Zalo ID đã gắn tài khoản khác → 409 `ZALO_ALREADY_LINKED`.
- [ ] `zalo/login`: đã liên kết → 200; chưa liên kết → 404 `ZALO_NOT_LINKED`.
- [ ] `DELETE api/me/zalo-link` → 204, sau đó `zalo/login` → 404 `ZALO_NOT_LINKED`, phiên cũ bị thu hồi.
- [ ] Token hỏng → 401 `ZALO_TOKEN_INVALID`; phone token hỏng → 400 `ZALO_PHONE_TOKEN_INVALID`.
- [ ] Preflight `OPTIONS` từ `https://h5.zdn.vn` trả đúng một `Access-Control-Allow-Origin`.

Kiểm thử chung với mobile:

- [ ] `npm start` + backend local (`Zalo:Provider = Fake`) + `window.__OMTS_FAKE_ZALO__`: liên kết, mở lại app, đăng xuất, hủy liên kết chạy hết.
- [ ] Bản Development deploy (`zmp deploy`), quét QR trên một máy Android và một máy iOS, backend HTTPS: liên kết bằng số Zalo thật.

Kịch bản chạy tự động phía mobile: `scripts/e2e-acs.mjs` (hiện giả lập ba endpoint trên bằng `page.route`; khi backend có
thật thì bỏ phần giả lập).
