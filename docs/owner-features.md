# Chức năng của Chủ HTX trên Mini App

Cập nhật 04/11/2026, đối chiếu với OMTS.Api đang phát triển (các controller có trong `src/OMTS.Api/Controllers`).

Chủ HTX (`isCooperativeOwner`) thấy Tổng quan riêng (`src/features/dashboard/components/OwnerDashboard/OwnerDashboard.tsx`): việc cần xử lý và số liệu
lấy từ API thật (`src/features/dashboard/services/ownerSummaryService.ts`), chức năng chia nhóm (`ROLES.owner.actionGroups`). Nhóm cuối
"Chưa có trên hệ thống" mở trang giải thích (`src/pages/FeaturePage.tsx`).

Mỗi màn quản lý là một file tải riêng khi mở (`lazyPage` trong `src/routes/lazyPage.tsx`), nên gói ban đầu
không lớn thêm theo số màn. Bản build 28/10: cả app 1,2 MB, file lớn nhất 546 KB (thư viện ZaUI + React), mỗi màn 2–7 KB.

## 1. Đã có trên mobile (nối API thật)

| Nhóm | Màn | Đường dẫn | API |
|---|---|---|---|
| Bán hàng | Yêu cầu mua: xem, chấp nhận số lồng và ngày nhận, hoặc từ chối có lý do | `/manage/purchase-requests` | `api/purchase-requests` |
| | Sản phẩm bán: thêm, sửa, ngừng bán/dùng lại | `/manage/sales-products` | `api/sales-products` |
| Vùng nuôi | Danh sách vùng (tìm, lọc trạng thái, tình trạng giấy tờ) | `/manage/zones` | `GET api/zones` |
| | Chi tiết vùng: thông tin, giấy tờ, ngưỡng nước, bè; sửa; ngừng dùng/dùng lại | `/manage/zones/:id` | `GET/PUT api/zones/{id}`, `…/discontinue`, `…/reactivate`, `GET api/zones/{id}/licenses`, `GET/PUT api/zones/{id}/water-thresholds`, `GET api/zones/{id}/rafts` |
| | Thêm/sửa vùng | `/manage/zones/new`, `/manage/zones/:id/edit` | `POST api/zones`, `PUT api/zones/{id}` |
| | Chi tiết bè: các hàng, lịch sử bố trí, chi phí vật tư; ngừng dùng/dùng lại | `/manage/rafts/:raftId` | `GET api/rafts/{id}`, `…/discontinue`, `…/reactivate` |
| | Thêm bè (số hàng, chiều dài), sửa thông tin bè | `/manage/zones/:id/rafts/new`, `/manage/rafts/:raftId/edit` | `POST api/zones/{id}/rafts`, `PUT api/rafts/{id}` |
| | Xem giấy tờ pháp lý | `/manage/licenses/:id` | `GET api/zone-licenses/{id}` |
| Chu kỳ nuôi | Chọn vùng rồi bè; vào từ Thả giống hoặc Nhật ký nuôi thì bè đang nuôi mở thẳng màn đó (11/11/2026) | `/manage/cycles`, `?for=seeding`, `?for=logs` | `GET api/zones/{id}/cultivation-cycles` |
| | Các chu kỳ của bè, bắt đầu chu kỳ mới với ước tính kế hoạch | `/manage/cycles/raft/:raftId` | `GET/POST api/rafts/{id}/cultivation-cycles` |
| | Chi tiết và tổng kết chu kỳ; sửa ngày bắt đầu và kế hoạch; hủy chu kỳ bắt đầu nhầm; đóng chu kỳ có đánh giá, đóng sớm thì Quản lý vùng xác nhận Chủ HTX đã đồng ý | `/manage/cycles/:cycleId` | `GET/PUT api/cultivation-cycles/{id}`, `…/summary`, `…/cancel`, `…/close/preview`, `…/close` |
| | Thả giống: các luống, tổng theo lô giống, ghi phiên, sửa hoặc xóa phiên có lý do, đánh dấu thả giống xong | `/manage/cycles/:cycleId/seeding` | `api/cultivation-cycles/{id}/seeding-records`, `…/seeding-complete`, `GET api/rafts/{id}/seed-lots`, `PUT api/seeding-records/{id}`, `…/remove` |
| | Nhật ký nuôi: ngày đi bè, ghi chú, 1 đến 10 ảnh; sửa hoặc xóa có lý do | `/manage/cycles/:cycleId/logs` | `api/cultivation-cycles/{id}/cultivation-logs`, `PUT api/cultivation-logs/{id}`, `…/remove` |
| Chỉ số nước | Số đo theo vùng, lọc trạng thái, cảnh báo vượt ngưỡng; nhập tay (nháp hoặc xác nhận ngay) | `/manage/water?zone=` | `GET/POST api/zones/{id}/water-measurements` |
| | Chi tiết số đo: xác nhận bản nháp, sửa số đo (có lý do, báo người khác đang sửa), hủy, các phiên bản | `/manage/water/:id` | `GET api/water-measurements/{id}`, `…/confirm`, `…/corrections`, `…/void`, `…/editing` |
| Mua hàng | Nhà cung cấp: danh sách, chi tiết, thêm/sửa, ngừng dùng/dùng lại | `/manage/suppliers…` | `api/suppliers` |
| | Công nợ nhà cung cấp, chi tiết từng nhà: số tổng, phiếu hoàn tất, các lần trả tiền | `/manage/supplier-debts…` | `GET api/suppliers/debts`, `GET api/suppliers/{id}/debt` |
| | Phiếu nhập: danh sách có tổng tiền, chi tiết, lập/sửa nháp, hoàn tất, hủy, ghi trả tiền | `/manage/purchases…` | `api/purchase-receipts`, `POST api/supplier-payments` |
| | Các lần trả tiền nhà cung cấp | `/manage/supplier-payments` | `GET api/supplier-payments` |
| | Danh mục vật tư: thêm, sửa, ngừng dùng/dùng lại | `/manage/input-items` | `api/farming-input-items` |
| | Chi phí vật tư theo bè | `/manage/raft-costs` | `GET api/purchase-receipts/raft-material-costs` |
| Tổ chức | Nhân viên: danh sách, chi tiết, thêm/sửa, cho nghỉ/làm lại | `/manage/employees…` | `api/employees` |
| | Tài khoản: danh sách, chi tiết, khóa/mở khóa, cấp/thu hồi vai trò theo vùng | `/manage/accounts…` | `api/accounts`, `api/accounts/{id}/grants` |
| | Vai trò cố định, chỉ xem quyền (BR-FARM-07) | `/manage/roles…` | `api/roles`, `api/permission-functions` |
| | Hồ sơ HTX: xem, sửa | `/manage/cooperative` | `GET/PUT api/cooperative/profile` |
| | Duyệt thương lái | `/account/trader-requests` | `api/trader-requests` |

Bổ sung 04/11/2026 (không sửa backend, chi tiết ở `docs/learning/14-field-photo-upload.md`):

| Nhóm | Màn | Đường dẫn | API |
|---|---|---|---|
| Chỉ số nước | Chụp máy đo, app đọc số, người đo đối chiếu rồi xác nhận | `/manage/water`, `/manage/water/:id` | `POST api/zones/{id}/water-measurements/recognize` |
| | Biểu đồ pH và độ mặn theo 30 ngày hoặc 12 tháng | `/manage/water` | `GET api/zones/{id}/water-measurements/chart` |
| Vùng nuôi | Thêm hoặc đổi ảnh bè (một ảnh) | `/manage/rafts/:raftId` | `POST api/rafts/{id}/photo` |
| | Thêm, sửa, thay giấy tờ bằng ảnh chụp | `/manage/licenses/new`, `/manage/licenses/:id/edit`, `/manage/licenses/:id/replace` | `api/zone-licenses` |
| Mua hàng | Trả hàng nhà cung cấp | `/manage/purchases/:id/return` | `POST api/purchase-receipts/{id}/returns` |

Backend mới có OCR giả (`Ocr:Provider = Fake`): bản Development trả số mẫu, môi trường khác báo không đọc được để người đo nhập tay.

## 2. Backend đã có API nhưng để bản web (không làm trên mobile)

| Chức năng | Lý do |
|---|---|
| Tải tệp PDF giấy tờ, chứng nhận; ảnh hóa đơn phiếu nhập | Mobile tải ảnh chứng nhận và logo HTX. Zalo chưa ghi rõ `openMediaPicker` chọn được PDF; PDF đã có thì xem bằng `openDocument`. |
| Xuất Excel chỉ số nước và phiếu nhập | Backend sinh tệp, xem trên web. |
| Sao chép phiếu (`…/copy`) | Nghiệp vụ kế toán ít dùng ngoài hiện trường. |
| Gắn tiền trả trước vào phiếu (`supplier-payments/{id}/allocate`) | Không làm: nhánh `OMTS-218` theo SRS 27/10 đã bỏ API này, tiền trả trừ vào công nợ của nhà cung cấp. |
| Sao kê công nợ theo kỳ, có số dư sau từng dòng, và xuất tệp (PURCHASE-04) | Chờ `OMTS-218-payments-debts` merge. Màn hiện tại chỉ có số tổng, phiếu hoàn tất và các lần trả tiền. |
| Đổi bố trí hàng của bè, sơ đồ bè, tình trạng từng hàng (`api/rafts/{id}/condition`) | Cần vẽ sơ đồ, màn nhỏ khó thao tác. |
| Ngưỡng nước chung toàn HTX (`PUT api/water-thresholds`) | Mobile sửa ngưỡng từng vùng; ngưỡng chung làm trên web. |
| Tạo tài khoản nhân viên, đặt lại mật khẩu, xem trước quyền (`POST api/accounts`, `…/reset-password`, `…/permission-preview`), gỡ tài khoản khỏi hồ sơ nhân viên | Mobile không có mật khẩu; tạo tài khoản cần cấp mật khẩu tạm cho bản web. |
| Tạo, sửa, sao chép vai trò | Bảng quyền nhiều cột, cần màn rộng. |

## 3. Bổ sung 11/11/2026: thay màn dữ liệu mẫu bằng màn nối API

Đối chiếu với backend `develop` (gồm OMTS-132) và nhánh harvest. Đã qua lint, typecheck và build production; **chưa chạy
với backend thật, chưa thử trong Zalo**.

| Nhóm | Màn | Đường dẫn | API |
|---|---|---|---|
| Vùng nuôi | Vật tư sửa bè: chọn vùng rồi bè, ghi lần sửa (nhiều vật tư), sửa có lý do | `/manage/material-usages`, `/manage/rafts/:raftId/material-usages`, `/manage/material-usages/:id` | `api/rafts/{id}/material-usages`, `api/material-usages/{id}` |
| | Cài đặt lô hàu: kg trung bình mỗi lồng, số ngày tự đóng lô, xem trước số lô bị đóng | `/manage/harvest-settings` | `api/harvest-settings`, `…/auto-close-preview` |
| Bán hàng | Khách hàng: danh sách, chi tiết, thêm/sửa, ngừng/dùng lại, ảnh, gộp hồ sơ trùng | `/manage/customers…` | `api/customers`, `api/customer-settings`, `api/banks` |
| | Công nợ thương lái: danh sách, sao kê theo kỳ, điều chỉnh công nợ | `/manage/customer-debts…` | `api/customer-debts` |
| | Phiếu thu, trả lại tiền, tiền chờ xác nhận | `/manage/customer-payments/new`, `…/pay-back`, `…/awaiting`, `…/:id` | `api/customer-payments` |
| | Tài khoản nhận tiền của HTX | `/manage/bank-account` | `api/cooperative/receiving-bank-account`, `api/banks` |
| | Khiếu nại: thương lái gửi từ hóa đơn (kèm ảnh) và theo dõi; Chủ HTX chấp nhận hoặc từ chối | `/account/claims…`, `/manage/quality-claims…` | `api/me/quality-claims`, `api/me/sales-invoices/{id}/quality-claims`, `api/quality-claims` |
| Lương | Bảng lương: tạo, tính lại, chốt, hủy, trả lương và tạm ứng, phiếu lương từng người | `/manage/payrolls…`, `/manage/payroll-slips/:id`, `/manage/payroll-employees/:id`, `/manage/payroll-payments` | `api/payrolls`, `api/payroll-payments`, `api/payroll-slips/{id}`, `api/employees/{id}/payslips` |
| | Bảng giá công: lịch sử giá, đổi giá từ ngày áp dụng, thêm, đổi tên, ngừng/dùng lại loại việc | `/manage/pay-rates…` | `api/job-types` |
| | Cài đặt lương | `/manage/payroll-settings` | `api/payroll-settings` |
| Tổ chức | Báo cáo sản lượng thu hoạch | `/manage/reports` | `api/harvest-yield` |
| | Lịch sử thao tác: lọc, xem trước/sau | `/manage/audit-log…` | `api/audit-events` |

Quyền hiện mục trên menu chỉnh theo backend: `payroll` chỉ Chủ HTX (`PayrollsController` có `[RequireCooperativeOwner]`),
`reports` theo `HARVEST_LOTS` (báo cáo sản lượng), `refunds` theo `CUSTOMER_PAYMENTS`.

### Còn để trang "chưa có" (bản dev mở dữ liệu mẫu)

| Chức năng | Lý do |
|---|---|
| Phiếu lương của nhân viên (`payslips`) | Backend chỉ cho Chủ HTX đọc phiếu lương; chưa có `api/me/payslips`. |
| Lịch nhận hàng (`pickup`), gửi thông báo (`broadcast`) | Backend chưa có API. |
| Báo cáo doanh thu | Quyền `SALES_REPORTS` có trong danh mục nhưng chưa có API nào dùng. |
| Trả hàng, giảm giá sau khiếu nại | Backend chỉ ghi đề xuất; phiếu trả hàng (CLAIM-03) và giảm giá (SALE-07) chưa có API. |

Tổng quan của Chủ HTX vẫn chưa có doanh thu, công nợ thương lái: thêm vào `features/dashboard/services/ownerSummaryService.ts`
khi cần (`api/customer-debts` đã có).

## 3b. Bổ sung 12/11/2026: theo luồng của bản web, chỉ lấy phần nhẹ

Nguyên tắc: mobile chỉ làm việc xem và thao tác nhanh ngoài hiện trường; việc nặng (sửa nhiều dòng, sổ sách, kế toán,
xuất tệp, cấu hình danh mục) để bản web. Luồng đọc ở `omts-web` (develop, 11/11/2026). Đã qua lint, typecheck và build;
**chưa chạy với backend thật, chưa thử trong Zalo**.

| Nhóm | Màn | Đường dẫn | API |
|---|---|---|---|
| Vùng nuôi | Truy vết lô hàu: tìm lô, thả giống từ đâu, bán cho ai; công bố, thu hồi | `/manage/lot-trace…` | `GET api/harvest-lots/trace-search`, `…/{id}/trace`, `…/publish-check`, `POST …/publish`, `…/withdraw-preview`, `POST …/withdraw` |
| Mua hàng | Xuất dùng vật tư: danh sách theo kỳ và trạng thái, tổng giá trị phiếu hoàn thành | `/manage/input-uses` | `GET api/input-issues?kind=Use` |
| | Lập phiếu xuất dùng: vùng, bè, loại xuất, người nhận, vật tư (đơn vị, lô giống); lưu là hoàn thành | `/manage/input-uses/new` | `POST api/input-issues` (`complete: true`), `api/input-issue-types`, `api/input-issues/receivers`, `api/farming-input-items/{id}/seed-lots` |
| | Chi tiết phiếu: hoàn thành hoặc xóa phiếu tạm, hủy phiếu có lý do (cộng lại kho) | `/manage/input-uses/:id` | `GET api/input-issues/{id}`, `…/complete`, `…/cancel`, `DELETE …/{id}` |

Để bản web (backend đã có API):

| Chức năng | Lý do |
|---|---|
| Xuất hủy vật tư (`kind=Disposal`) | Chỉ Chủ HTX ghi, việc kiểm kho làm tại bàn. |
| Lưu phiếu tạm, sửa phiếu xuất đã hoàn thành, sao chép phiếu, đặt mã hoặc giờ xuất riêng, ghi chú từng dòng | Sửa nhiều dòng và tính lại kho; mobile chỉ lập phiếu mới và hoàn thành ngay. |
| Thẻ kho của vật tư (`api/farming-input-items/{id}/movements`), xóa vật tư, xóa lô giống | Sổ nhiều cột, xem tại bàn. |
| Thêm, sửa loại xuất (`POST/PUT api/input-issue-types`) | Cấu hình danh mục. |
| Xuất tệp phiếu xuất (`api/input-issues/export`) | Backend sinh tệp, xem trên web. |

## 3c. Bổ sung 23/11/2026: thương lái thanh toán hóa đơn

Theo quyết định 21/11/2026: thương lái trả số còn nợ của **một** hóa đơn qua Checkout SDK của Zalo, payOS là bên thứ ba
(CLAUDE.md mục 10). Bản web giữ luồng VietQR của nó. Cần backend có PR `omts-backend#122` và các khóa `Checkout` trên
máy chủ; thiếu khóa thì server trả MSG04. Đã qua lint, typecheck và build; **chưa thử trong Zalo** (`CheckoutSDK.createOrder`
chỉ chạy trong Zalo).

| Màn | Đường dẫn | API |
|---|---|---|
| Nút "Thanh toán" ở hóa đơn còn nợ; mục "Thanh toán" trên trang chủ mở "Hóa đơn của tôi" | `/account/invoices` | `GET api/me/invoices/{id}` |
| Thanh toán: tạo lần thanh toán, mở trang của Zalo, chọn "Chuyển khoản bằng mã QR" thì hiện mã QR do app tự vẽ, lưu ảnh, chép số tài khoản, số tiền, nội dung; hỏi trạng thái mỗi 4 giây, khi quay lại app và khi bấm "Tôi đã chuyển khoản" | `/account/invoices/:id/pay` | `POST api/me/invoices/{id}/checkout`, `POST api/me/checkouts/{id}/zalo-order`, `GET api/me/checkouts/{id}` |

App không tự quyết định là đã trả: chỉ hiện "đã nhận đủ" khi server trả `paidInFull`. Không dùng `customer-payments/pending-transfer`
và `…/{id}/qr` (VietQR ngoài Checkout SDK). Lưu ảnh QR cần quyền `saveImageToGallery` được Zalo duyệt.

## 4. Dữ liệu demo bổ sung (28/10/2026)

Thêm qua API bằng tài khoản Chủ HTX (script ngoài repo), không sửa mã seed của backend:
vùng `DEMO-04` "Vùng nuôi Bản Sen" có 6 bè, ngưỡng nước riêng và 12 ngày số đo (số đo hôm nay vượt ngưỡng độ mặn để
có cảnh báo); một số đo nháp ở `DEMO-02`; 2 nhà cung cấp; 2 phiếu nhập cho Bản Sen (1 nháp, 1 hoàn tất còn nợ);
2 nhân viên; 2 yêu cầu tài khoản thương lái đang chờ duyệt (thêm thẳng vào bảng `Accounts` vì luồng thật cần Zalo).

## Công cụ chỉ có ở bản dev

- **Màn dữ liệu mẫu** (`src/features/mock`, route `/mock/:key`): mọi chức năng backend chưa có API đều mở được, có ghi rõ
  dữ liệu mẫu, thao tác chỉ giữ trong bộ nhớ. Bản production không chứa các màn này và vẫn mở trang "chưa có".
  Khi có API thật: làm màn thật, thêm vào `FEATURE_ROUTES` và bỏ khỏi `MOCK_FEATURES`.
- **Thử vai trò** trên trang chủ: Chủ HTX, Quản lý vùng, Nhân viên, Thương lái dùng công cụ `api/me/test-role` của backend
  (bật bằng `Development__TestRoles__Enabled=true` và `Development__TestRoles__OwnerAccountId=<id Chủ HTX đã liên kết Zalo>`).
  Kế toán dùng tài khoản demo `ketoan`, mật khẩu đặt ở `VITE_DEV_DEMO_PASSWORD` trong `.env.development.local` (không đặt ở `.env`, vì Vite đóng gói mọi biến `VITE_` vào bản production).
