# Mobile batch — Hồ sơ và độ ổn định tùy chọn thông báo

Ngày: 22/10/2026.
Nhánh: `feature/OMTS-133-mobile-foundation`.

## Phần 1 — Hồ sơ cá nhân

Đã thêm controller load/save và xử lý xung đột theo M10.2/M10.4. Báo cáo riêng:
`OMTS-172_M10_PROFILE_CONTROLLER_2026-10-22.md`.

## Phần 2 — Tùy chọn thông báo

Căn cứ: [OMTS-176](https://welterial.atlassian.net/browse/OMTS-176),
[OMTS-142](https://welterial.atlassian.net/browse/OMTS-142), phụ thuộc OMTS-133
đã được kiểm tra trong đợt trước, và SRS UC06.

### Lỗi phát hiện và cách sửa

**Hai lần gọi save có thể cùng gửi request.** Trước đó code chỉ kiểm tra
`state.saving`; hai event trong cùng lượt có thể cùng đọc false. Thêm ref khóa
đồng bộ, mở lại trong finally. Đang save thì change/cancel cũng bị chặn ở
controller; wrapper chỉ đóng nếu cancel được chấp nhận.

**Save và xin quyền có thể ghi mất cờ pending của nhau.** Cả hai nhánh từng dùng
snapshot `state` cũ. Khi gọi gần nhau, setState sau có thể phục hồi cờ false từ
snapshot đó. Dùng functional update để mỗi lần cập nhật giữ phần state mới nhất
của nhánh kia. Permission có khóa riêng để tránh mở cùng request nhiều lần.

**Parent callback đổi có thể làm mất draft.** Callback điều hướng nằm trong
dependencies của effect tải dữ liệu. Một render của parent tạo callback mới có
thể kích hoạt tải lại. Effect Event nhận callback mới nhất mà không làm tải lại;
service/repository vẫn nằm trong dependencies đúng chức năng.

**Session-expired vẫn để form ở trạng thái ready.** Test regression đã tái hiện:
expected `session-expired`, received `ready` kèm settings và MSG19. Load hết phiên
cũng từng đi vào lỗi có Retry. Đã thêm trạng thái terminal riêng, bỏ canonical
settings ở controller, ẩn form và phát callback sau state transition. Phản hồi
OS permission về muộn không phục hồi form. Cleanup session toàn ứng dụng và
route replacement vẫn do lớp tích hợp bên ngoài chịu trách nhiệm.

### Bằng chứng trước/sau

Lệnh tái hiện:

```text
npm test -- --runTestsByPath src/features/notifications/__tests__/notification-preferences-controller-test.tsx
```

Trước sửa terminal state: 2 failed, 6 passed. Một ca nhận error thay vì
session-expired; ca save nhận ready và settings thay vì terminal state.
Sau sửa: 8/8 passed. Các ca khác xác nhận save một lần, cancel bị chặn khi đang
lưu, hai progress flag cùng tồn tại, draft không mất khi callback parent đổi,
và kết quả permission về muộn không khôi phục phiên đã hết hạn.

## Kết quả kiểm tra batch

```text
npm test                              40 suites / 212 tests passed
npm run lint                          passed, no warnings
npm run typecheck                     passed
npx expo-doctor                       21/21 passed
npx expo export --platform web        succeeded, 3 scaffold routes
git diff --check                      passed
```

Metro có cảnh báo môi trường `NO_COLOR` bị `FORCE_COLOR` ghi đè; đây là tùy chọn
màu log, không phải lỗi compile. Export hoàn tất. Không dùng kết quả test để thay
bằng chứng QA API/thiết bị.

## Tự đánh giá và phần còn thiếu

Phạm vi frontend vừa bổ sung có tests cho chuyển trạng thái và giữ dữ liệu người
dùng. Các test này gọi service/repository giả tại ranh giới tiêm phụ thuộc, không
chứng minh API/backend thực tế hoạt động. Chưa có route auth/app hoàn chỉnh nên
web export chỉ là kiểm tra bundle những route hiện có; nó không chứng minh mọi
component chưa được route đã chạy trên điện thoại.

Profile API concurrency, session bootstrap/refresh, post-login gates, permission
payload, contact verification, push registration và deferred offline revoke vẫn
cần contract đã xác nhận. Không tick Done các ticket Mobile dựa trên batch này.

Chưa commit/push, chưa sửa Jira/SRS/Figma. Tài liệu học ở `docs/learning/39-...md`
và `40-...md` chỉ lưu local theo .gitignore.
