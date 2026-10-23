# Thêm/đổi email và số điện thoại bằng mock — 23/10/2026

## Kết luận và phạm vi

Đã ghép từ `/account` → thêm/thay đổi email hoặc SĐT → OTP riêng → lưu liên hệ đã xác minh → về hồ sơ. Liên hệ cũ vẫn có hiệu lực trước mã đúng; hủy/sai/hết hạn/offline không thay hồ sơ. Không tạo/liên kết Customer, không sửa đơn hàng, grants, username hoặc password. Không thay chính sách session/token thật.

Base `bff9709`, nhánh `feature/OMTS-133-mobile-foundation`; working tree sạch trước triển khai. Lượt ghép ban đầu chưa commit; lượt review tiếp theo người dùng yêu cầu cập nhật báo cáo, kiểm tra backend và commit/push đúng nhánh hiện tại, chưa merge develop. Không sửa Jira/SRS/backend/Figma. Đây là lát mock M10.3, không phải nghiệm thu đầy đủ UC05 hay OMTS-172/133.

**Review mới nhất:** có **P2 CONTACT-REV-01 OPEN** về đọc hồ sơ thất bại sau khi contact đã được ghi. **59 suites / 410 tests PASS**, nhưng một acceptance probe local FAIL và characterization trong source tái hiện lỗi; không được dùng test xanh để đóng finding. Chưa sửa runtime trong lượt review. Xem R; cập nhật backend riêng tại `BACKEND_READINESS_RECHECK_2026-10-23.md`.

## C1 — đọc yêu cầu và hợp đồng

Đọc PROJECT_CONTEXT/plan, UC05 branches 3a/3b/3d/3e/3f/4b/5a, UC08 và các contract/controller đang có. OMTS-172, dependency OMTS-151 và ticket hồ sơ liên quan OMTS-141 đọc trực tiếp cùng trả 404 `Issue not found`; không xác minh được parent/linked issues hiện tại và không đoán trạng thái. Phạm vi thực hiện dựa trên phê duyệt mock của người dùng và SRS, không dựa vào ticket To Do/Done như bằng chứng code.

Kiểm tra tài liệu [Expo SDK 57](https://docs.expo.dev/versions/v57.0.0/), [index](https://docs.expo.dev/llms.txt), [protected routes](https://docs.expo.dev/router/advanced/protected/) và [React Native 0.86 TextInput](https://reactnative.dev/docs/0.86/textinput). Không thêm dependency/native API. Đọc hướng dẫn RNTL v14 cài trong repo trước khi viết component tests.

`ContactChangeGateway` có start/resend/verify/cancel. Start mang channel, identifier và expectedRevision; verify đúng mới trả canonical profile đã lưu. Đây là contract ứng dụng, không phải endpoint/DTO backend. Khác đăng ký: UC05 lưu liên hệ khi verify thành công, không thêm bước xác nhận tạo tài khoản hoặc tự tạo session.

## C2 — mock cùng nguồn tài khoản và kiểm tra trước khi ghi

`mock-contact-change-gateway.ts` gắn attempt với accountId, channel, target, revision và purpose `profileContactChange`. Start kiểm tra required/khác hiện tại/không thuộc account khác/revision. Verify kiểm tra lại trước khi ghi; account khác, purpose/ID khác, canceled, code sai/hết hạn/hết lượt không thay contact. Kiểm tra và replace synchronous trong mock; không suy ra API thật có transaction/idempotency.

OTP mẫu lần gửi 1/2/3 là 246810/246811/246812 trong cửa sổ mock; mỗi mã có 5 phút riêng, cooldown 60 giây, 5 lần sai/3 lần gửi. Resend hủy mã trước, không refill sai trong cùng window. OTP hết hạn có thể resend nếu còn lượt; cửa sổ rate-limit 5 phút là cấu hình mock, không chốt cơ chế server. Hủy/rời flow xóa attempt; budget vẫn giữ trong process memory. Không lưu token/OTP/raw contact vào persistent storage, URL hay log. Raw target tạm và fixture identifier ở server mock memory để resend/lookup, không phải DB hay SMS/email thật. Full reload reset dữ liệu.

`mock-session-gateway.ts` thay identifier đúng channel trong map dùng chung và tăng profile revision; email/SĐT mới verified được dùng cho login/recovery. Staff cũng đăng nhập bằng liên hệ đã verified theo BR-31, không chỉ Trader; username login vẫn giữ, liên hệ Staff chưa verified không được dùng. Liên hệ cũ rời map login/recovery sau replacement. Không suy user type từ role hoặc cấp grants khi thêm contact.

Recovery kiểm tra lại binding hiện tại qua callback `MockRecoveryOwner.isCurrent` trước verify/complete. OTP/proof đã phát cho địa chỉ cũ không thể reset password sau khi địa chỉ đó bị thay. Không thu hồi mọi session vì đổi liên hệ; không tự quyết lại chính sách logout/change-password. Recovery bằng contact mới vẫn dùng cùng nguồn account và các quy tắc revoke đã có.

## C3 — service theo phiên và ghép UI không mất bản nháp tên

`ContactChangeService` chạy qua AccountSessionScope, refresh hiện có và khóa mutation của store. Scope chặn account/session cũ gọi bằng credential của login mới. Service có activate/dispose/generation; start/resend muộn đều hủy challenge được trả về, kể cả khi scope đã từ chối response vì logout. Response verify muộn không cập nhật session/UI mới. Nếu mock đã ghi trước khi response về muộn, bỏ response không được gọi là rollback.

Chỉ canonical contacts trả về mới cập nhật snapshot qua `scope.acceptContacts`; method này giữ accountId, grants, username và gate, đồng thời kiểm tra owner generation trước publish. Không đưa raw identifier vào session presentation. Offline không queue/auto-retry; code input xóa trước await, attempt còn hạn có thể retry bằng thao tác người dùng.

`ProfileController` giữ hook hồ sơ sống, thay nội dung con thành ContactChangeController trong cùng protected `/account`. Không tạo route chứa target/OTP và không thêm một bước nghiệp vụ. Khi thành công, `acceptContactUpdate` nhận canonical profile/revision, giữ nguyên draft tên. Nếu tên canonical đã đổi ở thiết bị khác, giữ draft nhưng bật MSG06/conflict lock; chỉ “Tải lại và bỏ thay đổi” mới thay draft. Test đã đi hết nhánh này. Đây là lựa chọn bố cục có thể thay, không phải quyết định mới về quyền/flow SRS.

Profile chỉ hiện action khi runtime có gateway; nhãn “Thêm” khi chưa có contact, “Thay đổi” khi đã có. Form mới keyboard-safe, dùng primitive/theme hiện tại, có pending/disabled/back. Initial profile lấy từ hồ sơ đã tải nên không tạo loading giả; reload conflict có pending tại nút. Không đặt chú thích kỹ thuật/showcase lên UI.

Messages: required/unchanged/duplicate dùng field/MSG01, conflict MSG06, offline MSG07, sai/hết hạn mã MSG16, service MSG04, session hết hạn MSG19. Thêm MSG62 với masked email và lời nhắc email cũ vẫn dùng đến lúc verify thành công; title/description ở OTP không cam kết delivery thật. Màn thành công hiển thị contact đã che và nút Về hồ sơ.

## C4 — test, lỗi thực tế và cách xử lý

Thêm **3 suites / 32 tests**: gateway 13, service 8, component flow 11. Tăng từ 56/373 lên **59/405**.

- Gateway: add/replace hai kênh, identity/grants giữ nguyên, login trước/sau, empty/unchanged/occupied, foreign ready account/purpose/cancel, resend/cooldown/TTL/limits, revision trước/sau OTP, registration khác chiếm target trong khi chờ, old recovery code/proof, replace SĐT lần nữa và delivery failure không ghi.
- Service: snapshot contacts, preflight offline/no queue/manual retry, reset, stale account scope, start/resend/verify response muộn sau logout và expired teardown. Test dùng real shared store/access/service, không chỉ stub trả success.
- Component: thao tác từ hồ sơ cho Email/SĐT, giữ và lưu tiếp draft tên bằng revision mới, required/duplicate, wrong/cancel/reopen, offline start/verify, expiry/resend, conflict/reload/name conflict, delivery-error retry, Trader thêm phone, pending duplicate/late response/logout và MSG19. Harness kiểm tra composition trong `/account`, không phải native navigation E2E.

### Lỗi và bằng chứng khắc phục

1. `npm run typecheck` trả TS2339 ở `result.challenge`: union có một member `status: 'conflict' | 'contact-invalid'`, TypeScript chưa loại được member đó qua các nhánh. Tách thành từng discriminated member riêng, không any/cast hoặc bỏ assertion. Typecheck sau sửa qua. Không có bằng chứng runtime đang nhận nhầm payload; lỗi này ở mô hình type.
2. Một apply_patch bị từ chối `Failed to find expected lines` vì dùng một phần dòng JSX dài làm context thay vì dòng thật đầy đủ. Kiểm tra bằng rg xác nhận batch chưa áp dụng; tách patch đúng context rồi format bằng Prettier. Không overwrite file bằng shell.
3. Lint lần đầu có 4 warning `import/first` ở ProfileController: block import mới bị đặt cuối file. Moved nguyên block lên đầu; chạy lint lại sạch. Exit 0 của lượt có warning không được gọi là đã hết warning.
4. Self-review lifetime phát hiện rủi ro orphan challenge nếu gateway start/resend đã trả response nhưng AccountSessionScope từ chối vì logout trước khi service nhận kết quả. Service giữ ID trong callback request và cancel ở error path; test deferred của cả start/resend chứng minh cleanup. Verify đã ghi muộn được phân biệt với rollback.
5. Export warning NO_COLOR/FORCE_COLOR là xung đột cấu hình màu terminal, không phải lỗi auth/build; output vẫn exit 0. Không đổi env của người dùng hoặc gọi warning này là đã sửa.

## C5 — kiểm tra cuối, tự đánh giá và phần còn mở

| Kiểm tra | Kết quả |
| --- | --- |
| `npm test` | **59 suites / 405 tests PASS** |
| `npm run lint`, `npm run typecheck` | PASS, không còn import/first |
| `npx expo-doctor` | **21/21 PASS**, không đổi dependency |
| `npx expo export --platform web --output-dir .expo/contact-change-final-2026-10-23` | PASS, vẫn 17 static routes; luồng contact nằm trong /account |
| `git diff --check` | PASS |

Tự review source → shared identity/recovery → service → UI và regressions; không có P1/P2 còn tái hiện trong phạm vi mock/ca đã kiểm tra. Không coi test xanh là production sign-off. Không chạy browser/device/QA API ở lượt này; không tạo account/contact bằng browser automation hoặc đọc trạng thái tab như bằng chứng UI đã test. Android/iOS Back, autofill, keyboard, lifecycle, font lớn, screen reader và 360 CSS px render của màn mới chưa nghiệm thu thực tế.

Canonical format/canonicalization email/SĐT vẫn chưa được backend/BA chốt: lát này required + exact-match uniqueness/different-value, trim khoảng trắng quanh identifier, không tự thêm regex/case-fold/phone normalization. Vì vậy chưa đáp ứng toàn bộ format validation UC05. HTTP endpoints, atomicity, audit/delivery, idempotency/unknown mutation outcome, real account lock/lifecycle/session policy và integration/native QA còn mở. Customer linkage/history/update contact phía Customer chủ động ngoài phạm vi; không claim đầy đủ UC05 postcondition.

### Cách xem bằng mock

Full reload một lần nếu dev runtime cũ chưa nhận gateway mới; không thêm reset session production để chữa HMR. Login `tran.thu.ha` / `OmtsDemo2026` → hồ sơ → Thay đổi email hoặc Thêm số điện thoại. Dùng `new.ha@example.invalid` / `0000000999` và mã mock; tuyệt đối không dùng contact/credential thật. Reload toàn app sẽ reset fixture, không phải persistence đã triển khai. Đổi contact không yêu cầu đổi tên; draft tên chưa lưu được giữ qua flow và có thể lưu sau.

README/context/plan cập nhật ở lượt ghép ban đầu; bài học 53 giữ local/ignored. Trạng thái review/bàn giao mới nhất nằm ở mục R.

## R — review độc lập, backend recheck và feature-only delivery

### R1. Phạm vi đã đọc

Đối chiếu UC05/UC08, gateway → service → hook → profile child editor → session scope/identity/recovery và những test hiện có. OMTS-172 đọc lại vẫn trả 404 `Issue not found`; parent không được suy đoán. Không đổi business/format/session policy, không sửa code runtime trong lượt review. Thêm test, tài liệu và kiểm tra Git; không nối API vì backend có endpoint mới.

### R2. P2 CONTACT-REV-01 — mutation thành công nhưng lỗi đọc sau đó bị trình bày như chưa ghi

**OPEN, tái hiện được bằng failure injection trong mock contract.** `mock-contact-change-gateway.ts` gọi replace (cập nhật identifier/contacts/revision), xóa attempt, rồi await profileGateway.load. Nếu load ném lỗi, service không nhận saved/canonical profile; hook catch hiện MSG04 khẳng định “dữ liệu OMTS không thay đổi”, UI vẫn ở OTP. Mã đã dùng và attempt đã xóa nên verify lại nhận MSG16. Canonical account thực tế đã đổi, old alias không login được, new alias login được. Parent/session UI chưa nhận kết quả canonical.

**Tái hiện:** vào hồ sơ → thay email tổng hợp → start OTP → cấu hình profileGateway.load ném lỗi một lần ở lần đọc sau verify → nhập đúng mã. Test source `characterizes CONTACT-REV-01: post-save read failure reports unchanged data although contact changed` xác nhận banner MSG04, vẫn có ô OTP, không success, old/new login phản ánh dữ liệu đã đổi; verify lại MSG16. Đây là characterization của lỗi, không phải chấp nhận UX đó. Không claim lỗi này xuất hiện trong một lần bấm default mock không có failure injection.

**Acceptance probe local:** `docs/learning/probes/contact-postcommit-read.probe.ts`, chạy riêng bằng `npm test -- --runTestsByPath docs/learning/probes/contact-postcommit-read.probe.ts --testRegex 'contact-postcommit-read\.probe\.ts$'`. Probe kiểm tra account đã đổi/đăng nhập được trước, sau đó đòi outcome saved theo phương án mock canonical-snapshot; hiện **FAIL** vì outcome nhận null sau rejection. Probe không có tên test/spec nên không nằm trong normal discovery, không bị test.skip và không sửa Jest config để che lỗi; giữ ignored/local, không push.

**Tác động/P2:** UI nói ngược trạng thái đã lưu và hướng dẫn retry một mã không thể dùng nữa. Không chứng minh vượt quyền hay mất account: username vẫn giữ. Nhưng không thể nghiệm thu luồng failure/retry hiện tại như đã đúng.

**Đề xuất mock:** tách hàm tạo ProfileSnapshot thuần từ MockProfileOwner và dùng cùng snapshot builder cho profile adapter/contact mutation; sau replace trả canonical snapshot trực tiếp, không phụ thuộc một load bất đồng bộ có thể fail để quyết định mutation success. Không rollback contact bằng client, không tự retry OTP. **Nghiệm thu:** đúng mã → snapshot/session/UI phản ánh contact mới; lỗi trước write vẫn giữ contact cũ; account/grants/draft tên giữ đúng; stale/logout và conflict regressions vẫn qua. Thêm red/green test vào source khi user duyệt fix, không chỉ đổi assertion characterization cho xanh.

**API thật:** confirm hiện cũng thiếu full profile/revision, cần backend trả canonical response hoặc client tách trạng thái “đã lưu, chưa tải lại”; không áp dụng message unchanged cho mọi lỗi network/post-commit. Xem mục 3C báo cáo backend. Đây là đề xuất, chưa tự sửa API hoặc runtime Mobile.

### R3. Năm test bổ sung

- Hai service regressions: resend rejection trước gửi giữ attempt cũ để verify thủ công; scope.acceptContacts của login cũ không sửa snapshot của login mới cùng accountId.
- Hai flow regressions: gateway ném offline dù preflight online vẫn xóa code/không auto-retry và cho thử thủ công; conflict reload fail giữ target và khóa blind submit, vẫn có nút reload.
- Một characterization CONTACT-REV-01 như R2. Tăng 405 → **410** trong cùng 59 suites; không có runtime fix trong lượt này. Green characterization không phải finding closed.

### R4. Bằng chứng chạy mới

| Kiểm tra | Kết quả |
| --- | --- |
| `npm test` | **59 suites / 410 tests PASS**, 57,074 giây |
| Explicit acceptance probe CONTACT-REV-01 | **1 FAIL**, không nằm trong normal discovery |
| `npm run lint`, `npm run typecheck` | PASS |
| `npx expo-doctor` | **21/21 PASS** |
| `npx expo export --platform web --output-dir .expo/contact-change-review-2026-10-23` | PASS, 17 routes |
| `git diff --check`, staged diff check | PASS trước commit |

Không rerun browser/device/QA API; component harness không thay bằng chứng native navigation/autofill/accessibility. Không tuyên bố full UC05 hoặc merge-ready production. Canonical format và Customer/API/native giới hạn ở C5 vẫn mở; backend source mới cung cấp ứng viên contract, không tự phê duyệt policy client.

### R5. Backend update và bàn giao

Đã fetch/read backend mới tại ACS `27a8673` và inventory các nhánh 208/200/199/209/210/211/212/SDS; develop vẫn `c5360ca`. Các API trước đây thiếu đã có ở feature, HTTP string enums và devices/Zalo đã có. PR stack chưa merged; gate phone-only, concurrency/Customer/recovery binding và QA deployment còn cần đồng bộ. PR #7 có GitGuardian failure chưa kết luận nguyên nhân; không báo toàn stack CI xanh. Báo cáo `BACKEND_READINESS_RECHECK_2026-10-23.md` ghi SHA, endpoint mapping, static gaps, nguồn và điều kiện tiếp tục cụ thể.

Commit/push source ghép đã review, tests và tài liệu nhóm lên duy nhất `feature/OMTS-133-mobile-foundation`; không force/merge/PR hoặc thay backend. Probe/bài học 53/54/env/export giữ local. Mobile remote trước delivery: feature `bff97096db37bcb1dfa3d656534b1445486d504c`, develop `063acd5e193eedfa4e45236b720ddc3cb16a505a`. HEAD/remote và develop được kiểm tra lại sau push trong bàn giao cuối. Delivery không đóng P2 và không đồng nghĩa nghiệm thu/merge.
