# Backend recheck cho Mobile — 23/10/2026

## Kết luận

**Backend đã bổ sung đáng kể API accounts/auth/profile/verification/recovery/preferences/push trong nhánh feature. Có thể chuẩn bị mapping API cụ thể, nhưng chưa bật luồng API thật trong Mobile.** Kết luận “chưa có các endpoint này” ở báo cáo 22/10 là lịch sử, không còn đúng cho ref ACS mới. `develop` vẫn chưa nhận chuỗi feature PR; chưa có QA URL/ref deployment được xác nhận.

Lượt này chỉ fetch/đọc source và metadata GitHub. Backend checkout vẫn detached `14d7839`, working tree sạch; không checkout/reset/pull, sửa file, migrate DB, triển khai, merge hay cập nhật Jira. Source mới được đọc bằng git show tại ref/SHA, không đọc nhầm checkout cũ rồi kết luận backend chưa làm.

## 1. Ref và PR đã kiểm tra

| Remote branch | SHA đọc mới | Nội dung quan sát |
| --- | --- | --- |
| develop, default | c5360caef9fdea4c384d01c7caa6a91e8f7705dc | Không đổi so với lần trước; domain/schema baseline |
| feature/OMTS-208-merge-foundation | 969f4a8c9de1643eedb37fe2f1982b999aa6c6b0 | Auth/authz/audit baseline theo develop, sửa login/refresh races |
| feature/OMTS-200-platform | 01b45c9adef9a0e630b67976aa4b1358479c6c6e | Messaging/storage/notification dispatch/bootstrap/readiness |
| feature/OMTS-198-acs | 27a8673f2befc1d01961647aafedd1d61674b5fa | Registration/OTP/recovery/password/profile/preferences/devices/accounts/roles |
| feature/OMTS-199-cooperative-employees | 608d9df101a73a5cb4b78708eee407acfd26747b | Controller hồ sơ HTX và nhân viên |
| feature/OMTS-210-farm-zones-rafts | ede5b0d19185378ec1b02196e0018d934abe42b4 | Controller vùng/giấy phép/bè |
| feature/OMTS-209-inp | b6ef471cb5ac08c6b7ab5851bb2bd744cfc495bd | Controller nhà cung cấp/vật tư/phiếu nhập/thanh toán |
| feature/OMTS-211-env | d69036eacd4fbd348979e871be1e5c1ad461448b | Controller đo nước/ngưỡng/lịch sử theo vùng |
| feature/OMTS-212-lab | 30b5ad0a488e7f006a71d8e924725de37612932d | Controller đội/công việc/chấm công/đơn giá/lương/thanh toán |
| docs/OMTS-135-sds-auth-coop-admin | 0f5a4e7 | SDS v1.1 tại docs/sds/sds-v1.1-auth-coop-admin.md |

Đã đọc sâu ACS và contract liên quan Mobile; các module nghiệp vụ khác mới kiểm tra inventory controller/commit, không phải full review nghiệp vụ hoặc nghiệm thu runtime. ProfileService có cùng blob `daed7a0d921b5c564418f59dcb497d5eb6d2fa82` ở ACS và các nhánh 199/209/210/211/212 đã kiểm tra; không suy ra mọi file của các nhánh đều giống nhau.

PR đang **OPEN**, chưa merged: [#5 foundation → develop](https://github.com/thaideptrai218/omts-backend/pull/5), [#6 platform → foundation](https://github.com/thaideptrai218/omts-backend/pull/6), [#7 ACS → platform](https://github.com/thaideptrai218/omts-backend/pull/7), [#8 employees → ACS](https://github.com/thaideptrai218/omts-backend/pull/8), [#9 farm → employees](https://github.com/thaideptrai218/omts-backend/pull/9), [#10 SDS → employees](https://github.com/thaideptrai218/omts-backend/pull/10), [#11 env → employees](https://github.com/thaideptrai218/omts-backend/pull/11), [#12 input → farm](https://github.com/thaideptrai218/omts-backend/pull/12), [#13 labor → env](https://github.com/thaideptrai218/omts-backend/pull/13). Đây là stack có nhánh rẽ, không phải toàn bộ feature đã nằm trong develop hoặc một nhánh cuối duy nhất.

## 2. API thật đã có gì ở ACS@27a8673?

| Luồng | Endpoint đã đọc | Chú ý khi map Mobile |
| --- | --- | --- |
| Login/refresh/logout | POST /api/auth/login, /refresh, /logout | Login phải gửi clientType Mobile; access/refresh DTO thật khác mock handle |
| Đăng ký | POST /api/verifications; POST /api/auth/register | Verify lấy token trước, register mang password + confirmation + token; backend tự tạo/link Customer |
| OTP | POST /api/verifications/{id}/resend và /verify | Verify trả token một lần TTL 10 phút, không trực tiếp ghi contact; response không có attemptsRemaining |
| Recovery | POST /api/auth/recovery; POST /api/auth/recovery/reset | Start 202 generic requestId/message; recovery resend dùng start lại, không gọi resend chung |
| Đổi mật khẩu | POST /api/me/password; /password/code | Current-password hoặc email proof; revoke mọi session cũ rồi trả tokens phiên mới; request clientType mặc định Web nếu bỏ qua |
| Hồ sơ | GET/PUT /api/me/profile | PUT displayName + rowVersion, trả profile/message; GET có raw contacts và flags, adapter phải map theo UI |
| Đổi liên hệ | POST /api/me/contact-changes; /contact-changes/confirm | Start channel/target → OTP verify → token → confirm; confirm chỉ ContactConfirmed, không full profile/revision |
| Onboarding SĐT | POST /api/me/phone-verification; /phone-verification/confirm | Backend vẫn phone-only, còn cho Staff nhập số khác |
| Preferences | GET/PUT /api/me/notification-preferences | Categories theo subjectType, eligible/reason; không giống ID catalog ví dụ mock hiện tại |
| Push device | POST /api/me/devices; DELETE /api/me/devices/{token} | Token/platform/permissionGranted; endpoint tồn tại không chứng minh push đã cấu hình/gửi thành công |

Nguồn: [MeProfileController](https://github.com/thaideptrai218/omts-backend/blob/27a8673f2befc1d01961647aafedd1d61674b5fa/src/OMTS.Api/Controllers/MeProfileController.cs), [MeSecurityController](https://github.com/thaideptrai218/omts-backend/blob/27a8673f2befc1d01961647aafedd1d61674b5fa/src/OMTS.Api/Controllers/MeSecurityController.cs), [VerificationsController](https://github.com/thaideptrai218/omts-backend/blob/27a8673f2befc1d01961647aafedd1d61674b5fa/src/OMTS.Api/Controllers/VerificationsController.cs), [SelfServiceDtos](https://github.com/thaideptrai218/omts-backend/blob/27a8673f2befc1d01961647aafedd1d61674b5fa/src/OMTS.Application/Features/Accounts/Dtos/SelfServiceDtos.cs).

### Những blocker cũ được gỡ ở source, không phải tại QA

- Program.cs **đã có JsonStringEnumConverter cho HTTP**. ClientType Web/Mobile, VerificationChannel Sms/Email, SubjectType và các enum được truyền bằng tên; numbers vẫn accepted. Không còn suy từ serializer audit như lần trước. Cần QA version đúng ref, không tự gửi số enum.
- NotificationChannel đã thêm **Zalo**, giữ Sms legacy nhưng không offered. Offered channels InApp/Push/Email/Zalo; Zalo hiện không eligible vì chưa cấu hình. Trader đã có categories Orders/TraceabilityQrSent, Staff có Orders/Work/DeadlineReminders/WaterAlerts. Việc mock hiện ẩn catalog Staff với Trader không phải policy thật cấm Trader có preferences.
- Có backend normalizer: SĐT 10 chữ số bắt đầu 0, chuyển +84/84, bỏ separator; email trim/lowercase, max256 và MailAddress validation. Đây là implementation cụ thể để nhóm xem/chốt thống nhất, chưa tự biến thành client rule đã được duyệt. Không port MailAddress thành một regex phỏng đoán.
- ProblemDetails có extension code và HTTP status theo outcome; có rate limits/retryAfterSeconds. Mobile nên map code an toàn thay vì render raw detail.

Nguồn: [Program.cs](https://github.com/thaideptrai218/omts-backend/blob/27a8673f2befc1d01961647aafedd1d61674b5fa/src/OMTS.Api/Program.cs), [NotificationPreferenceService](https://github.com/thaideptrai218/omts-backend/blob/27a8673f2befc1d01961647aafedd1d61674b5fa/src/OMTS.Application/Features/Accounts/NotificationPreferenceService.cs), [PhoneNumbers](https://github.com/thaideptrai218/omts-backend/blob/27a8673f2befc1d01961647aafedd1d61674b5fa/src/OMTS.Application/Common/Validation/PhoneNumbers.cs), [EmailAddresses](https://github.com/thaideptrai218/omts-backend/blob/27a8673f2befc1d01961647aafedd1d61674b5fa/src/OMTS.Application/Common/Validation/EmailAddresses.cs).

## 3. Điểm chưa khớp và đề xuất cụ thể cho BA/backend-dev

### A. Không đổi lại quyết định một liên hệ đã xác minh ở frontend

AuthTokens vẫn MustChangePassword/PhoneVerificationRequired; gate và PhoneVerificationService bắt verified phone cho Staff/Trader. Staff được nhập số khác trong onboarding, khác luồng frontend đã duyệt chỉ chọn email/SĐT Owner khai báo. TemporaryPasswordLifetime vẫn 24 giờ; các đề xuất thời hạn khác cần nhóm đồng bộ, không sửa SRS tại đây. `/api/me` vẫn claims-only; `/profile` đã có contact/grants nhưng không đủ để thay mọi phần session/gate bằng suy đoán client.

**Đề xuất:** backend/BA công bố thống nhất điều kiện email OR phone và declared-contact behavior theo quyết định đã xác nhận, cùng payload bootstrap/gate. Không hỏi người dùng chốt lại một quyết định cũ hoặc âm thầm bỏ gate server trong API adapter.

### B. Đổi liên hệ không nhận revision như mock

StartContactChangeRequest chỉ channel/target; ConfirmContactRequest chỉ token. ProfileService chỉ gọi RowVersionGuard ở UpdateAsync(displayName), không có expected revision từ lần start contact. Backend còn cho xác minh lại contact hiện tại nếu chưa verified; mock/SRS exception 3d đang từ chối giá trị bằng hiện tại. Không tự đồng nhất hai hành vi khác nhau.

**Đề xuất:** BA/backend chọn rõ: conflict theo toàn profile hay theo contact cũ của từng channel. Nếu yêu cầu phát hiện thay đổi từ lúc mở flow, lưu baseline/revision theo attempt và kiểm tra khi confirm, trả MSG06. Nếu muốn cho phép các sửa khác trường độc lập, cần quy tắc cụ thể và tests; không fake revision phía client để tạo cảm giác backend đã kiểm tra.

### C. Confirm trả thiếu canonical profile; tránh lỗi đọc-sau-ghi

HTTP verify chỉ cấp token. ConfirmContactChangeAsync lưu xong trả ContactConfirmed(contact, oldDocumentsHidden, notice), không rowVersion/profile; API adapter phải GET profile lại. Mobile mock hiện có finding **CONTACT-REV-01** khi ghi xong mà đọc lại lỗi, UI báo sai rằng không đổi dữ liệu.

**Đề xuất:** backend trả canonical profile/revision trong confirm để adapter không cần một GET quyết định success. Nếu vẫn hai request, client cần phân biệt “đã lưu, chưa tải lại hồ sơ” với “chưa ghi”; không tự gửi confirm/OTP lại hoặc claim unchanged. Không áp dụng fix/runtime API trong lượt review này.

### D. Customer side effects không thể chặn bằng việc UI không hiện Customer

RegistrationService gọi LinkNewTraderAsync; confirm phone của Trader gọi ApplyVerifiedPhoneAsync. Đây là side effect server, trong khi lát mobile được duyệt đang **không Customer/Order linkage**. **Đề xuất:** tiếp tục mock cho lát này; chỉ nối API thật sau khi scope Customer đã được đồng ý hoặc backend có contract phù hợp. Không bật API rồi giấu notice/oldDocumentsHidden.

### E. Recovery proof từ contact cũ: cần backend test/kiểm tra binding

Mobile đã recheck current verified binding trước dùng recovery code/proof. Trong source backend đọc được, PasswordRecoveryService.ResetAsync kiểm tra token/account Active nhưng không so token.Target/channel với contact verified hiện tại; ConsumeTokenAsync gọi expectedTarget null và chỉ kiểm tra token/purpose/account/expiry, không lookup contact. Start contact-change khác purpose cũng không tự hủy token recovery đã consumed OTP. Có đường code cho token từ email cũ còn sử dụng sau replacement; **đây là nhận xét static, chưa tái hiện runtime backend**.

**Đề xuất:** backend bổ sung integration test: lấy recovery token → đổi email/SĐT thành công → thử token cũ. Chốt quy tắc và kiểm tra target/channel/binding hiện tại trước reset hoặc hủy attempt liên quan theo transaction. Không tuyên bố đã sửa hay tạo Jira bug thay nhóm.

### F. OTP contract không giống metadata mock

Mã 5 phút/5 lần sai/3 sends/60 giây có ở source; proof thật TTL 10 phút, purpose tách Registration/VerifyEmail/ChangeEmail/ChangePhone/VerifyPhone/ChangePassword/AccountRecovery. Có ngân sách bổ sung 1 giờ, tối đa 5 request/10 sai theo purpose/subject; mock dùng window đơn giản khác. Không có attemptsRemaining trong VerificationStarted. **Đề xuất:** công bố response/error metadata còn lượt hoặc client không hiển thị con số không có thật; adapter phải map đầy đủ, không cộng/trừ phỏng đoán.

Nguồn cho các điểm B–F: [ProfileService](https://github.com/thaideptrai218/omts-backend/blob/27a8673f2befc1d01961647aafedd1d61674b5fa/src/OMTS.Application/Features/Accounts/ProfileService.cs), [RegistrationService](https://github.com/thaideptrai218/omts-backend/blob/27a8673f2befc1d01961647aafedd1d61674b5fa/src/OMTS.Application/Features/Accounts/RegistrationService.cs), [PasswordRecoveryService](https://github.com/thaideptrai218/omts-backend/blob/27a8673f2befc1d01961647aafedd1d61674b5fa/src/OMTS.Application/Features/Accounts/PasswordRecoveryService.cs), [VerificationService](https://github.com/thaideptrai218/omts-backend/blob/27a8673f2befc1d01961647aafedd1d61674b5fa/src/OMTS.Application/Features/Verification/VerificationService.cs).

## 4. Bằng chứng build/test/deploy: không đánh đồng

- PR #5 head 969f4a8 có build-test CI success ([run](https://github.com/thaideptrai218/omts-backend/actions/runs/39825993153)); PR vẫn OPEN/BLOCKED trong snapshot đã đọc. Develop CI c5360ca success là bằng chứng baseline, không phải toàn ACS.
- PR #7 head 27a8673 có PR title/gitleaks success nhưng **GitGuardian Security Checks FAILURE**, mergeStateStatus UNSTABLE. Chưa đọc hoặc công bố nội dung secret; không kết luận đã lộ secret chỉ từ status. Backend maintainer cần xử lý/xác minh check. Chưa thấy build-test ở rollup của head này; workflow chỉ main/develop nên PR base feature không tự chạy CI đó. File workflow đã thêm SQL Server test setup nhưng không coi nội dung config là bằng chứng các database tests đã chạy ở ACS head.
- Local SDK chỉ 10.0.103, global.json của ACS vẫn pin 8.0.418/latestFeature. `dotnet --version` tại checkout backend dừng SDK resolution `A compatible .NET SDK was not found`; chưa build/test feature source. Không sửa global.json, cài SDK hoặc checkout thay người dùng.
- Chưa có QA base URL/OpenAPI deployment/tài khoản được xác nhận; không gọi login thật, dev inbox hoặc migration. Endpoint có trong code không chứng minh provider email/SMS/push và QA đã sẵn sàng.

## 5. Có thể tiếp tục gì và cần ai chốt?

1. Mobile: xử lý finding CONTACT-REV-01 sau khi user duyệt fix; tiếp tục native QA. Không cần làm lại foundation vì backend thêm controller.
2. Backend-dev: chỉ định QA ref/SHA/URL/OpenAPI, xử lý status checks và xác nhận auth accounts stack được deploy; không cần đợi mọi nhánh nghiệp vụ merge nếu nhóm có QA feature environment được phê duyệt.
3. BA/backend: đồng bộ gate đã chốt, contact concurrency/current-unverified behavior, Customer side effects và recovery binding; thống nhất format/OTP metadata.
4. Sau đó mới có lát API adapter nhỏ: login Mobile + SecureStore + refresh + bootstrap/gates trước, rồi profile/contact. Verify token giữ private trong adapter/service, không thêm một màn nghiệp vụ chỉ vì HTTP có thêm bước confirm.
5. Preferences/push đã có endpoint để chuẩn bị mapping; production catalog vẫn cần đối chiếu, EAS project/credentials/device/development-build QA vẫn riêng. Offline logout deferred revoke vẫn chưa có opaque/idempotent endpoint ở inventory đã đọc; không giữ live refresh token làm queue.

Những điều này là **đề xuất tích hợp**, chưa được dùng để sửa SRS/Jira/backend hoặc bật API Mobile trong lượt này.
