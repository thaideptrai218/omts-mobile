# Ghép luồng Mobile: route → phiên mock → onboarding → logout

> Báo cáo của lát ghép ban đầu. Review tiếp theo đã bổ sung 7 regression tests và ghi finding SESSION-UX-01; xem [báo cáo review](MOBILE_SESSION_REVIEW_2026-10-22.md) và [backend recheck](BACKEND_READINESS_RECHECK_2026-10-22.md). Số test và trạng thái Git bên dưới là lịch sử của lát ghép, không thay thế kết quả review mới.

## Phạm vi được người dùng chốt

- Ghép các màn đã xây dựng qua mock adapter riêng trước; không coi là đã tích hợp QA API.
- Kiểm tra phiên trước khi mở màn bảo vệ; refresh đồng thời dùng chung một tác vụ.
- Lỗi mạng giữ credential để thử lại, không mặc định đăng xuất. Không tạo hàng đợi mutation nghiệp vụ.
- Staff: username/mật khẩu tạm → đổi mật khẩu → xác minh một email hoặc SĐT đã khai báo → ứng dụng.
- Không mở rộng onboarding Staff sang Owner, Trader hoặc Admin.

## Các lát thực hiện

1. Contract phiên, fixture tổng hợp và ranh giới lưu trữ mock.
2. Mock gateway, điều phối bootstrap/refresh/chuyển bước/logout và kiểm thử.
3. Route guard, login, onboarding và tài khoản cá nhân dùng dữ liệu phiên.
4. Kiểm thử xuyên suốt, lint/typecheck/export và tự review.

## Ranh giới quan trọng

Mock server và credential chỉ sống trong tiến trình. Reload toàn bộ app tạo lại fixture và yêu cầu đăng nhập; không giả vờ có server lưu phiên qua lần khởi động mới. Mật khẩu mới, mã xác minh và handle mock không được ghi vào localStorage, AsyncStorage hay file. Repository SecureStore cho token thật vẫn giữ nguyên, chưa nối với API chưa chốt.

Mock không gửi SMS/email. Mã thử chỉ nằm trong fixture và tài liệu thử, không xuất hiện trong màn ứng dụng hoặc log. Không được dùng tài khoản thật khi thử.

API thật, thời hạn phiên thật, payload permission, session rotation, deferred revoke offline và kiểm thử Expo Go/QA vẫn là việc riêng chưa hoàn thành. Không đổi SRS hoặc trạng thái Jira trong lát này.

## Đối chiếu nguồn và quyết định đã xác nhận

Đã kiểm tra Jira OMTS-133/151/160/168/180 cùng các parent OMTS-121/136/138/140/143, và các phần UC02/04/07/08 của `Report3Finnal.md`. SRS/Jira cũ còn yêu cầu verified phone và cho Staff nhập lại số; flow Staff được người dùng chốt cho frontend là đổi mật khẩu rồi xác minh **một email hoặc SĐT đã khai báo**, không sửa liên hệ trong gate. Đây là quyết định frontend đã được xác nhận, không phải khẳng định SRS/backend đã đồng bộ. Không áp dụng thay đổi này cho Trader/Owner/Admin. Đề xuất 72 giờ và wire `nextAction + onboarding` vẫn cần BA/backend phản ánh vào contract chính thức; mock này không mô phỏng temp-password expiry nên không tự coi phần đó đã triển khai.

UC07 còn mô tả deferred revoke offline. Lát hiện tại chỉ hoàn thiện local logout và không giả lập một hàng đợi thu hồi thật khi chưa có hợp đồng opaque/idempotent được nhóm xác nhận.

## Tiến độ và bằng chứng

### S1 — contract và dữ liệu thử

Đã tách session/gateway/credential repository khỏi component. Hai fixture Staff tổng hợp gồm tài khoản lần đầu và tài khoản đã onboarding; tên cá nhân, username và cặp vùng–vai trò riêng, không dùng tên HTX làm tên cá nhân. Không đưa Household/Farmer, Owner onboarding hoặc số liệu dashboard giả vào flow.

### S2 — coordinator, refresh và logout

Đã ghép bootstrap và phân biệt lỗi mạng với expired. Có single-flight refresh, kiểm tra generation/epoch trước khi ghi session, xử lý inspection cũ đến sau rotation và sắp thứ tự save/clear. Đổi mật khẩu trả session mới để cập nhật gate ngay, không yêu cầu một lần tải lại dễ thất bại sau khi mật khẩu đã đổi.

Logout ẩn nhóm app, xóa credential mock trước và không đợi revoke vô hạn. Clear lỗi không báo thành công hoặc cho vào app; cho thử cleanup lại. Offline không gọi revoke hoặc tạo queue. Adapter logout/API/SecureStore thật đã có ở lát trước chưa bị nối giả vào mock này.

### S3 — route và màn hình

- `(auth)/login`: dùng form hiện có, validate required, chống submit trùng, lỗi qua catalog, xóa mật khẩu sau kết quả. Các nút recovery/registration/QR chỉ render khi caller thực sự có handler; wrapper này không tạo route/nút no-op.
- `(onboarding)/onboarding`: đổi mật khẩu tạm trước; sau đó chỉ chọn email/SĐT đã khai báo, không cho sửa liên hệ. Một kênh xác minh thành công mở app; không ép xác minh kênh còn lại.
- OTP: sáu chữ số, 5 phút, 5 lần nhập/mã, tối đa 3 lần gửi/request, cách nhau 60 giây. Kiểm tra ở cả adapter lẫn trạng thái form. Back quay về chọn kênh không làm mất challenge còn hiệu lực hay reset ngân sách gửi. Đăng nhập lại bắt đầu request mock mới.
- `(app)/account`, `(app)/security`: entry hiển thị danh tính/cặp phân công/liên hệ từ phiên, đổi mật khẩu chuẩn và logout. Đây là account summary cho lát ghép phiên, chưa phải wrapper đầy đủ cho sửa hồ sơ/notification preferences.
- Root index trung tính trong bootstrap/lỗi, không render sẵn tài khoản. `Stack.Protected` chặn cả nhóm route; không đưa token/OTP/password vào params. Nhãn nhỏ “Dữ liệu trải nghiệm” phân biệt mock, không có bảng showcase/chú thích phát triển.

### S4 — test và tự review

Đã có unit/service tests cho thứ tự gate, email hoặc SMS, giới hạn OTP, resend bị từ chối vẫn giữ mã cũ, expired, offline giữ credential, refresh đồng thời, inspection/refresh/login về muộn sau logout, cleanup thất bại và revoke không phản hồi. Component integration ghép provider/store/controller/form thật từ login qua password, OTP sai/đúng tới tài khoản và logout; có hủy logout, Back chọn lại kênh và kiểm tra không còn mật khẩu trên login.

Browser smoke đã quan sát: Staff lần đầu mở đúng forced-change; tài khoản đã xác minh mở đúng tên cá nhân; mở/hủy đổi mật khẩu chuẩn; logout từ cả onboarding và app về login; browser Back sau logout không trở lại account. Đo account ở 360 CSS px được clientWidth=scrollWidth=360. Kiểm tra riêng deep link và lần chạy cuối sẽ bổ sung bên dưới.

Kiểm tra mở thẳng `http://localhost:8082/account` khi đã logout cũng render trang login, không hiện tên/tài khoản bảo vệ. HTML static export của account không chứa tên fixture, mật khẩu mẫu hoặc mã thử; fixture chỉ thuộc bundle mock được bật tường minh, không được coi là dữ liệu bí mật production.

## Tự đánh giá và giới hạn còn mở

- Đủ để tiếp tục review luồng UI mock theo thứ tự đã chốt; chưa đủ đánh dấu OMTS-133 hoặc các ticket auth Done.
- Chưa tích hợp QA API, lưu/khôi phục access/refresh thật, refresh-session expiry thật hoặc payload effective permissions. Role label hiện chỉ mô tả phân công; không được dùng làm bằng chứng permission navigation đã hoàn thiện. App chỉ mở các mục tài khoản dùng chung, không giả lập quyền cho feature hiện trường chưa nối.
- Mock chỉ login bằng username của fixture. Chưa mô phỏng toàn bộ lockout, tài khoản khóa, không grant, temp-password 72h hay mỗi loại subject; các message presentation đã có không đồng nghĩa các nhánh server đó đã tích hợp.
- Chưa ghép recovery, trader registration, contact-change/profile-edit, preferences/push hay business screens. Các controller/presentation trước đó vẫn giữ nguyên để ghép từng lát sau.
- Chưa có Expo Go/thiết bị thật, TalkBack/VoiceOver, bàn phím thực hoặc Android/iOS deep-link evidence. Browser responsive không thay thế native QA.
- Router test helper SDK 57 yêu cầu RNTL 13, trong khi repo dùng 14. Không hạ version hoặc báo sai là có renderRouter test; dùng test provider/form cùng browser route checks. [Expo Router testing](https://docs.expo.dev/router/reference/testing/), [protected routes](https://docs.expo.dev/router/advanced/protected/).
- Không sửa SRS/Jira/Figma; không mở rộng sang backend. Chưa commit/push/merge trong lượt ghép này. Bài học chi tiết nằm local ở `docs/learning/42-ghep-session-route-va-onboarding.md`, vẫn được gitignore.

## Lỗi thực tế đã xử lý

Typecheck phát hiện import PropsWithChildren từ sai module và conditional spread không thỏa union của ContentState. Lint phát hiện ref được đóng vào factory tại render. Đã sửa đúng nguồn import, tách nút retry và đưa connectivity vào runtime factory cập nhật từ effect; không dùng any hoặc tắt rule. Test ghép lần đầu dùng sai accessible label OTP, đã đối chiếu cây test và sửa query đúng tên thật. Metro build lần đầu khiến browser navigation timeout nhưng tab đã tới login; không xem đó là lỗi auth. Chi tiết chẩn đoán, lệnh và lý do nằm trong bài học local.

Một lượt full test đồng thời với build/lint/typecheck làm flow userEvent dài vượt ngưỡng 5 giây, kéo theo act/Pressability ở test kế tiếp. Đã đọc hướng dẫn userEvent v14, dùng fake timers + advanceTimers đúng API chỉ trong suite này và dọn timer sau mỗi test; không tăng timeout, không đổi thành fireEvent để né vấn đề. File test chạy lại verbose qua (flow dài 2468 ms, SMS 143 ms). Kết quả full rerun sau sửa được chốt bên dưới.

## Kết quả kiểm tra cuối

- `npm test`: **45 suites / 245 tests pass**, lần full rerun sau sửa fake timers mất 33.486 giây. Không còn timeout/act/Pressability trong lần chạy này.
- `npm run lint`: pass; `npm run typecheck`: pass.
- `npx expo-doctor`: **21/21 pass**. DNS exp.host từng lỗi ở lượt review trước không tái diễn lần này; không đồng nghĩa các npm audit finding cũ đã được sửa.
- `npx expo export --platform web`: pass, 11 static route entries (bao gồm alias nhóm route và route framework; không phải 11 màn nghiệp vụ).
- `git diff --check`: pass. `git check-ignore` xác nhận `.env.local` và bài học 42 không được đưa vào Git.
- Browser localhost:8082: login/forced gate/account/security cancel/logout/Back/direct protected URL đã kiểm tra như S4; 360 CSS px không tràn ngang ở account. Bản web Next.js localhost:3000 không bị chỉnh sửa.

Branch vẫn là `feature/OMTS-133-mobile-foundation`; chưa commit/push/merge. Bước tiếp theo nên là review luồng mock với người dùng, sau đó ghép từng wrapper tài khoản còn thiếu hoặc tích hợp API khi contract được chốt; không mở đồng loạt các màn nghiệp vụ.
