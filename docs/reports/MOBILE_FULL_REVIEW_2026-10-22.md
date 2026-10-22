# Review toàn bộ batch Mobile trước commit/push

Ngày: 22/10/2026. Repository: `thaideptrai218/omts-mobile`.
Nhánh: `feature/OMTS-133-mobile-foundation`.
Mốc so sánh: `e807576` — commit đã push trước batch này.

## Kết luận

Đã review phần thay đổi tracked và source mới chưa commit: recovery/new password,
password change, profile, notification preferences, logout/SecureStore, shared
password policy, message catalog, accessibility, dependency/config, tests và CI.
Các lỗi có thể sửa trong phạm vi frontend được sửa kèm regression tests.

Batch có thể được lưu và push lên nhánh chức năng để nhóm review tiếp. Chưa đủ
bằng chứng nghiệm thu Mobile trên QA API/Expo Go hoặc để kết luận sẵn sàng phát
hành. Không merge vào develop và không chuyển Jira sang Done từ báo cáo này.

## Các lỗi đã sửa trong lần review

| Mã | Mức ảnh hưởng | Tình huống và nguyên nhân | Cách sửa và bằng chứng |
| --- | --- | --- | --- |
| R1 | P1 | Password change, recovery và logout gọi callback sau khi màn đã unmount. Response cũ có thể điều hướng đè màn mới. | Thêm request scope theo vòng đời; response cũ không cập nhật UI/callback. Ba regression tests đã tái hiện callback bị gọi trước sửa. |
| R2 | P1 | Save/permission của nguồn notification cũ có thể ghi vào state của nguồn mới. Chỉ kiểm tra mounted không đủ vì component vẫn đang mount. | Scope phụ thuộc cả service và permission repository; mỗi request giữ handle riêng. Hai tests chứng minh response cũ không làm nguồn mới hết phiên hay đổi quyền thiết bị. |
| R3 | P1 | Profile đổi service nhưng load nguồn mới thất bại vẫn giữ hồ sơ cũ trong nhánh ready. | Chuyển sang loading khi thay nguồn, lỗi chuyển sang error không chứa profile; reload cùng nguồn vẫn giữ draft đúng M10.4. Có regression test. |
| R4 | P2 | Callback điều hướng ném lỗi bị catch chung với service, biến kết quả lưu thành công thành thông báo thất bại. | Thu hẹp try/catch quanh service; xử lý kết quả và callback ở ngoài. Tests xác nhận callback error không đổi MSG18 thành MSG04 và không gọi nhầm logout error callback. |
| R5 | P1 | Một cleanup throw đồng bộ ngay lúc tạo mảng Promise.allSettled khiến các cleanup sau chưa được gọi. | Đưa từng lời gọi vào Promise.resolve().then(...). Test chứng minh cache và session cleanup vẫn được thử khi token cleanup throw đồng bộ. |
| R6 | P1 | Logout HTTP 401 bị coi là server session đã kết thúc; đọc token lỗi bị coi là không cần revoke. | 401 và token-read failure trả revoke failed. Backend 14d7839 có Authorize trước action; access token hết hạn không chứng minh refresh session đã bị revoke. Local cleanup vẫn được thử độc lập. |
| R7 | P2 | Chỉ xin quyền OS và nhận denied cũng hiện nội dung “các kênh khác đã lưu”, dù chưa bấm lưu. | Permission card chỉ mô tả quyền thiết bị. MSG22 với nội dung đã lưu chỉ dùng cho response save. Có test kiểm tra không báo lưu giả. |
| R8 | P2 | Expo Doctor hiện yêu cầu expo-notifications ~57.0.24, trong khi batch cài 57.0.23. | Cập nhật đúng bản vá bằng npx expo install expo-notifications. Doctor xác nhận version/peer/duplicate checks đã đạt. |

`useRequestScope` chỉ quản lý vòng đời và khóa request phía UI. Nó không hủy thao
tác đã đến server, không phải refresh coordinator và không tự chọn session policy.
Các controller phải được remount theo tài khoản/flow trong composition root;
service cần ổn định trong cùng phiên để không vô tình hủy request hợp lệ.

## Phạm vi đã đọc theo chức năng

| Phần | Đã có trong batch | Chưa phải bằng chứng hoàn tất |
| --- | --- | --- |
| OMTS-164 recovery | New-password screen/controller; shared policy; cleanup secret, duplicate protection, callback/lifecycle tests | SCR-02 flow wrapper, opaque recovery proof adapter, endpoint, route và QA |
| OMTS-168 password | Normal/forced presentation; current-password contract/controller; secret cleanup; forced mode không có Cancel | Verified-email proof, route-level gate, policy/session update và QA |
| OMTS-172 profile | Account/contact presentation; load/save/conflict/reload controller; username read-only; MSG06/20 | Contact verification, real concurrency DTO/mapping, authenticated route và QA |
| OMTS-176 notification | Server-driven cards, mock repository, OS permission adapter, draft/save/cancel, async regressions | Push channel mapping, catalog wire values, token registration, EAS credentials/build và QA |
| OMTS-180 logout | Versioned token repository, local-first cleanup service, API revoke adapter, dialog/controller | App-wide cleanup integration, route replacement/back behavior, cleanup failure recovery, deferred revoke và QA |
| Shared/config | Password policy reuse, MSG outcomes, accessibility, Expo plugin/dependency, Jest in CI | Canonical localization, actual device/font/screen-reader checks và CI runner evidence |

Không thấy token/OTP/password thật được thêm vào source/storage/log của batch.
Chuỗi token trong tests là fixture giả. Learning notes vẫn bị gitignore.
Không có thêm route showcase hay trang ghi chú kỹ thuật trong sản phẩm.

## Những điểm phải xử lý trước nghiệm thu

1. **P1 — Các màn chưa được nối thành app có session.** Export hiện chỉ có `/`,
   `/_sitemap`, `/+not-found`. Auth/app/gate stacks, bootstrap, single-flight
   refresh và permissions chưa hoàn tất. Test các component không thay thế
   kiểm thử đăng nhập → gate → app → logout trên QA API.
2. **P1 — Logout cleanup failure.** Service báo localCleanup failed nhưng lớp
   route/session thật chưa có. Trước production phải quyết định và kiểm thử cách
   ngăn bootstrap khôi phục credential còn sót, retry cleanup và thông báo đúng.
   Không tự chọn tombstone/session mechanism trong review này.
3. **P1 — Trạng thái push hiệu lực.** OS permission và preference matrix hiện là
   hai contract riêng. Cần mapping kênh push rõ ràng để local denied làm đúng
   kênh inactive kể cả server preference còn enabled. Không đoán kênh bằng nhãn
   tiếng Việt hoặc lấy ID fixture làm wire contract. Chưa đạt denied-permission
   end-to-end của OMTS-176; push token endpoint/EAS cũng còn thiếu.
4. **P2 — Lỗi mất response khi mutation.** MSG04 SRS có câu dữ liệu không đổi;
   adapter thật cần phân biệt lỗi từ chối xác định với timeout sau khi server có
   thể đã lưu. Không tự retry mutation và không khẳng định dữ liệu chắc chắn
   không đổi cho trường hợp không xác nhận được.
5. **P2 — Catalog và thiết bị.** Chốt localization, channel wire values và các
   contract đang mở trong PROJECT_CONTEXT. Chạy Android/iOS thật cho keyboard,
   autofill, font lớn, screen reader, SecureStore, connectivity và back/deep link.

## Dependency audit

`npm audit --omit=dev --json` báo **53 package bị đánh dấu: 45 high, 8 moderate**.
Đây là số package kèm cảnh báo lan truyền theo cây dependency, không phải 53 lỗi
độc lập trong code OMTS. Chưa phân tích đầy đủ khả năng khai thác trong bản native
đã build. Kết quả omit-dev vẫn chứa CLI/Metro và một số công cụ của RN do cách
chúng được khai báo trong dependency graph; không thể mặc định mọi mục là runtime.

Các advisory trực tiếp ở dependency lá trong kết quả lần này:

- [braces: stack-exhaustion DoS](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm)
- [decode-uri-component: decoding DoS](https://github.com/advisories/GHSA-vcc3-ghjq-m6fr)
- [node-forge: signature verification](https://github.com/advisories/GHSA-86w9-cpqp-85rv)
- [sprintf-js: unbounded precision DoS](https://github.com/advisories/GHSA-hp3w-g68c-fv3c)

Một số đề xuất audit yêu cầu thay major SDK/RN/Jest, thậm chí đưa Expo về major
cũ. Không chạy audit fix --force hoặc overrides chưa kiểm chứng. Cần một lát
dependency riêng: truy nguồn bằng npm explain, kiểm tra bản vá tương thích với
SDK 57, đo delta lockfile và chạy lại native build/QA. Không đánh dấu audit sạch.

## Kiểm tra cuối

```text
npm test                         40 suites / 223 tests passed
npm run lint                     passed, no warnings
npm run typecheck                passed
npx expo export --platform web   succeeded, 3 scaffold routes
git diff --cached --check        passed after removing whitespace in new files
npm ls --depth=0                 dependency tree resolved
npm audit --omit=dev --json       53 flagged packages; open findings above
```

Full run cuối đạt 223/223 trong 30.622 giây, sau khi sửa assertion optional
chaining trong test feedback: feedback null thì `feedback?.code` là undefined;
test hiện kiểm tra đúng `{ status: "ready", feedback: null }`.

Expo Doctor verbose sau cập nhật notification: **20/21 checks đạt**. Check schema
app config chưa xác nhận được do `getaddrinfo EAI_AGAIN exp.host` / `fetch failed`.
Version compatibility, required peers và duplicate dependency checks đều đạt.
Đã thử lại khi mạng vẫn lỗi; không tắt check, không đặt EXPO_OFFLINE để làm xanh giả.

Một lần full run có test skeleton vượt mặc định 5 giây. Test riêng sau đó đạt
759 ms. Không tái hiện được một lỗi logic ổn định; chưa đủ chứng cứ quy nguyên
nhân cho animation hay CPU. Không tăng timeout để che lỗi. Ghi nhận sự kiện này
để theo dõi thêm ở CI/máy QA, cùng kết quả full run cuối bên dưới.

CI hiện thêm npm test sau lint/typecheck, nhưng trigger chỉ push main/develop
hoặc PR vào hai nhánh đó. Push riêng feature branch không tự tạo CI run; báo cáo
không nhận local checks là CI green và không tự tạo PR ngoài yêu cầu commit/push.

## Git và tài liệu

Giữ nhánh hiện tại, commit batch đã review rồi push fast-forward thông thường.
Không merge/rebase/force-push develop. Remote develop trước thao tác:
`063acd5e193eedfa4e45236b720ddc3cb16a505a`.

Báo cáo từng phần trước đó được giữ để thể hiện lịch sử kiểm tra. Báo cáo này là
kết quả tổng hợp mới nhất; đặc biệt mapping logout 401 trong báo cáo cũ đã được
sửa. Bài học local 41 ghi đầy đủ red/green, lỗi lint và cách khắc phục.
