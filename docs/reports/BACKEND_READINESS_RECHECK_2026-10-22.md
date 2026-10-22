# Backend recheck cho Mobile — 22/10/2026

## Kết luận ngắn

**Có thể tiếp tục ghép UI qua mock; chưa đủ điều kiện đổi cả luồng Mobile sang API thật.** Repo có thay đổi so với baseline `14d7839`, nhưng những thay đổi đã đọc không bổ sung API đổi mật khẩu, OTP, onboarding, hồ sơ hoặc recovery. Không sửa code/backend, SRS hay Jira trong lượt kiểm tra này.

## 1. Đã kiểm tra nguồn nào?

Đã fetch remote `https://github.com/thaideptrai218/omts-backend.git`, đọc ref từ GitHub và dùng `git show`/`git diff` để kiểm tra từng nhánh. Checkout backend local vẫn ở detached `14d7839`; **không checkout/reset/pull đè file**. Vì vậy, nhận xét về ref mới bên dưới dựa trên nội dung đọc trực tiếp từ remote-tracking refs, không phải suy đoán từ thư mục checkout cũ.

| Ref được đọc | Commit | Ý nghĩa |
| --- | --- | --- |
| `develop` (default branch) | `c5360caef9fdea4c384d01c7caa6a91e8f7705dc` | Đã merge domain và schema baseline qua PR #2/#4; chưa chứa auth controllers |
| `feature/OMTS-126-auth-core` | `4e0b385` | Auth core login/refresh/logout |
| `feature/OMTS-127-zone-authorization` | `14d7839` | Baseline auth + zone authorization đã audit trước đây |
| `feature/OMTS-125-raft-and-refactor` | `e650c6967fedefe1de5b0f1d540ce6a7396db83a` | Tọa độ bè, Repository/Unit of Work, tách cấu trúc theo feature/layer |
| `feature/OMTS-128-audit-log` | `7a41aa6b9b632c48bb7f2c99e89d47aa0a5d50ba` | Bao gồm refactor phía trên và dịch vụ audit |

Hai commit merge trên develop có ngày 22/10. Các commit tọa độ/refactor/audit có ngày 19/10: mới **so với phạm vi audit cũ**, không phải khẳng định backend vừa viết chúng hôm nay.

So sánh `14d7839` với develop cho thấy auth chưa có ở develop. Không được gọi đây là "backend xóa auth" vì hai ref thuộc các nhánh/phạm vi khác nhau. PR #3 `feature/persistence-auth → develop` đang Closed, chưa merged; PR #2 và #4 đã merged. Danh sách PR đã kiểm tra không có PR đang mở trong các kết quả trả về.

## 2. Những thay đổi thực sự có ích

### Tọa độ bè

`Raft` có `Latitude` và `Longitude` nullable, cùng migration `AddRaftCoordinates`. Đây là dữ liệu nền cho bản đồ về sau. Chưa có API bè production trong các controller đã kiểm tra; chưa đủ để nối một màn bản đồ. Không tự đưa tọa độ lên QR công khai hoặc thêm yêu cầu định vị vì đó là quyết định nghiệp vụ/quyền riêng tư riêng.

### Repository và Unit of Work

Application chuyển từ phụ thuộc `IOmtsDbContext` sang các port `IAccountRepository`, `ILoginSessionRepository`, `IAccessGrantRepository`, `IUnitOfWork`…; cấu trúc Auth/Authorization/Dtos được tách theo feature. Đây là thay đổi phía trong backend; Mobile không nên đổi component hoặc route chỉ vì tên thư mục server thay đổi. Điểm cần bám là request/response HTTP.

### Audit log

Có `AuditLogService.Record`, serializer before/after, repository và unit tests trong source. Record thêm audit event vào Unit of Work để caller lưu cùng thay đổi; serializer có logic bỏ trường nhạy cảm theo tên và xử lý dữ liệu lồng nhau. Đây là **implementation trong source, chưa phải bằng chứng runtime đã kiểm thử tại máy này**. Không có HTTP audit endpoint mới trong controller inventory.

`JsonStringEnumConverter` mới xuất hiện trong serializer audit riêng. Nó **không** chứng minh API HTTP đã đổi clientType/subjectType/dataScope sang chuỗi; Program.cs không cấu hình converter JSON chung đó.

## 3. Các điểm chặn auth vẫn còn

Đã đọc `AuthController`, `MeController`, `AuthService`, `LoginRequest`, `AuthTokens`, `AccountStateGateFilter`, `Account` và `Program.cs` ở ref audit mới nhất được kiểm tra.

| Điểm cần cho Mobile | Bằng chứng hiện tại ở nhánh feature | Tác động |
| --- | --- | --- |
| Mobile session đúng loại | LoginRequest vẫn là enum ClientType và mặc định Web; chưa có converter HTTP chuỗi | Không bỏ clientType và không tự hard-code số enum trước khi nhóm chốt wire contract |
| Luồng email **hoặc** SĐT | AuthTokens vẫn có MustChangePassword/PhoneVerificationRequired; service/filter vẫn bắt verified phone cho Staff/Trader | Chưa khớp quyết định frontend đã xác nhận; không được tự chặn người đã xác minh email hoặc bỏ gate của server |
| Mật khẩu tạm | Account.TemporaryPasswordLifetime vẫn 24 giờ | Chưa phản ánh đề xuất frontend 72 giờ; không tự sửa SRS/backend |
| Khôi phục onboarding | GET /api/me chỉ trả accountId/sessionId/username/subjectType từ token | Thiếu trạng thái bước và masked declared contacts để dựng lại gate sau restart |
| Đổi mật khẩu, OTP | Inventory controller production chỉ có login, refresh, logout, me, permissions | Chưa thể hoàn tất forced-change và xác minh trên API thật |
| Hồ sơ, recovery, preferences/push | Chưa có controller production tương ứng trong ref đã đọc | Có thể ghép UI mock; không báo đã tích hợp backend |
| Offline revoke | Logout vẫn dùng bearer; chưa có opaque/idempotent deferred-revoke contract | Chỉ tiếp tục local-first logout; không giữ refresh token thật làm queue |

Refresh vẫn xoay token và xử lý reuse bằng revoke session. Coordinator single-flight phía client vẫn cần thiết; adapter thật phải phân biệt network failure, expired và access denied. Không được retry mutation không idempotent hoặc cho rằng timeout refresh đồng nghĩa server chưa xoay token.

## 4. Runtime và CI: phần nào có bằng chứng?

- GitHub CI tại `develop@c5360ca` và Secret scan đều **success** trong lượt kiểm tra. Đó là bằng chứng của develop, **không phải** bằng chứng feature auth/audit đã merge hoặc đã chạy đầy đủ trên QA.
- Máy local chỉ có SDK `10.0.103`; backend global.json yêu cầu `8.0.418`, rollForward latestFeature. Lệnh `dotnet test OMTS.sln --no-restore` tại checkout local dừng ở SDK resolution với "A compatible .NET SDK was not found". Chưa restore/build/chạy test; không sửa global.json để lách yêu cầu. Ref audit được đọc vẫn có cùng SDK pin.
- Chưa có QA base URL/tài khoản thử hợp lệ được xác nhận cho lượt này. Không gọi thử login bằng credential thật, không dựng DB/migration hoặc triển khai backend.

## 5. Làm tiếp theo thứ tự nào?

### Có thể làm ngay trong Mobile, chưa cần chốt lại nghiệp vụ đã xác nhận

1. Ghép controller hồ sơ đã có vào app stack qua mock profile service: load/skeleton/retry, xem/sửa đúng trường đã chốt, conflict giữ draft và session-expired teardown. Làm riêng một lát, không gộp contact replacement hoặc đổi quyền.
2. Ghép notification-preferences controller qua mock adapter hiện có; chỉ navigation và tương tác đã có contract. Không tuyên bố remote push chạy được trong Expo Go.
3. Tiếp tục kiểm thử Expo Go/thiết bị thật cho keyboard, safe area, Android/iOS Back, offline banner và logout. Chưa có thiết bị thì giữ trạng thái chưa kiểm chứng.

Đây là đề xuất thứ tự tiếp theo, **chưa triển khai các màn này trong lượt review**. Recovery/registration/đổi contact tiếp tục tách riêng; các opaque attempt/proof contract còn thiếu không được bịa để ghép cho xong.

### Điều kiện trước khi bật API thật xuyên suốt

1. Backend-dev xác nhận ref chạy QA; merge/deploy auth vào nhánh tích hợp theo quy trình của nhóm, hoặc cung cấp ref QA chính thức. Không tự merge thay họ.
2. Cung cấp base URL và OpenAPI/response fixture đúng deployment, chốt Mobile clientType và các enum wire còn bất nhất.
3. Backend/BA phản ánh email-or-phone, thứ tự gate, declared contact readonly và thời hạn mật khẩu tạm vào contract thống nhất. Người dùng đã chốt frontend, không hỏi lại cùng một quyết định; cần nhóm đồng bộ triển khai.
4. Có endpoint đổi mật khẩu, start/resend/verify OTP và endpoint khôi phục onboarding/session đủ trường. Nếu phải thay booleans thay vì nextAction, cần công bố mapping đầy đủ thay vì để từng màn tự suy diễn.
5. Sau đó làm một API adapter nhỏ, token repository SecureStore thật, kiểm thử refresh rotation/concurrency/logout và nghiệm thu Expo Go against QA. Không chỉ đổi biến env từ mock sang API rồi coi như xong.

## 6. Jira trong lượt kiểm tra

Đọc được [OMTS-133](https://welterial.atlassian.net/browse/OMTS-133) đang Done và parent [OMTS-121](https://welterial.atlassian.net/browse/OMTS-121) In Progress. DoD OMTS-133 vẫn yêu cầu Expo Go against QA API. Chưa có bằng chứng đó ở Mobile nên không dùng trạng thái Jira để kết luận code/API đã hoàn thành.

Cross-system search trả 502; gọi trực tiếp OMTS-151/160/168/180 trả 404 "Issue not found" trong lượt này. Không kết luận ticket bị xóa hay tự nhận chúng vẫn To Do/In Progress; phạm vi cũ chỉ là baseline tài liệu đã lưu. Không sửa trạng thái/comment/tạo Jira issue.

## Nguồn truy vết

- [Develop commit c5360ca](https://github.com/thaideptrai218/omts-backend/commit/c5360caef9fdea4c384d01c7caa6a91e8f7705dc), [PR #2](https://github.com/thaideptrai218/omts-backend/pull/2), [PR #4](https://github.com/thaideptrai218/omts-backend/pull/4), [PR #3 closed/unmerged](https://github.com/thaideptrai218/omts-backend/pull/3).
- [Feature audit commit 7a41aa6](https://github.com/thaideptrai218/omts-backend/commit/7a41aa6b9b632c48bb7f2c99e89d47aa0a5d50ba).
- [AuthTokens tại ref đã đọc](https://github.com/thaideptrai218/omts-backend/blob/7a41aa6b9b632c48bb7f2c99e89d47aa0a5d50ba/src/OMTS.Application/Features/Auth/Dtos/AuthTokens.cs), [AuthService](https://github.com/thaideptrai218/omts-backend/blob/7a41aa6b9b632c48bb7f2c99e89d47aa0a5d50ba/src/OMTS.Application/Features/Auth/AuthService.cs).
- [Account: 24 giờ](https://github.com/thaideptrai218/omts-backend/blob/7a41aa6b9b632c48bb7f2c99e89d47aa0a5d50ba/src/OMTS.Domain/Entities/Identity/Account.cs), [MeController](https://github.com/thaideptrai218/omts-backend/blob/7a41aa6b9b632c48bb7f2c99e89d47aa0a5d50ba/src/OMTS.Api/Controllers/MeController.cs).
- [CI develop đã kiểm tra](https://github.com/thaideptrai218/omts-backend/actions/runs/39732658180), [Secret scan develop](https://github.com/thaideptrai218/omts-backend/actions/runs/39732658405).
