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

## 3. Chưa có trên hệ thống (backend chưa có API)

Domain đã có bảng nhưng OMTS.Api chưa có controller, nên mobile chỉ hiện trang giải thích:

| Chức năng (FeatureKey) | Ghi chú |
|---|---|
| Chu kỳ nuôi, thả giống, nhật ký nuôi (`cycles`, `seeding`, `cultivationLog`) | Entity `CultivationCycle`, `SeedingEvent`, `CultivationLogEntry` |
| Thu hoạch, lô truy xuất (`harvest`, tra cứu `trace` vẫn dùng dữ liệu mẫu) | `HarvestEvent`, `TracePublication` |
| Hóa đơn, cân tại cảng, công nợ thương lái, phiếu thu, đối soát, hoàn tiền (`portWeighing`, `receivables`, `receipts`, `reconcile`, `refunds`) | Yêu cầu mua theo lồng đã có; chưa nối sang `SalesOrder`, hóa đơn hay cân thực nhận |
| Khiếu nại chất lượng, trả hàng của thương lái (`claims`) | `QualityClaim`, `PhysicalReturn` |
| Lương nhân công (`payroll`) | Phân công, chấm công và nghỉ phép cơ bản đã có API; chưa có đủ luồng tính/chốt lương |
| Báo cáo sản lượng, doanh thu (`reports`) | |
| Nhật ký hệ thống (`auditLog`) | Backend ghi audit nhưng chưa có API đọc |
| Gửi thông báo cho nhân viên, thương lái (`broadcast`) | |

Vì vậy Tổng quan của Chủ HTX chưa có sản lượng, doanh thu, công nợ thương lái; khi các API trên có, thêm vào
`features/dashboard/services/ownerSummaryService.ts`.

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
