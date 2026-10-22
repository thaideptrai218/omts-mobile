# OMTS-172 — Điều khiển hồ sơ và xử lý xung đột

Ngày: 22/10/2026. Phạm vi: M10.2, phần frontend của M10.4 và M13.1.

## Căn cứ và giới hạn

Đã đọc lại [OMTS-172](https://welterial.atlassian.net/browse/OMTS-172),
[ticket cha OMTS-141](https://welterial.atlassian.net/browse/OMTS-141) và
[phụ thuộc OMTS-151](https://welterial.atlassian.net/browse/OMTS-151).
SRS UC05 nhánh 5a yêu cầu báo xung đột và tải lại; MSG06 yêu cầu không ghi đè
thay đổi của phiên khác. Username và vai trò không được chỉnh trong form.

Đây là implementation của contract và controller phía Mobile. Chưa có profile
API adapter, route được bảo vệ hay bằng chứng chạy với QA API. `revision` là
dấu phiên bản opaque tại ranh giới application, không khẳng định backend đã
chấp nhận ETag, rowVersion hoặc tên trường HTTP nào.

## Những micro-task đã triển khai

1. Thêm `ProfileService` với kết quả load/save phân biệt thành công, xung đột,
   username read-only và session hết hạn. Save chỉ nhận displayName và
   expectedRevision; không nhận username, role, email hoặc phone.
2. Thêm `useProfileController`: tải lần đầu, validation, pending, khóa gửi lặp,
   dùng giá trị canonical do service trả về và giữ draft khi lỗi/xung đột.
3. Nối controller với form thật qua `ProfileController`. Tải ban đầu dùng
   skeleton; lỗi tải có Retry; session-expired ẩn dữ liệu và form chỉnh sửa.
4. Khi conflict, form giữ tên đang nhập, khóa lưu bằng revision cũ và cung cấp
   “Tải lại và bỏ thay đổi”. Chỉ kết quả tải lại thành công mới thay draft.
   Nếu tải lại lỗi, draft và khóa conflict vẫn giữ nguyên.
5. Bổ sung MSG06 và MSG20 vào catalog theo nghĩa của SRS. Bản tiếng Việt vẫn
   thuộc baseline localization tạm thời đang dùng trong repository.
6. Thêm test hook và integration giữa controller với component thật. Helper
   deferred Promise nằm trong `shared/testing` để các feature không phụ thuộc
   vào fixture của nhau.

## Tự review

- Không sinh dấu phiên bản tại client hoặc tự tăng phiên bản của backend.
- Không tự retry save sau conflict và không lặng lẽ thay draft bằng dữ liệu mới.
- Không lưu tên/email/phone vào local storage trong slice này.
- Callback đổi identity khi parent render lại không gây tải lại và mất draft;
  callback xử lý load dùng `useEffectEvent`, còn service vẫn là dependency.
- Generation của request vô hiệu hóa phản hồi save sau unmount hoặc sau đổi
  service; load cũng có cleanup riêng để bỏ phản hồi cũ.
- Skeleton và mutation pending tách nhau; reload không làm nút Save quay spinner.
- Username rejection được xử lý phòng vệ nhưng username không thể đi vào payload.

## Bằng chứng kiểm thử

Ba suite controller/conflict/component có 19 ca kiểm thử. Các ca quan trọng:
invalid name không gửi; trim tên ở biên validation; save mang revision đã tải;
save sau thành công dùng revision mới; hai lần gọi chỉ gửi một request; conflict
giữ draft; reload thất bại không mất draft; session hết hạn; phản hồi sau unmount;
callback của parent đổi; skeleton, retry và nút tài khoản hoạt động qua form thật.

Kết quả kiểm tra toàn repository được ghi trong báo cáo batch
`OMTS_M13_PROFILE_NOTIFICATION_BATCH_2026-10-22.md`.

## Lỗi đã gặp

`npm run typecheck` báo TS2345 ở callback `renderHook`, rồi TS18046 ở các lần đọc
`result.current`. Tham số props chưa được khai báo khiến generic của RNTL 14
suy ra `unknown`. Khai báo kiểu props cụ thể đã sửa cả lỗi gốc và lỗi dây chuyền;
không dùng `any`. Lint cũng cảnh báo đọc ref trong effect cleanup; cleanup hiện
dùng generation đã chụp ở setup để vô hiệu hóa request theo đúng vòng đời.

Chi tiết lệnh, output, nguyên nhân và cách kiểm chứng nằm trong bài học local 39.

## Còn phải tích hợp

- Backend profile read/update DTO, mapping concurrency stamp và conflict metadata.
- Phân biệt lỗi từ chối chắc chắn với mất response sau khi server có thể đã lưu.
  MSG04 hiện giữ nghĩa theo catalog SRS; không nên dùng message “dữ liệu không
  đổi” cho timeout không xác định khi xây API adapter thật.
- UC08 contact-change wrappers, format/uniqueness, MSG57 và MSG62.
- Composition root phải tạo service ổn định trong một phiên và remount controller
  khi đổi tài khoản. Chưa có session integration để chứng minh ranh giới đó.
- Expo Go, QA API, Android/iOS, bàn phím và screen reader trên thiết bị thật.

Chưa đổi trạng thái Jira, chưa commit/push và chưa merge vào develop.
