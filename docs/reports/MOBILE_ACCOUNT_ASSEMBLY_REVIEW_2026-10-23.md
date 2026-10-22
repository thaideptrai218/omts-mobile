# Review MSG19, hồ sơ và tùy chọn thông báo — 23/10/2026

## Kết luận

Đã review chung ba lát mock vừa ghép: MSG19 qua teardown/login, hồ sơ `/account` và `/notification-preferences`. Chưa phát hiện finding P1/P2 mới trong các tình huống source/test đã kiểm tra. Bổ sung **7 regression liên phần**; full suite **50 suites / 292 tests pass**, lint/typecheck/export và Expo Doctor **21/21** pass.

Đủ bằng chứng local để bàn giao lên feature branch theo yêu cầu; **không phải nghiệm thu API thật, native/Expo Go hoặc sẵn sàng merge develop**. Lượt review này chỉ thêm test/tài liệu, không sửa runtime, validation, actor, quyền, luồng hay hợp đồng backend mới. Runtime của hai lượt triển khai trước nằm trong cùng thay đổi chưa commit và được review để bàn giao.

## R1 — phạm vi và nguồn

- Repo `thaideptrai218/omts-mobile`, nhánh `feature/OMTS-133-mobile-foundation`.
- Baseline HEAD và origin feature sau fetch: `59ea1cce27849d75139dd0b9f93b076ef41f02a6`.
- Origin develop sau fetch: `063acd5e193eedfa4e45236b720ddc3cb16a505a`; không checkout/pull/merge vào develop.
- Đọc AGENTS, PROJECT_CONTEXT, CONTRIBUTING, toàn bộ điểm điều phối session/gateway/controller liên quan, các test và hai báo cáo ghép. Căn cứ nghiệp vụ là những quyết định mock đã được người dùng duyệt và UC05/06/SCR-05/06 đã đối chiếu trong các lát đó, không lấy prototype hoặc trạng thái ticket để suy ra implementation.
- Không đọc lại Jira/Figma/backend hoặc thay đổi các hệ thống đó trong lượt này. Thông tin Jira ngày 22/10 trong báo cáo trước giữ nguyên mốc thời gian: catalog OMTS-124 To Do; ticket legacy OMTS-176/174 trả 404; mã UC06/ACS-07 còn cần đối chiếu tài liệu. Không gọi đó là lần kiểm tra Jira mới ngày 23/10.

## R2 — kết quả review theo phần

### MSG19 và cleanup

Reason `sessionExpired` chỉ sống trong session store, không mang token hoặc message thô qua URL/storage. Login tra catalog; nhập/gửi login mới xóa lý do cũ. Logout chủ động không mang MSG19. Cleanup lỗi giữ signOutReason, Retry qua bootstrap tiếp tục clear thay vì đọc lại storage để phục hồi account cũ. Expired cũng tăng generation, không chỉ logout.

Component regressions hiện có kiểm tra login nhận MSG19 sau expired, form/danh tính cũ bị gỡ và password rỗng. Test liên phần mới thử expired từ cả profile lẫn preferences, cleanup lần đầu lỗi rồi Retry thành công: credential cuối cùng null và signedOut vẫn mang đúng reason.

### Hồ sơ

Profile dùng cùng tài khoản với mock auth. Chỉ save displayName + opaque expectedRevision; username/type/grants/contact chỉ đọc. Canonical response cập nhật tên, không lấy bản nháp làm danh tính chính thức. Service ổn định qua render thông thường; request cũ bị chặn theo accountId và generation.

Conflict giữ draft và khóa lưu; tải lại lỗi/offline không bỏ draft hoặc mở khóa ghi đè. Chỉ tải lại thành công mới thay dữ liệu. Lần tải ban đầu dùng skeleton; loading/error có logout. Save lỗi/offline không báo thành công hoặc queue tự động. Các hành động đổi liên hệ chưa có wrapper không hiện nút giả.

### Tùy chọn thông báo

Route nằm trong app stack hiện có; hồ sơ chỉ hiện nút khi runtime cung cấp gateway. Mỗi account có repository riêng. Controller phân biệt canonical/draft, Save/Cancel, retry và expired; switch khóa vẫn có lý do. Mock repository kiểm tra MSG21/MSG23 cả khi caller gửi selection bất hợp lệ, không chỉ dựa vào UI disabled.

Unavailable push được nói đúng là chưa kết nối, không giả granted/denied và không xin quyền OS. Catalog chỉ có ví dụ tổng hợp trong ứng dụng/email, không tự giải quyết enum Sms/Zalo, recipient authorization hoặc danh mục BA. Offline giữ draft, không tự save sau reconnect. Loading/error có đường về hồ sơ.

## R3 — bảy regression mới

File: `src/features/session/__tests__/account-services-integration-test.ts`. Đây là test store/service với mock gateway thật, không gọi API/native và không phải Router E2E.

1. Save profile rồi preferences không ghi đè tên/revision hồ sơ; logout/login cùng tài khoản giữ được cả hai dữ liệu độc lập.
2. Credential hết hạn truy cập được refresh; hai service tiếp tục dùng scope hiện tại, chỉ gọi refresh một lần trong chuỗi request đã kiểm tra.
3. Expired từ preferences vô hiệu hóa cả service profile/preference cũ; login lại cùng accountId không làm scope cũ hợp lệ trở lại.
4. Profile save đã thành công ở mock server, response bị giữ đến sau logout/login và sau một lần lưu tên mới: response cũ không ghi đè tên mới hoặc expire service preferences mới.
5. Response expired của preferences trả về sau logout/login không clear profile của lần đăng nhập mới.
6. Expired từ profile, clear repository lỗi lần đầu: Retry clear thành công, không mất MSG19.
7. Tình huống cleanup retry tương tự nhưng bắt đầu từ preferences.

Không dùng sleep hoặc tăng timeout. Test điều khiển thời điểm Promise hoàn tất. Response thành công đã được tạo trước logout khác với request chỉ bắt đầu sau khi credential bị revoke; đây là cách kiểm tra đúng guard phía client. Client không thể rollback mutation đã được mock server chấp nhận.

## R4 — bằng chứng kiểm tra ngày 23/10

- Targeted suite mới: **1 suite / 7 tests pass**, 2.956 giây.
- `npm test`: **50 suites / 292 tests pass**, 54.129 giây. Baseline trước review: 49 suites / 285 tests.
- `npm run lint`: pass.
- `npm run typecheck`: pass; không tắt strict/cast route hoặc sửa generated declarations.
- `npx expo-doctor`: **21/21 pass**.
- `npx expo export --platform web --output-dir .expo/account-review-2026-10-23`: pass, **13 static route entries** gồm alias/framework; không phải 13 màn nghiệp vụ. Không có route service/test trong danh sách export.
- `git diff --check`: pass trước staging. Bước Git tiếp theo phải kiểm tra staged paths/diff và so remote SHA với HEAD sau push.
- Không phát sinh lỗi quality gate trong lượt review. Các lỗi TS readonly, accessible name, generated route chậm và browser CDP từ triển khai trước được giải thích trong bài học 44–45, không tính là lỗi mới ngày 23/10.

Browser save/cancel/password-cancel/logout/direct URL và layout 360 CSS px là bằng chứng của hai lượt ghép trước, ghi ở [MSG19/profile](MOBILE_MSG19_PROFILE_ASSEMBLY_2026-10-22.md) và [preferences](MOBILE_NOTIFICATION_ASSEMBLY_2026-10-22.md). **Không chạy lại browser hoặc thiết bị trong lượt review này**, vì không đổi UI/runtime; không trình bày ảnh cũ thành ảnh mới.

## R5 — giới hạn và phần chưa hoàn tất

- Chưa có QA API auth/profile/preferences; không xác nhận endpoint/DTO/concurrency/enum từ các mock interface.
- Chưa ghép thay email/SĐT. Mock email eligibility khởi tạo theo contact lúc tạo repository; trước khi mở rộng contact-change cần cập nhật eligibility từ nguồn chuẩn và backend revalidation.
- Chưa chốt catalog BA, mapping mã UC/ACS và channel API; chưa đăng ký push token/EAS/delivery. Preference không thay authorization hoặc bảo đảm nhận tin.
- Chưa có Android/iOS Back/gesture, bàn phím, font lớn, TalkBack/VoiceOver, SecureStore/OS permission và QA API evidence trên thiết bị. Nút quay lại trong UI đang khóa khi save; điều đó không chứng minh đã chặn native Back.
- Không có business mutation queue, tự save lại khi nối mạng hoặc deferred offline revoke contract. Không bổ sung chúng trong review.
- Npm audit/dependency security không được xử lý hoặc kết luận lại trong lượt này; không gọi Doctor/test xanh là hết rủi ro dependency.
- CI hiện chỉ trigger push main/develop hoặc PR vào hai nhánh đó. Push feature riêng không được gọi là GitHub CI xanh; chưa tạo PR hoặc yêu cầu review từ người khác.

## Bàn giao Git

Commit gồm các lát MSG19/profile/preferences chưa commit cùng regression và báo cáo review này. Learning/ảnh/env/output build vẫn local-only theo gitignore; dependency manifest/lock không đổi. Không đưa file học vào staged, không force-add hay force-push.

Chỉ push `HEAD:refs/heads/feature/OMTS-133-mobile-foundation`; sau lệnh thành công phải kiểm tra remote feature SHA khớp HEAD và remote develop vẫn giữ SHA trên. Kết quả commit/push cụ thể được trả trong bàn giao sau khi thực hiện, không ghi dự đoán thành kết quả. Không tạo/merge PR, không cập nhật Jira/SRS/backend.
