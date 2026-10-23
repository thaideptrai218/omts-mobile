# Ghép Đăng ký Thương lái bằng mock — 23/10/2026

## Kết luận và phạm vi

Đã ghép `/login` → `/register` → OTP → **Xác nhận tạo tài khoản** → thành công → về login → đăng nhập bằng liên hệ vừa xác minh. Tài khoản được tạo trong cùng nguồn auth mock, không tự đăng nhập, không cấp quyền nội bộ và **không tạo/liên kết Customer, hồ sơ khách hàng hoặc Order** theo yêu cầu người dùng.

Base `ff05615`, nhánh `feature/OMTS-133-mobile-foundation`, working tree sạch trước khi triển khai. Lượt ghép ban đầu chưa commit; lượt review/bàn giao sau được người dùng yêu cầu commit/push đúng nhánh hiện tại, không merge develop. Không sửa backend/SRS/Jira. Hoàn thành lát mock không đồng nghĩa toàn bộ UC01/OMTS-155 đã Done.

**Kết luận review mới nhất:** 56 suites / 371 tests PASS; thêm 7 test, không đổi runtime trong lượt review. Không tái hiện P1/P2 trong phạm vi đã kiểm tra; có **P3 REG-REV-01 còn mở** về hướng dẫn sai ngữ cảnh sau khi proof hết hạn. Xem mục R; test xanh không đồng nghĩa finding này đã sửa hoặc đủ điều kiện production.

## J1 — nguồn và thiết kế

- Đọc UC01, UC08, Table 3.4-3, form/selector/domain đã có và plan M6.1–M6.4. UC01 có bước xác nhận sau verify, nên không tạo tài khoản ngay trong callback OTP.
- Jira OMTS-155 và dependency OMTS-151 đọc trực tiếp đều trả `404 Issue not found`. Không xác minh được parent/linked issues hiện tại từ ticket; không đoán scope hoặc trạng thái mới. Tiếp tục theo phạm vi mock người dùng vừa duyệt, không đánh dấu Jira.
- Đọc SDK 57 [reference](https://docs.expo.dev/versions/v57.0.0/), [protected routes](https://docs.expo.dev/router/advanced/protected/), [Expo docs index](https://docs.expo.dev/llms.txt) và [React Native 0.86 accessibility](https://reactnative.dev/docs/0.86/accessibility). Reuse màn/primitive hiện tại; không đổi Figma hoặc thiết kế lại layout.
- `RegistrationGateway` là contract ứng dụng, không phải DTO endpoint. `RegistrationFlowService` giữ attempt/proof trong closure, không URL/storage/props; controller chỉ nhận trạng thái verified. Gateway mock giữ credential đăng ký đang chờ trong process memory, không persistent storage, xóa khi cancel/complete hoặc khi phát hiện expiry trong thao tác kế tiếp. Không dùng credential thật.

## J2 — mock gateway và nguồn tài khoản dùng chung

Gateway có start/resend/verify/complete/cancel. Start kiểm tra required/password policy và duplicate, chưa tạo account. Verify cấp proof riêng `traderRegistration`, không phải session hoặc proof recovery. Complete cần proof còn hạn, kiểm tra duplicate lần nữa rồi mới tạo account; thao tác create synchronous trong mock nên không có await chen giữa kiểm tra trùng và create.

Mỗi mã có 5 phút tính từ lần gửi riêng. Giới hạn mock 5 lần sai/3 lần gửi, cách 60 giây; resend không refill wrong attempts, code mới 246810/246811/246812 trong một cửa sổ. Cửa sổ ngân sách và proof TTL 5 phút là cấu hình mock, không chốt contract server. Rời/restart flow hủy proof/code nhưng không reset ngân sách. Delivery failure không tạo account. Mã/proof ID dự đoán được và plaintext password trong memory chỉ phục vụ mock, không dùng production.

`mock-session-gateway.ts` tạo Trader trong accounts hiện có; map identifier động dùng chung login/recovery/profile. Login mới hỗ trợ đúng email/SĐT đã verified của Trader. Staff fixture vẫn giữ hành vi login cũ. Full reload reset tài khoản mới và password, không phải DB mất dữ liệu.

Session ứng dụng thêm `subjectType: Staff | Trader` để không dùng role label hoặc số grants suy loại account. Đây không phải enum wire đã thống nhất với backend. Trader có grants rỗng; hồ sơ ghi đúng Thương lái. Chưa nhập tên thật nên displayName ban đầu dùng chính identifier đã nhập (không bịa tên cá nhân hoặc dùng tên HTX); có thể sửa qua hồ sơ hiện có. Username `mock-trader-*` chỉ là ID kỹ thuật thử, không chốt quy tắc đặt username sản phẩm.

Không tạo catalog thông báo nghiệp vụ Trader trong lát auth này: ẩn entry catalog hiện trường Staff và chặn route/gateway tương ứng cho Trader. Không suy ra rằng hệ thống thật cấm Trader dùng tùy chọn thông báo; chỉ catalog mock hiện tại chưa hỗ trợ subject này. Không có quyền đọc lịch sử khách hàng/đơn hàng hay grant nội bộ mới.

## J3 — form, route và session

`/register` thuộc auth group guard hiện có; login chỉ hiện entry khi runtime có registration factory. Form có draft identifier riêng theo email/SĐT: đổi tab không xóa dữ liệu kênh cũ và không diễn giải email thành số điện thoại. Validation local sai giữ draft để sửa; submit hợp lệ xóa hai password field trước await. Không lưu password/OTP/proof trong storage hoặc route.

MSG14 là phản hồi generic khi liên hệ không thể đăng ký, có đường login/recovery thật, không tiết lộ tên/account hay tại sao liên hệ không dùng được. Wrong/expired code dùng MSG16, offline MSG07, infrastructure/delivery MSG04. Khi bị giới hạn gửi ngay ở form, microcopy nói chưa thể gửi mã, không bảo người dùng nhập sai một mã họ chưa nhập.

Sau verify chỉ mở màn xác nhận. Bấm Tạo tài khoản mới complete; success tháo form và có nút Về đăng nhập. Hoàn tất không sinh session. Service dùng generation/dispose để response muộn không phục hồi flow; React dev setup/cleanup/setup không hồi sinh request cũ. Nếu server mock đã create trước khi response về muộn, bỏ qua response không được gọi là rollback.

Offline không queue/auto-retry. Start offline không gọi gateway và password field đã xóa. Confirmation offline giữ proof còn hạn để bấm lại thủ công; không gia hạn proof. Duplicate submit bị khóa. Cancel/back/reopen không khôi phục secret hoặc proof.

Mock Trader có một liên hệ verified thì `ready`, bám quyết định một trong hai liên hệ đã được người dùng chốt. UC02 bản SRS cũ/HTTP backend audit vẫn có phone-only gate; chưa sửa hoặc nối adapter thật để tự bỏ gate server. Cần đối chiếu lại contract khi tích hợp API.

## J4 — test và tự review

Thêm **3 suites / 29 tests** (12 gateway, 8 service, 9 form-flow) và **1 test** vào suite selector sẵn có: tăng từ 53/334 thành **56/364**.

- Gateway: email/SĐT, trước complete chưa login được, one-use proof, duplicate kể cả contact Staff chưa verified, race duplicate tại create, mã sai/expiry/resend/giới hạn, hủy/sai mục đích, delivery failure, grants rỗng/đúng loại account. Cross-feature test đổi tên Trader, recovery cùng nguồn, revoke lease Trader mà Staff không đổi.
- Service: proof không lộ UI, manual confirmation, preflight offline và adapter offline, retry không tự create, reset, late start/verify/resend/complete sau dispose, proof expiry không kéo dài.
- Form: hai đường đăng ký tới login/hồ sơ thật, MSG14→recovery, draft từng kênh, mã sai/resend, offline form/confirmation, pending duplicate/unmount/reopen, microcopy giới hạn gửi. Direct preferences route không hiện catalog Staff cho Trader.

Review đã đọc contract→adapter→service→hook→screen→runtime và tác động tới login/profile/recovery/preferences. Không phát hiện P1/P2 còn tái hiện trong scope mock và các ca đã kiểm tra. Không mở chức năng giao dịch hoặc âm thầm liên kết customer. Tự đánh giá này không chứng minh tính an toàn production.

### Lỗi thực tế và cách xử lý

1. `npm run typecheck`: TS2322 do mảng copy từ fixture `as const` vẫn mang union chỉ gồm accountId/identifier mẫu, không nhận identifier mới. Khai báo element type của danh sách động, không dùng any; typecheck qua lại.
2. Gateway test từng fail ở `.rejects` vì resolver notification mock ném đồng bộ trước khi trả Promise. Wrap invocation trong async callback để kiểm tra failure dù sync/async; không sửa runtime để làm test xanh. Service hiện có vẫn gọi trong try/await, mock gateway vẫn chặn Trader như dự kiến.
3. Form test: harness thiếu recovery factory nên tới màn unavailable; thêm factory đúng như runtime thật. Query pending button dùng nhầm “Đang xử lý” thay cho accessible name thực tế “Đang kiểm tra”; sửa query theo screen dump, không đổi label UI để khớp test.
4. Một lần test email E2E vượt timeout mặc định 5 giây (5358 ms); phone case và các case khác ngắn. Lần chạy lại case email 749 ms và full suite 26,476 giây; không tăng timeout/test.skip. Chưa chứng minh được nguyên nhân môi trường cụ thể, nên không ghi “do cache” như kết luận chắc chắn. Chưa tái hiện lại trong lần full cuối.
5. TS2353 do dùng `exact` của query API khác cho RNTL `getByRole`; bỏ option không được v14 hỗ trợ (string name vốn khớp đúng), giữ các label query hợp lệ. Typecheck cuối qua.
6. Browser phát hiện radio selector không có aria-checked ở DOM dù test native `.toBeChecked()` đã qua. Đọc code mapping RN Web cài sẵn và RN 0.86 typings; đổi sang role/aria-checked/aria-disabled. Browser sau sửa xác nhận true/false đúng và đổi ngược khi chuyển tab. Native host normalize ARIA nên assertion `.toHaveProp('aria-checked')` vẫn không phù hợp; native test dùng semantic checked + controlled rerender, DOM thực là bằng chứng web trước/sau. Không coi việc đổi assertion native là bằng chứng duy nhất đã sửa web.
7. Microcopy cooldown ở bước start từng dùng thông báo mã sai. Test riêng tái hiện đỏ; thêm wording theo action start, test xanh, không đổi thời gian chờ/hạn mức.

## J5 — bằng chứng cuối

| Kiểm tra | Kết quả |
| --- | --- |
| `npm test` | **56 suites / 364 tests PASS** |
| `npm run lint` / `npm run typecheck` | PASS |
| `npx expo-doctor` | **21/21 PASS**, không thay dependency |
| `npx expo export --platform web --output-dir .expo/registration-final-2026-10-23` | PASS, có /register |
| Browser localhost:8082 | Login → entry đăng ký → form; chuyển email/SĐT, lỗi required khi submit trống |
| 360 CSS px | document clientWidth/scrollWidth đều 360; không tràn ngang; form có cuộn dọc |
| Browser accessibility | Email/SĐT aria-checked true/false và false/true sau sửa |

Không nhập/submit password mới hoặc tạo account bằng browser automation. Signup/login xuyên suốt có bằng chứng component/gateway test, chưa có browser/device E2E cho credential creation. Ảnh form trống `docs/learning/evidence/trader-registration-2026-10-23.jpg` giữ local, viewport đã reset. Phải full reload một lần để stateful dev runtime nhận registration factory mới; không reset user session ở production để xử lý HMR.

## J6 — chưa xong và bàn giao

- Canonical format/canonicalization email/SĐT vẫn chưa chốt; giữ validation required/password hiện có, không tự bịa regex hay normalize password. Dùng `trader@example.invalid`, `0000000999` làm dữ liệu tổng hợp. Mock chưa chứng minh format validation theo đầy đủ SRS.
- Endpoint/DTO/error/duplicate/cancel/proof/session/persistence và audit production; SMS/email thật, hash password, anti-abuse/timing chống enumeration ở server; account lifecycle/lock và API/native QA.
- Customer creation/link/merge, offline customer lookup, order/history permissions chủ động ngoài scope được duyệt; vì vậy không claim đầy đủ postcondition UC01.
- Android/iOS keyboard, autofill/password manager, native Back, background/relaunch, font lớn và TalkBack/VoiceOver chưa nghiệm thu.
- Enum/gates/format/message mapping khi nối backend vẫn cần xác nhận; mock subjectType/username/rate-window không thành policy API.

README/context/plan đã cập nhật ở lượt ghép ban đầu. Bài học 50 lưu local kèm What/Why/How/Defense, lỗi và đáp án tự luyện. Trạng thái bàn giao mới nhất nằm ở mục R dưới đây.

## R — review độc lập và bàn giao nhánh, 23/10/2026

### R1. Đã kiểm tra những gì?

Đọc lại UC01, UC08 và Table 3.4-3 trong Report3Finnal.md; so sánh contract → gateway mock → service → hook → màn hình → provider/login/profile/recovery/preferences và auth/app guards hiện tại. Jira OMTS-155 và dependency OMTS-151 được đọc lại, cùng trả 404 `Issue not found`. Không xác minh được parent/linked issues từ ticket; không suy đoán trạng thái và không ghi Jira. Không đọc/sửa Figma ở lượt source/test review này.

Luồng giữ đúng ranh giới đã duyệt: OTP chỉ cấp quyền xác nhận, complete mới tạo Trader, không tự login, không grants nội bộ, không Customer/Order. Credential không xuống storage. Kiểm tra trùng lặp lại khi complete, proof dùng một lần, tách ngân sách từng liên hệ. Trader không nhận catalog ví dụ Staff; account mới vẫn dùng chung nguồn login/profile/recovery.

### R2. Finding P3 REG-REV-01 — thông báo sau khi proof hết hạn còn chỉ tới ô OTP đã bị tháo

**Trạng thái: OPEN, chưa sửa runtime.** Tại `use-registration-flow-controller.ts`, nhánh complete trả `attempt-invalid` reset về form đăng ký và chọn nguyên văn MSG16. Mã MSG16 dùng chung vẫn phù hợp ở màn OTP, nhưng ở form đầu không còn ô nhập mã hay nút Gửi lại mã.

**Tái hiện:** vào register với liên hệ tổng hợp mới → OTP đúng → màn Xác nhận tạo tài khoản → chờ đủ 300.000 ms kể từ verify → bấm Tạo tài khoản. Mock prune proof hết hạn, trả attempt-invalid; form Email/Mật khẩu/Nhập lại mật khẩu trống nhưng banner bảo “Bạn có thể nhập lại hoặc yêu cầu mã mới.” Test `expired confirmation clears the form and cannot create or log into an account` tái hiện bằng fake clock và xác nhận login vẫn bị từ chối.

**Tác động:** không tạo trái phép tài khoản hay mất tài khoản đã tạo; người dùng vẫn có thể đăng ký lại. Tuy nhiên hướng dẫn hiện tại không khớp hành động đang có, dễ gây bối rối. Xếp P3 trong phạm vi mock/UI, không phải lỗi vượt quyền P1/P2.

**Đề xuất:** giữ nguyên expired-proof guard và bước đăng ký lại; chỉ dùng wording theo ngữ cảnh complete, ví dụ “Xác nhận đăng ký đã hết hạn. Vui lòng nhập lại thông tin và xác minh để tiếp tục.” Không sửa MSG16 toàn hệ thống, không gia hạn proof, không tự resend/complete. **Nghiệm thu:** hết hạn → form trống với hướng dẫn đăng ký lại; không nhắc ô OTP không còn tồn tại; sai OTP ở màn xác minh vẫn giữ MSG16; không tạo account/no auto-retry. Lượt này người dùng yêu cầu review/report/delivery, chưa áp dụng đề xuất sửa runtime.

### R3. Bổ sung 7 test, không nới assertion để hợp thức hóa finding

- Gateway +2: cancel OTP trước verify không ảnh hưởng attempt của liên hệ khác; hai complete cùng proof chỉ tạo một mock account. Đây là kiểm chứng mock synchronous, không chứng minh API production có transaction/idempotency.
- Service +2: rejection trước khi tạo có thể retry thủ công, không tự create; response complete cũ không xóa proof của lượt đăng ký mới. Nếu create đã chạy trước response muộn, bỏ response không rollback dữ liệu.
- Form +3: proof hết hạn không tạo account và xóa form; rời màn confirmation hủy proof, quay lại không khôi phục bí mật; pending complete khóa hai nút, ngăn submit lặp và response muộn không mở success sau khi rời màn.

Test expiry là **characterization**: ghi nhận trạng thái hiện tại để review và bảo đảm không false-success; việc assertion MSG16 hiện qua không phải nghiệm thu wording. Khi sửa REG-REV-01 cần cập nhật expected copy và giữ nguyên assertions về account/form/expiry.

### R4. Bằng chứng chạy mới của lượt review

| Kiểm tra | Kết quả |
| --- | --- |
| Ba suite gateway/service/form đăng ký | 3 suites / 36 tests PASS |
| `npm test` toàn dự án | 56 suites / 371 tests PASS |
| `npm run lint`, `npm run typecheck` | PASS |
| `npx expo-doctor` | 21/21 PASS |
| `npx expo export --platform web --output-dir .expo/registration-review-2026-10-23` | PASS, có /register |
| `git diff --check` và staged diff check | PASS trước commit |

Không rerun browser/device/QA API trong lượt này; ảnh/bằng chứng 360 px và ARIA ở J5 thuộc lượt ghép trước. Fake timers/component harness không kiểm chứng native Back, autofill, bàn phím hoặc screen reader trên máy thật. Test exception trước create không chứng minh kết quả an toàn khi server thật đã ghi dữ liệu nhưng response bị mất; contract/idempotency khi tích hợp API vẫn cần chốt.

Đọc nhầm đường dẫn tài liệu test `docs/api/events/user-event.md` ban đầu trả `Cannot find path`; dùng `rg --files` tìm đúng `docs/api/user-event.md` và đọc đầy đủ cùng llm-guidelines/understanding-act trước khi sửa test. Đây là lỗi tra cứu file, không phải dependency/runtime; không cài lại package để xử lý.

### R5. Tự đánh giá và phạm vi bàn giao

Không phát hiện P1/P2 mới tái hiện trong các ca đã kiểm tra. Có một P3 đã mô tả đầy đủ và chưa sửa; các phần format/canonicalization, API, native QA, audit/delivery và postcondition Customer bị loại trừ ở J6 vẫn mở. Không gọi toàn bộ M6/UC01 hay OMTS-133 là hoàn thành, không merge-ready production chỉ vì test xanh.

Commit gồm source ghép đã review, test và tài liệu nhóm; bài học 50/51, ảnh, env, export và node_modules giữ local/ignored. Target duy nhất: `feature/OMTS-133-mobile-foundation`; không force push, không merge/PR, không thay develop. Remote trước delivery: feature `ff056150f2c8f70263af92a1f88696ab63f8289e`, develop `063acd5e193eedfa4e45236b720ddc3cb16a505a`. SHA và kết quả đối chiếu remote sau push được ghi trong bàn giao cuối, tránh nhúng SHA tự tham chiếu vào chính commit.
