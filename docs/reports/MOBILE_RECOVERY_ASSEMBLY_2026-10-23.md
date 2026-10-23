# Ghép Quên mật khẩu bằng mock — 23/10/2026

> **Kết luận mới nhất, sau lượt sửa được duyệt:** REC-REV-01/02 đã đóng trong phạm vi mock/client, thêm 12 regression source; 53 suites/334 tests PASS và hai probe cũ cũng PASS. Xem mục S. Mục R giữ nguyên lịch sử phát hiện lỗi, không phải trạng thái hiện tại. Chưa merge develop hay nghiệm thu API/native.

## Phạm vi được duyệt

Lượt ghép ban đầu: request → OTP → mật khẩu mới → login theo từng lát; tự review và báo cáo/bài học local. Baseline commit 365ca1d, 50 suites/292 tests; lúc đó chưa được yêu cầu commit/push. Lượt tiếp theo, người dùng yêu cầu review lại, cập nhật báo cáo rồi commit/push **nhánh hiện tại**, chưa merge develop. Cả hai lượt đều không tích hợp API hay sửa backend/SRS/Jira.

Lượt sửa sau review: người dùng đã yêu cầu rõ sửa cả hai P2, thêm test, tự review, cập nhật báo cáo và commit/push nhánh hiện tại, không merge develop. Base của lượt sửa là `005d9e9`.

## F1 — nguồn và thiết kế

Đã đọc UC03/UC08/BR-31/NFR-01 trong Report3Finnal.md và màn/controller có sẵn. Jira search trả 502; đọc trực tiếp OMTS-164, parent legacy OMTS-139 và dependency OMTS-151 đều 404 Issue not found. Không suy trạng thái hiện tại hoặc đổi Jira. Tiếp tục đúng phạm vi mock người dùng vừa duyệt; không áp flow mới cho actor chưa có fixture.

Gateway khôi phục độc lập session login; challenge/proof sống trong bộ nhớ, không URL/storage. Envelope public giống nhau cho eligible/unverified/unknown; chỉ liên hệ verified thuộc fixture Staff mới nhận proof hợp lệ. Fixture dùng ha@example.invalid, an@example.invalid và số tổng hợp 0000000123 (không phải số thật/không chốt validation điện thoại API). Không gửi SMS/email. OTP và proof reset không thay phiên đăng nhập.

## F2 — mock gateway/service

Đã hoàn thành trong phạm vi mock. `RecoveryGateway` tách khỏi session gateway: start/resend/verify/complete/cancel; `RecoveryFlowService` giữ proof trong closure, chỉ trả trạng thái verified cho UI. Challenge có purpose accountRecovery, không nhận mã onboarding hay session handle làm proof. Không truyền proof qua route, props, SecureStore hoặc storage.

Dùng chung tài khoản auth, không tạo một bản sao mật khẩu riêng cho recovery. Complete đổi mật khẩu rồi xóa tất cả lease của đúng account, reset mã onboarding; không đổi role/grants/profile/preferences, không tự tạo session. Phiên app cũ bị từ chối và dọn về login/MSG19 khi có protected request tiếp theo; không có server-push logout. Tài khoản khác không bị revoke.

Giới hạn hiện tại sau mục S: mỗi mã có 5 phút từ lần gửi riêng, độc lập cửa sổ ngân sách mock 5 phút; 5 lần nhập sai/3 lần gửi, resend không nạp lại số lần sai. Cooldown 60 giây theo SRS; proof TTL 5 phút và rate-window là cấu hình mock, không chốt contract API. Mã lần gửi 1/2/3 lần lượt 246810/246811/246812 trong cùng cửa sổ; resend làm mã trước mất hiệu lực. Đổi liên hệ/thoát hủy challenge và proof nhưng không reset ngân sách chống spam. Reload toàn bộ app reset tất cả vì không có server/storage thật.

## F3 — controller và route

- Login có hành động Quên mật khẩu khi runtime cung cấp recovery service; xóa password draft trước khi mở route. Không render một nút không hoạt động trong mode chưa cấu hình API.
- `/recovery` nằm trong auth stack đã có; người đang đăng nhập vẫn chịu guard cũ. Mỗi lần mount tạo một flow service độc lập. Route không mang thông tin nhạy cảm.
- Request dùng validation required-only hiện có, MSG15 rồi nhập mã. SCR-02 dùng lại field, timer, resend và phản hồi MSG16; recipient copy trung tính, không khẳng định đã gửi thật. Không tiết lộ tên tài khoản hoặc liên hệ còn lại.
- OTP đúng mới mount form mật khẩu mới. Local validation sai không tiêu thụ proof; hoàn tất tháo form, hiện thành công và nút Về đăng nhập. Mật khẩu cũ không login được, mật khẩu mới dùng với cùng username.
- Offline hiển thị MSG07, không gọi gateway/queue/auto-retry. Nếu submit mật khẩu khi offline, hai field được xóa; proof chưa hết hạn vẫn cho nhập lại và bấm thử lại thủ công. Rời màn/hủy proof và generation guard ngăn response muộn mở lại form hoặc phục hồi flow.

## F4 — tự review và lỗi thực tế

Trong lượt ghép ban đầu đã đọc lại contract→gateway→service→hook→route, kiểm tra tác động tới session/profile/preferences và chạy regression toàn repo. Khi đó chưa phát hiện P1/P2; **kết luận này được thay thế bởi hai finding của lượt review R bên dưới**. Không phải chứng nhận bảo mật production.

1. **TypeScript TS2339:** union từng gộp phase password/completed vào cùng một variant nên nhánh JSX cuối chưa được narrow thành request. Tách hai variant độc lập, không ép kiểu hay dùng any; typecheck qua lại. Bài học 47 lưu lệnh, lỗi, nguyên nhân và cách đọc.
2. **Test resend không mở nút sau 60 giây:** clock mặc định giữ `Date.now` tại import, trong khi gateway dùng clock fake sau setup. Đổi thành `now: () => Date.now()` và thêm regression default-clock. Test luồng vẫn thất bại; kiểm tra AppState cho thấy preset trả mock function, không phải chuỗi active. Khai báo foreground rõ tại boundary test và restore sau test; không sửa runtime coi mọi giá trị là active. Sau cả hai sửa, test cooldown/resend/code cũ và mới đều qua.
3. **Microcopy gây hiểu nhầm:** caption SCR-02 mặc định là “Mã đã được gửi tới…”, không phù hợp với phản hồi generic của recovery. Thêm recipientLabel tùy chọn, chỉ recovery truyền “Thông tin nhận mã”; default onboarding không thay đổi. Test unknown/unverified kiểm tra không còn lời khẳng định gửi mã.

Riêng thao tác trình duyệt có lỗi clipboard target mismatch và locator không còn vị trí sau resize. Đọc lại UI rồi dùng trường/nút đã xác định từ trạng thái mới thì tiếp tục được; không sửa app để chữa lỗi automation. Không coi đây là bằng chứng app crash hoặc đã reset thành công.

### Test bổ sung

Ba suite mới gồm 12 gateway/integration, 5 service và 9 component tests; thêm 1 test clock vào suite verification sẵn có. Tăng tổng cộng 27 test so với baseline 292.

- Cùng envelope cho eligible/ineligible/provider failure; contact chưa verified và username không được cấp proof. SMS đã verified đủ điều kiện ngay cả khi email chưa verified.
- OTP sai/hết hạn, proof hết hạn/một lần dùng/sai mục đích, resend code rotation/cooldown/giới hạn, đổi liên hệ và hủy proof.
- Password sai validation không tiêu thụ proof; reset đổi đúng password nguồn auth và bảo toàn session/profile/grants, revoke mọi lease đúng account; store cũ về MSG19 và xóa credential, account khác còn hoạt động.
- Toàn flow qua component thật tới login mật khẩu mới; mismatch sửa lại được, offline/manual retry, duplicate request, unmount/response muộn, mở lại không phục hồi proof.
- Response reset đã thành công ở gateway nhưng về sau dispose không được khôi phục UI. Đây không phải rollback: password phía mock server có thể đã thay đổi trước khi client rời màn.

## F5 — bằng chứng kiểm tra

| Kiểm tra | Kết quả |
| --- | --- |
| `npm test` | 53 suites / 319 tests PASS |
| `npm run lint` | PASS |
| `npm run typecheck` | PASS |
| `npx expo-doctor` | 21/21 PASS |
| `npx expo export --platform web --output-dir .expo/recovery-review-2026-10-23` | PASS, gồm route /recovery |
| Browser localhost:8082 | Login → request MSG15 → OTP mock → form mật khẩu mới; back/reopen trở về request trống |
| 360 CSS px | document clientWidth/scrollWidth/bodyWidth đều 360; vùng cuộn form clientWidth/scrollWidth đều 348 |

Screenshot form trống giữ local tại `docs/learning/evidence/recovery-mock-2026-10-23.jpg`, không track Git. Đã reset viewport sau kiểm tra. Không nhập hay submit mật khẩu mới bằng browser automation; thao tác reset và login password mới có bằng chứng component/gateway test, không phải browser/device E2E.

## Tự đánh giá và phần chưa xong

Lượt ghép ban đầu đã chứng minh được mở màn, không nâng proof thành session, không persist proof/password và cleanup khi thoát. Review R tìm thêm hai lỗ hổng ở expiry/retry nên chưa được coi M7 hoàn tất hoặc sẵn sàng merge. Bài học 47/48 và probe tái hiện chỉ lưu local theo yêu cầu; source, regression test và báo cáo nằm trong phạm vi commit/push mới được yêu cầu.

Không đánh dấu OMTS-164 hay foundation Done vì còn thiếu:

- HTTP request/challenge/proof/reset contract, QA URL và mapping lỗi/MSG chính thức. Interface client hiện tại không phải DTO backend đã chốt.
- Gửi email/SMS, chống enumeration về timing/transport ở server, throttling phân tán, audit delivery/reset và eligibility account bị khóa. Mock không có fixture locked account; không tuyên bố đã triển khai production policy đó.
- Mock code/proof ID có tính dự đoán và chỉ an toàn trong mode test tường minh; không được dùng làm credential production. Exact synthetic identifier mapping không phải canonicalization email/phone.
- Kiểm tra trên Expo Go/Android/iOS, native Back, bàn phím/password manager, TalkBack/VoiceOver, app background và API/network timeout thực tế.
- Revoke phiên thật và việc thiết bị cũ phát hiện reset, trạng thái forced-change sau administrative reset cần đối chiếu hợp đồng backend; mock recovery không tự đổi onboarding flag.

Đề xuất tiếp: review/bàn giao lát recovery nếu người dùng yêu cầu; tiếp tục các wrapper mock được duyệt hoặc đối chiếu API mới khi backend sẵn sàng. Không tự mở đăng ký Trader, đổi liên hệ hồ sơ hoặc mô hình role/permission ngoài phạm vi này.

## R — Review lại trước commit/push

### R1. Nguồn và phạm vi

Review source đang chưa commit trên `feature/OMTS-133-mobile-foundation`, base 365ca1d. Đọc lại UC03, Table 3.4-3 và toàn bộ đường contract/gateway/service/controller/route, cùng diff ảnh hưởng login, provider, session và verification. Jira OMTS-164 được đọc lại nhưng vẫn trả `404 Issue not found`; không suy trạng thái hay sửa Jira. Không đổi UI, session policy hoặc runtime trong lượt review này. Figma không đọc lại vì không thiết kế/đổi bố cục; ảnh browser ở F5 là bằng chứng lượt ghép trước, không phải lần kiểm tra mới.

### R2. Finding còn mở — không che bởi test xanh

**REC-REV-01 — P2: OTP gửi lại không có đủ 5 phút từ lần gửi mới.**

- Vị trí: `src/features/recovery/adapters/mock-recovery-gateway.ts:68`, `expiresAtEpochMs: budget.until`.
- Tái hiện: đồng hồ t=0 gửi mã đầu, t=60.000 ms gửi lại. Mã mới hết hạn ở t=300.000 thay vì t=360.000; assertion lifetime mong đợi 300.000 ms nhận 240.000 ms. Nếu gửi lại sát cuối cửa sổ, thời gian thực nhập mã càng ngắn.
- Căn cứ: SRS Table 3.4-3 ghi “Valid for 5 minutes from sending”; khoảng gửi 60 giây cũng đã có trong bảng, không phải yêu cầu mới cần tự chốt. Code đã gộp cửa sổ chống spam và tuổi thọ mã thành một mốc.
- Ảnh hưởng: người dùng nhập mã mới trong thời gian lẽ ra còn hợp lệ vẫn nhận MSG16. Không phải bypass quyền, nhưng sai hành vi SRS và gây thất bại recovery.
- Đề xuất sửa: tách `expiresAtEpochMs = sendTime + codeTtl` khỏi ngân sách chống spam; giữ ràng buộc 5 lần sai/3 lần gửi và vô hiệu mã cũ. Kiểm tra cả ranh giới cửa sổ ngân sách để không vô tình nạp lại attempts cho một mã đang sống. Chỉ thay expiry mà bỏ kiểm tra ngân sách là chưa đủ.
- Nghiệm thu sửa: resend sau 60 giây có đủ 300 giây; verify trước/sau hạn mới đúng; mã cũ vô hiệu; send/failure limits không bị refill qua ranh giới.

**REC-REV-02 — P2, adapter contract: outcome offline làm mất proof cho lần retry.**

- Vị trí: `src/features/recovery/services/recovery-flow-service.ts:34–37`, luôn gọi reset sau mọi outcome.
- Tái hiện: verify đúng → gateway.complete trả `{status: 'offline'}` một lần mà chưa đổi password → service trả offline, nhưng lần complete thủ công tiếp theo trả attempt-invalid. Mong đợi completed với proof còn hạn.
- Nguyên nhân: `RecoveryGateway.complete` dùng union có offline, nhưng service xử lý mọi kết quả như terminal. Nhánh `isOffline()` trước khi gọi gateway thì trả sớm nên vẫn giữ proof; regression cũ chỉ bao phủ nhánh đó.
- Mức ảnh hưởng: lỗi đã tái hiện bằng adapter đúng contract. Mock mặc định không tự phát outcome này nên **không khẳng định đã gặp trên trình duyệt/QA API**. Đây là điểm không nhất quán ngay trong contract ứng dụng cần xử lý trước khi thay adapter.
- Đề xuất sửa: giữ proof nếu gateway trả offline rõ ràng; chỉ reset khi completed/attempt-invalid. Vẫn phải loại response muộn sau dispose và xóa field password tại controller, không lưu password/auto-retry. Nếu backend không hỗ trợ outcome offline này thì phải thu hẹp contract và mapping một cách nhất quán, không để union hứa hành vi service không giữ được.
- Nghiệm thu sửa: offline outcome → MSG07/field trống, reconnect không tự gọi complete, manual retry dùng proof còn hạn; hết hạn/dispose vẫn không được reset thành công. Không coi network timeout không rõ kết quả là một offline outcome chắc chắn chưa thực thi.

Trong lượt R, hai lỗi chưa được sửa vì yêu cầu lúc đó là **review + báo cáo + commit/push**, không yêu cầu thay đổi runtime. Lượt S sau đó được người dùng duyệt sửa, xem kết quả bên dưới. Không sửa SRS/Jira để chữa bug.

### R3. Bằng chứng tái hiện và hồi quy

Probe local: `docs/learning/recovery-review-probes.ts` (ignored, tên không khớp glob regression). Lệnh explicit:

```powershell
npm test -- --runTestsByPath docs/learning/recovery-review-probes.ts --testMatch '**/recovery-review-probes.ts'
```

Kết quả: **2 FAIL**, đúng hai finding: `Expected 300000 / Received 240000`; `Expected completed / Received attempt-invalid`. Không đổi assertion để cho xanh, không test.skip, không chỉnh test config. Probe không được push cùng tài liệu học local; các bước/expected/actual ở trên đủ để nhóm tái tạo bằng gateway/service test sau này. Khi sửa phải đưa regression tương ứng vào source test suite.

Thêm ba regression **PASS** trong `recovery-flow-service-test.ts`: response verify muộn bị cancel, response resend muộn hủy cả challenge mới vừa phát, và infrastructure rejection không tự retry/không mất proof còn hợp lệ. Chỉ đổi test, không sửa runtime.

Chạy lại toàn repo:

| Kiểm tra lượt R | Kết quả |
| --- | --- |
| `npm test` | 53 suites / 322 tests PASS; không chứa 2 probe local phía trên |
| `npm run lint` | PASS |
| `npm run typecheck` | PASS |
| `npx expo-doctor` | 21/21 PASS |
| `npx expo export --platform web --output-dir .expo/recovery-rereview-2026-10-23` | PASS, có /recovery |

Không chạy lại browser hoặc thiết bị thật trong lượt R. 319→322 là ba regression mới, không phải hai finding đã được chữa. Tự đánh giá: không tìm thấy P1 trong phạm vi đã đọc/chạy; có hai P2 còn mở, cần sửa trước khi coi recovery đủ điều kiện merge/acceptance. Các hạn chế API/native ở trên giữ nguyên.

### R4. Phạm vi bàn giao Git

Commit gồm source ghép recovery từ lượt trước, ba regression bổ sung và README/context/plan/báo cáo cập nhật. Không đưa `docs/learning/`, probe, screenshot, `.env.local`, `.expo/` hoặc dependencies vào commit. Remote trước push: feature 365ca1d; develop 063acd5e193eedfa4e45236b720ddc3cb16a505a. Chỉ push `HEAD:refs/heads/feature/OMTS-133-mobile-foundation`, không merge/rebase/force-push, không tạo PR hay thay Jira. SHA commit và xác nhận remote sau push được ghi trong phản hồi bàn giao, tránh tự tham chiếu SHA ngay trong nội dung commit đó.

## S — Sửa REC-REV-01/02 sau khi được duyệt

### S1. Nguồn và bước tái hiện trước sửa

Đọc lại source, UC03 và Table 3.4-3: mã có hiệu lực 5 phút từ lúc gửi, tối đa 5 lần sai/3 lần gửi cách nhau 60 giây. Jira OMTS-164 đọc lại vẫn trả `404 Issue not found`; không suy trạng thái ticket. Không cần đọc lại wireframe vì không sửa thiết kế/UI; không đụng backend, SRS, Jira hoặc chính sách auth.

Chuyển yêu cầu từng bị probe phát hiện thành test trong source (không chỉ giữ local). Chạy trước sửa:

```powershell
npm test -- --runTestsByPath src/features/recovery/__tests__/mock-recovery-gateway-test.ts src/features/recovery/__tests__/recovery-flow-service-test.ts
```

Kết quả **3 FAIL / 20 PASS**: hai case TTL nhận 240000 ms và 1 ms thay vì 300000 ms; case offline phát hiện gateway.cancel bị gọi một lần trong khi outcome chưa terminal. Đây là expected red để chứng minh regression bắt đúng bug, không phải lỗi setup hay dependency. Không nới timeout, đổi assertion hay test.skip để lấy xanh.

### S2. Sửa nhỏ và kiểm tra từng lỗi

**REC-REV-01 — đã sửa:** `mock-recovery-gateway.ts` có `codeTtlMs` và `rateWindowMs` riêng, dù hiện cùng giá trị 5 phút. Chụp `issuedAt` một lần cho mỗi phát hành; `expiresAtEpochMs = issuedAt + codeTtlMs`, budget.until chỉ phục vụ cửa sổ rate-limit. Không thay policy reset ngân sách, cooldown, code rotation hay cancellation. Mã đang sống không tự được nạp lại attempts/sends khi đồng hồ đi qua mốc cửa sổ đầu; phát hành một attempt mới theo cửa sổ mới vẫn theo hành vi mock có sẵn.

**REC-REV-02 — đã sửa:** service vẫn kiểm tra active/generation sau await trước khi nhận outcome. Chỉ gọi reset khi outcome không phải offline; offline giữ proof hiện tại cho retry thủ công. Không làm mới proof TTL, không lưu/queue password. Completed/attempt-invalid vẫn hủy proof; disposed flow không được hồi sinh kể cả activate lại.

Hai suite sau sửa ban đầu: **23/23 PASS**. Thêm kiểm tra biên đạt **30/30 PASS** trong gateway/service. Component suite **11/11 PASS** qua các form/controller thật. Hai probe local cũ chạy lại **2/2 PASS**; regression cần thiết nay nằm trong source và sẽ có ở checkout của nhóm, không phụ thuộc folder học bị ignored.

### S3. Tổng cộng 12 test source mới

- **6 gateway:** resend ở 60.000 và 299.999 ms vẫn đủ 300 giây; verify đúng ở 299.999 ms và sai tại đúng 300.000 ms tính từ resend; sai trước/sau mốc cửa sổ đầu không nạp lại attempts; lần gửi thứ ba vẫn không có thêm sends và code đó còn dùng được trước hạn riêng.
- **4 service:** offline outcome giữ cùng proof để retry và không tự mutate/cancel; proof hết hạn sau offline vẫn bị từ chối; offline response về sau dispose/activate không phục hồi proof; terminal attempt-invalid vẫn dọn proof và chặn gọi tiếp.
- **2 form-flow:** mã gửi lại vẫn mở form mật khẩu sau lúc mã đầu đã hết hạn; offline outcome hiển thị MSG07, xóa cả hai field, không hiện thành công/không tự retry khi connectivity đổi; nhập lại và bấm mới complete thành công.

Self-review đọc lại diff, đường expiry/rate budget và lifetime cleanup; kiểm tra sự khác biệt giữa connectivity preflight, resolved offline, rejected transport và terminal outcome. Không phát hiện P1/P2 còn tái hiện trong hai bản sửa và các ca đã chạy. Không thay validation, role, navigation, proof purpose, token storage hoặc UI layout. Timeout không rõ kết quả không được tự suy thành offline chắc chắn chưa thực thi.

### S4. Kiểm tra cuối và phạm vi kết luận

| Kiểm tra | Kết quả mới nhất |
| --- | --- |
| `npm test` | **53 suites / 334 tests PASS**, gồm 12 regression mới |
| Hai probe local của mục R | **2 PASS**, không còn expected FAIL |
| `npm run lint` / `npm run typecheck` | PASS |
| `npx expo-doctor` | **21/21 PASS** |
| `npx expo export --platform web --output-dir .expo/recovery-p2-fix-2026-10-23` | PASS, có /recovery |

Không chạy lại browser/Expo Go hoặc nhập mật khẩu mới qua browser automation trong lượt S. Bằng chứng form ở đây là component test, ảnh browser ở mục F vẫn thuộc lượt trước. Đóng hai finding P2 này không hoàn thành API/native acceptance, production delivery/audit/eligibility hoặc Jira Done. README/context/plan đã bỏ cảnh báo “hai lỗi còn mở” ở trạng thái hiện tại; mục R chỉ giữ lịch sử.

Bài học 49 lưu local cùng giải thích TTL/rate window, terminal/non-terminal outcome, red/green, đáp án tự luyện; probe và các bài cũ vẫn ignored. Commit chỉ gồm hai file runtime, ba file regression, README/context/plan/báo cáo. Chỉ push `feature/OMTS-133-mobile-foundation`; không merge/rebase/force-push hay tạo PR. Mốc remote develop trước bàn giao vẫn `063acd5e193eedfa4e45236b720ddc3cb16a505a`; SHA fix và đối chiếu remote sau push được ghi ở phản hồi bàn giao.
