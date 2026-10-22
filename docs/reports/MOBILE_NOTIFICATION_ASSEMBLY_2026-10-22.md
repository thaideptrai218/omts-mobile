# Ghép tùy chọn thông báo mock — 22/10/2026

> Review/bàn giao tiếp theo ngày 23/10: [báo cáo chung](MOBILE_ACCOUNT_ASSEMBLY_REVIEW_2026-10-23.md), 50 suites / 292 tests. Kết quả và phạm vi ngày 22/10 bên dưới được giữ làm lịch sử; commit/push feature thuộc yêu cầu riêng ngày 23/10.

## Phạm vi

Người dùng yêu cầu ghép mock theo micro-task, tự review và báo cáo. Giữ nguyên các thay đổi MSG19/hồ sơ chưa commit; không commit/push/merge hoặc chỉnh backend/SRS/Jira trong lượt này.

## N1 — nguồn và thiết kế

Đã đối chiếu UC06/SCR-06 trong Report3Finnal.md và controller hiện có. Jira search lỗi schema do limit 5 (minimum 10); sửa 10 thì search trả 502. Đọc trực tiếp OMTS-176/174 trả 404 Issue not found, không suy ra ticket bị xóa/Done. [OMTS-124](https://welterial.atlassian.net/browse/OMTS-124) đọc được To Do, cập nhật tên UC06 thành ACS-07 và phân biệt ACS-08 xem thông báo; parent epic OMTS-118 In Progress. Chưa có catalog được duyệt.

Chỉ dùng ví dụ tổng hợp: cảnh báo chất lượng nước (bắt buộc theo UC06) và nhắc đo nước; kênh trong ứng dụng/email. ID có prefix mock, không phải enum/ID API. Email được bật chỉ khi fixture auth xác minh email; không suy từ vai trò. Push/Zalo không dựng delivery/token/channel giả. Trạng thái thiết bị unavailable, không phải granted/denied, không xin quyền OS trong slice mock.

## N2 — service theo phiên

Đã ghép. Gateway resolve credential qua mock auth để lấy đúng tài khoản ready; mỗi account có một mock repository riêng, dùng lại repository mock đã được kiểm thử. Không suy quyền từ tên role. Tùy chọn còn sau logout/login cùng tiến trình, không lẫn với account khác; reload toàn bộ reset fixture. Không thêm localStorage/AsyncStorage, token giả hoặc PII persistence.

Service qua AccountSessionScope: kiểm tra account và generation trước/sau request. Dịch vụ từ lần đăng nhập cũ không được dùng credential mới hoặc expire phiên mới, kể cả login cùng accountId. Gateway trả session-expired được chuyển thành SessionFailure bên trong scope để teardown và MSG19 xảy ra ở store; lỗi offline trả outcome riêng để giữ session/draft. Không queue, auto-save hoặc tự retry mutation khi nối mạng lại.

## N3 — route/controller

Đã nối `/account` → `/notification-preferences` trong app stack được guard sẵn. Route file chỉ export screen wrapper; service/controller/mock nằm ngoài `src/app`. Nút trên hồ sơ chỉ xuất hiện khi runtime có notification gateway thật sự được cung cấp, không dùng handler rỗng.

Controller giữ canonical và draft riêng: gạt switch không lưu; Save thành công nhận response canonical và MSG10; lỗi giữ draft. Hủy/Quay lại hồ sơ bỏ phần chưa lưu, không gọi save; loading/error cũng có Quay lại hồ sơ và error có Retry. Khi đang save, switch/save/cancel/đường quay lại trong UI bị khóa để tránh thao tác trùng; native Back vẫn cần kiểm chứng thiết bị riêng. Service/route unmount chặn response muộn tác động UI mới.

Email chưa xác minh hiển thị lý do MSG21; cảnh báo nước giữ kênh trong ứng dụng bật với MSG23. Backend mock vẫn kiểm tra nếu caller cố gửi request bật kênh bị khóa/tắt mục bắt buộc, không chỉ dựa vào disabled switch. Không thêm inbox, gửi email, local notification, đăng ký token hoặc gọi hệ thống xin quyền. Trạng thái unavailable được thể hiện là Chưa kết nối; không dùng MSG22 vì không có bằng chứng thiết bị đã từ chối.

## N4 — tự review và lỗi thực tế

- **Ranh giới danh mục:** ví dụ mock có prefix rõ; chưa mapping enum Sms/Zalo, danh mục sự kiện hoặc permission scope của API. Không gọi ví dụ này là catalog BA hoàn tất. Các kênh push/Zalo chưa ghép không được giả thành đã hoạt động.
- **Vòng đời:** test giữ response save **đã thành công ở mock server** tới sau logout/login tài khoản khác. Response không làm thoát phiên mới. Đây không phải khả năng rollback mutation server sau logout.
- **Dữ liệu riêng:** test đổi account, login lại, snapshot cũ không bị mutate, email chỉ xác minh qua SMS vẫn khóa, onboarding chưa xong không gọi được gateway preference.
- **Offline/session:** load offline có Retry/Quay lại, save offline giữ draft và không gọi gateway; reconnect không submit. Expired load/save gỡ switch và hiện login + MSG19, không còn input mật khẩu cũ.
- **Lưu trùng:** giữ save pending, bấm lần hai không gọi gateway thêm; switch/Hủy bị disabled. Canonical chỉ cập nhật sau response.
- **Test sai accessible name:** suite mới ban đầu 7/8 pass, một test báo `Unable to find an element with role: button, name: Đang lưu`. UI có accessibleLabel `Lưu tùy chọn. Đang lưu` và busy/disabled đúng. Sửa selector test theo nhãn đầy đủ; không sửa component, tăng timeout hoặc bỏ test. Sau sửa suite mới 8/8 và full suite pass.
- **Typed route cập nhật chậm:** typecheck đầu tiên báo TS2345 cho `/notification-preferences` ngay sau khi tạo route. Kiểm tra file route đã có; declaration Expo sinh sau đó đã chứa route mới. Chạy lại typecheck pass mà không cast Href/any, sửa tsconfig hoặc sửa file generated. Xem [Expo typed routes](https://docs.expo.dev/router/reference/typed-routes/) về cơ chế sinh type khi chạy dev server.
- **Giới hạn khác:** catalog email eligibility lấy khi khởi tạo repository của account. Contact-change chưa được ghép; nếu thêm sau phải làm mới eligibility từ nguồn chuẩn, không dùng trạng thái fixture cũ để thay kiểm tra backend. Không áp dụng cơ chế revision của profile sang preferences khi API chưa chốt concurrency contract.

Chưa tìm thấy P1/P2 mới trong các trường hợp mock đã kiểm tra. Không dùng câu này thay bằng chứng native/API hoặc cam kết không còn lỗi.

## N5 — bằng chứng kiểm tra và bàn giao

- `npm test`: **49 suites / 285 tests pass**, 42.967 giây; baseline MSG19/profile là 47 suites / 268 tests.
- Hai suite mới: service **9 tests**, flow/component **8 tests**. Flow dùng provider/store/controller/screen thật nhưng Router được mock; không phải native E2E.
- `npm run lint`, `npm run typecheck`: pass sau format/thay đổi source cuối.
- `git diff --check`: pass; kiểm tra staged paths rỗng, dependency manifest/lock không đổi. `git check-ignore` xác nhận bài học 45, ảnh, `.expo/notification-review-web` và `.env.local` vẫn local-only.
- `npx expo-doctor`: **21/21 pass**; không đổi package.json/package-lock.
- `npx expo export --platform web --output-dir .expo/notification-review-web`: pass, **13 static route entries** (route framework/alias nhóm tính trong đó), không phải 13 màn nghiệp vụ. Chỉ thêm một màn preferences với hai URL entries. NO_COLOR/FORCE_COLOR là warning màu terminal, không phải bundle error.
- Browser localhost:8082: login → hồ sơ → tùy chọn; tắt nhắc đo nước rồi Save có thông báo thành công; bật lại nhưng Hủy → mở lại vẫn tắt (giữ canonical); khôi phục trạng thái mẫu và Save. Mandatory switch disabled và không có nút xin quyền OS giả. Sau logout, mở URL preferences trực tiếp cuối cùng về login, không còn switch. Đã login lại và để sẵn màn preferences cho review.
- Browser reload/direct navigation có lần CDP timeout; không coi timeout công cụ là app crash hoặc tự kết luận pass. Đọc trạng thái/screenshot sau đó xác nhận login đã render và URL là `/login`; log browser được lấy trong lần kiểm tra không có warn/error. Không kiểm thử lại toàn bộ lịch sử Back/native trong slice này.
- 360 CSS px: document clientWidth/scrollWidth đều 360; vùng cuộn chính width/scrollWidth đều 348; không tràn ngang. Đã reset viewport. Ảnh minh chứng nằm local-only: `docs/learning/evidence/notification-mock-saved-2026-10-22.jpg`.
- Plan, project context, README và bài học 45 được cập nhật theo kết quả. Learning/ảnh/build/env vẫn ignored. Không stage/commit/push/merge trong lượt này; nhánh vẫn `feature/OMTS-133-mobile-foundation`.

## Còn lại / chưa chốt

Catalog chính thức và mapping ACS-07/ACS-08 theo SRS mới; enum/channel API; điều kiện kênh theo liên hệ/cấu hình/phạm vi thực; endpoint preference/concurrency; push-token registration/EAS/device setup; Expo Go/development build/QA API và accessibility trên thiết bị. Không đánh dấu các phần này Done hoặc tự cập nhật Jira. Native push permission adapter cũ vẫn có test riêng, nhưng chưa được dùng trong route mock này.

Theo [Expo protected routes](https://docs.expo.dev/router/advanced/protected/), guard là điều hướng phía client; backend vẫn phải authorize request thật. Lát này không mở rộng quyền hay biến label role thành permission.
