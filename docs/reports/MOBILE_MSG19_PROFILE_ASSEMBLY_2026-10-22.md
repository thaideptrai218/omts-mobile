# MSG19 và ghép hồ sơ cá nhân bằng mock

> Review/bàn giao tiếp theo ngày 23/10: [báo cáo chung MSG19/profile/preferences](MOBILE_ACCOUNT_ASSEMBLY_REVIEW_2026-10-23.md), 50 suites / 292 tests. Các mục không commit/push bên dưới mô tả lượt triển khai ngày 22/10; lượt 23/10 có yêu cầu commit/push feature, không merge develop.

## Phạm vi được yêu cầu

Ngày 22/10/2026: sửa SESSION-UX-01 trước, rồi ghép hồ sơ cá nhân bằng mock theo từng micro-task. Không bật API thật, sửa backend/SRS/Jira hoặc merge develop. Commit/push không thuộc yêu cầu của lượt này.

## P1 — mang lý do hết phiên sang login

Đã tách trạng thái signedOut khỏi loading và bổ sung reason hẹp `sessionExpired`, chỉ giữ trong bộ nhớ session. Expired từ bootstrap hoặc protected request clear credential trước, rồi publish reason; login render MSG19 qua catalog. Người dùng bắt đầu nhập hoặc gửi login mới thì reason được xóa. Explicit logout không mang reason này. Không có token/message thô trong URL hoặc storage.

Kiểm tra sau P1: 2 suite session-store/flow, 18 tests pass. Có test thực tế expired từ màn bảo vệ → login có MSG19, không còn tên/mật khẩu, nhập lại xóa thông báo; logout chủ động không hiện MSG19. Các bước tiếp theo tiếp tục bổ sung kiểm chứng, không dùng số test này làm tổng cuối.

## P2 — hồ sơ mock và session boundary

Đã hoàn thành trong phạm vi mock. Giữ contract ProfileService hiện có: load profile, save displayName + opaque expectedRevision; username, role, contact không nằm trong payload cập nhật tên. ProfileGateway mới dùng cùng kho tài khoản của mock auth, không ghép fixture của một người khác. Tên lưu thành công được chuẩn hóa ở adapter và trả về cho form/session; logout rồi login lại trong cùng tiến trình vẫn thấy tên đó.

Service được gắn với accountId **và thế hệ phiên đăng nhập** qua AccountSessionScope. Kiểm tra trước request ngăn dịch vụ cũ sử dụng credential của phiên mới; kiểm tra sau request ngăn kết quả về muộn cập nhật tên hoặc kết thúc phiên mới. Hai lần đăng nhập cùng accountId vẫn là hai vòng đời khác nhau. Mock profile không lưu localStorage/AsyncStorage và không dùng SecureStore để chứa token giả.

Revision do mock gateway quản lý; UI chỉ gửi lại revision đã đọc. Một phiên mock thứ hai lưu tên sẽ làm revision cũ xung đột thật. Gateway trả conflict, không giả metadata người sửa/thời gian. Đây là application contract để thử controller, không phải quyết định chọn ETag/rowversion hay DTO backend.

Offline load/save trả trạng thái riêng cho controller hiển thị MSG07. Không gọi gateway khi đã biết offline, không xóa session, không queue mutation hoặc tự lưu khi có mạng trở lại.

## P3 — route và tương tác

Đã thay phần tóm tắt ở route `/account` bằng ProfileController hiện có, qua service ổn định theo phiên/tài khoản. Không tạo route trùng chức năng. Header dùng tên đã lưu, không dùng bản nháp làm danh tính chính thức. Cập nhật tên trong session không tạo lại service và không kích hoạt reload làm mất bản nháp.

Giữ skeleton/retry khi tải, pending tại nút lưu, conflict giữ draft và khóa lưu; chỉ reload thành công mới thay thế draft. Reload lỗi tiếp tục giữ draft và cho thử lại. Khi hết phiên, form bảo vệ bị gỡ trước khi về login nhận MSG19. Loading/error cũng có hành động đăng xuất để người dùng không mắc kẹt khi dịch vụ hồ sơ lỗi.

Username, loại tài khoản, zone–role và liên hệ hiển thị chỉ đọc. Liên hệ dùng giá trị đã che từ fixture auth, không dựng dữ liệu thật. Đổi mật khẩu mở `/security`, Hủy quay lại hồ sơ. Logout dùng hộp thoại xác nhận và store local-first hiện có. Chưa ghép contact-change/preferences nên không hiện các nút chưa có handler; không tạo nút no-op, panel showcase hoặc điều khiển lỗi trong app.

## P4 — tự review và lỗi thực tế

1. **SESSION-UX-01 đã sửa:** lý do expired sống trong session store, không phụ thuộc feedback cục bộ của component đã unmount. Explicit logout không nhận MSG19. Người dùng bắt đầu nhập/gửi login mới thì bỏ lý do cũ.
2. **Cleanup lỗi không làm mất lý do:** error của cleanup giữ `signOutReason`; Retry đi qua bootstrap để thử xóa lại và đưa đúng MSG19, không biến thành logout chủ động. Có regression test.
3. **Scope cũ sau tự hết phiên:** tự review phát hiện chỉ tăng generation khi logout là chưa đủ. Nếu expired rồi login lại cùng account, scope cũ có thể hợp lệ trở lại. `expireCurrentSession` hiện cũng tăng generation; test xác nhận scope cũ không gọi gateway, đổi tên hoặc expire phiên mới.
4. **Response thành công về muộn:** test để mock server lưu xong rồi giữ response đến sau logout/login tài khoản khác. Response này không cập nhật tài khoản mới; không chỉ thử request thất bại vì credential đã revoke. Không tuyên bố client có thể hủy một mutation đã được server chấp nhận.
5. **TypeScript bắt lỗi test:** `npm run typecheck` ban đầu báo TS2540 vì gán trực tiếp vào thuộc tính readonly `ProfileGateway.save`; TS7019/TS2556 xuất hiện tiếp do callback mất kiểu tham số. Đổi sang `jest.spyOn(...).mockImplementation(...)` giữ nguyên readonly contract và kiểu tuple; typecheck chạy lại pass. Không bỏ strict hoặc thêm any để né lỗi. Giải thích chi tiết ở bài học local 44.

Sau review và kiểm thử, chưa tìm thấy finding mới cần chặn lát mock này trong các trường hợp đã kiểm tra. Không đồng nghĩa không còn lỗi trên native/API thật.

## Nguồn nghiệp vụ và Jira

Đối chiếu UC05 trong Report3Finnal.md và controller/plan hiện tại: cập nhật tên; username/role chỉ đọc; xung đột yêu cầu tải lại; expired dùng MSG19. Đổi liên hệ cần luồng xác minh riêng nên không nối tắt vào save tên.

Đã thử đọc Jira trước khi triển khai: tìm kiếm trả 502; đọc trực tiếp OMTS-172 và ticket cha OMTS-141 trả 404 `Issue not found`. OMTS-133 đọc được, trạng thái Done nhưng mô tả vẫn yêu cầu Expo Go + QA API. Không suy luận trạng thái hiện tại của OMTS-172/141 từ tài liệu cũ, không thay đổi Jira. Tiếp tục theo phạm vi mock người dùng vừa phê duyệt, không tự chốt yêu cầu API còn thiếu.

## P5 — bằng chứng kiểm tra

- `npm test`: **47 suites / 268 tests pass**, 42.283 giây. Baseline trước lát này là 45 suites / 252 tests.
- Hai suite mới: `session-profile-service-test.ts` (9 tests) và `session-profile-flow-component-test.tsx` (5 tests); thêm 2 regression vào session store/flow có sẵn.
- Service test: shared identity, revision/conflict, offline không gọi gateway, scope cũ sau logout/expired/same-account relogin, onboarding không bypass, expired clear credential + reason, late successful save không chạm phiên mới.
- Component test: provider + store + controller + form thật; lưu/đăng nhập lại, conflict/reload lỗi rồi retry, offline giữ draft và không auto-save, load lỗi vẫn logout được, expired lúc lưu gỡ draft và login hiện MSG19. Expo Router được mock trong Jest; đây không phải native router E2E.
- `npm run lint`, `npm run typecheck`: pass sau thay đổi cuối.
- `git diff --check`: pass; không có file staged. Đã xác nhận learning, ảnh kiểm thử và output `.expo/` được ignore; vẫn ở `feature/OMTS-133-mobile-foundation`.
- `npx expo-doctor`: **21/21 pass**.
- `npx expo export --platform web --output-dir .expo/profile-review-web`: pass, **11 static route entries**, không phải 11 màn nghiệp vụ. Output nằm trong `.expo/` ignored. Cảnh báo NO_COLOR/FORCE_COLOR chỉ liên quan màu output terminal, không phải lỗi bundle.
- Browser localhost:8082: login `tran.thu.ha` → `/account`; đổi tên thành tên QA → save phản ánh ở header/form và có thông báo thành công; khôi phục tên fixture; mở `/security` → Hủy → hồ sơ; logout xác nhận → login rỗng không MSG19; login lại thấy đúng tên đã lưu. Không submit thay đổi mật khẩu qua browser trong lượt này.
- 360 CSS px: document clientWidth/scrollWidth đều 360; vùng cuộn chính clientWidth/scrollWidth đều 348, không tràn ngang. Đã trả viewport về mặc định. Screenshot local-only nằm trong `docs/learning/evidence/`; không đưa ảnh hoặc bài học lên Git.
- MSG19 do expired, conflict, offline và response muộn được kiểm chứng bằng test tự động; không thêm công tắc lỗi vào giao diện để giả kiểm thử browser.

## Kết quả cuối và giới hạn

Đã sửa MSG19 và ghép hồ sơ mock theo phạm vi được yêu cầu. Chưa có QA API/Expo Go/thiết bị thật, audit thật hoặc persistence production. Dữ liệu mock chỉ sống trong tiến trình; reload toàn bộ app reset fixture, không lưu PII xuống local storage. Không cập nhật dependency, backend, SRS, Figma hoặc Jira. Không commit/push hoặc merge trong lượt này.

Bước tiếp theo có thể làm: ghép preferences qua service gắn phiên tương tự, vẫn cần mock catalog rõ ràng; hoặc thực hiện checklist native/Expo Go khi có thiết bị. API hồ sơ phải chờ endpoint, DTO, concurrency và QA contract được xác nhận; không coi phần mock này hoàn tất OMTS-172 hay DoD OMTS-133.
